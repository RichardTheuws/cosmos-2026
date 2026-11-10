#!/usr/bin/env python3
"""
suno_client.py — sunoapi.org wrapper client for Zorp's Universe.

Provides a small, dependency-light Python client for the third-party Suno wrapper
at https://api.sunoapi.org. The official Suno service has no public API, so this
wrapper is what we ship against. Endpoints + schemas were verified against the
sunoapi.org docs on 2026-05-01 (Sprint 8B).

────────────────────────────────────────────────────────────────────────────
Verified endpoints (May 2026)
────────────────────────────────────────────────────────────────────────────

Auth header on every call:
    Authorization: Bearer <SUNO_API_KEY>

  POST /api/v1/generate
      Body (custom-mode instrumental, what we use for OST tracks):
          {
            "customMode":   true,
            "instrumental": true,
            "model":        "V4_5",   // V4 | V4_5 | V4_5PLUS | V4_5ALL | V5 | V5_5
            "style":        "<style-tag-string, max 1000 char on V4_5+>",
            "title":        "<track title>",
            "callBackUrl":  "<https URL>",   // REQUIRED even if we do not poll a webhook
            "negativeTags": "<comma-separated, optional>",
            "styleWeight":  0.0..1.0   // optional
          }
      Response:
          {"code":200,"msg":"success","data":{"taskId":"5c79****be8e"}}

  GET /api/v1/generate/record-info?taskId=<taskId>
      Polls the task. Response shape:
          {"code":200,"msg":"success","data":{
              "taskId":  "...",
              "status":  "PENDING" | "TEXT_SUCCESS" | "FIRST_SUCCESS" | "SUCCESS" | "...FAIL...",
              "response":{
                  "sunoData":[
                      {"id":"...","audioUrl":"https://...mp3","streamAudioUrl":"...",
                       "imageUrl":"...","title":"...","duration":198.44},
                      ...
                  ]
              }
          }}
      A single generate call returns TWO tracks (Suno default). We download the
      first variant per default and keep the second URL in `metadata` for manual
      review. Poll interval 15s, max wait ~6 min.

  GET /api/v1/generate/credit
      Returns {"code":200,"msg":"success","data": <float>}.
      The credit balance is a float — sunoapi.org bills fractionally per song.
      Empirically 1 V4_5 generate call costs ~8 credits → 4 tracks ~32 credits.

────────────────────────────────────────────────────────────────────────────
Gotchas (learned the hard way 2026-05-01)
────────────────────────────────────────────────────────────────────────────

* `callBackUrl` is REQUIRED even when you intend to poll instead. Use a dummy
  URL like `https://example.com/no-callback` — sunoapi.org will still POST to
  it on completion but the response is irrelevant when we poll.
* On insufficient credits the endpoint returns HTTP 200 with body
  `{"code":429,"msg":"The current credits are insufficient. ..."}`. ALWAYS
  inspect `code`, never trust the HTTP status alone.
* `customMode=true` requires both `style` and `title`. With `instrumental=true`
  the `prompt` field becomes optional (lyrics not used).
* The non-custom mode caps the prompt at 500 characters; custom mode V4_5+
  allows 1000-char `style` and 5000-char `prompt`.
* Each call is non-deterministic. If you don't like a render, call again with
  the same body — Suno generates a new pair of tracks.
* Streaming URL (`streamAudioUrl`) is available ~30–40 s after submission;
  full `audioUrl` after 2–3 min. We always wait for `audioUrl`.
* The wrapper itself is rate-limited softly: a sustained burst >1 req/s on
  `/generate` will start returning 429s. Run sequentially or with a small
  delay between submissions.

────────────────────────────────────────────────────────────────────────────
Usage
────────────────────────────────────────────────────────────────────────────

    # Single track
    python3 suno_client.py generate \\
        --title "title-theme" \\
        --style "folktronica, koto, wooden flute, D minor, no drums" \\
        --output public/assets/audio/music/title-theme.mp3

    # Batch — read prompts from a JSON file (see suno_batch.py)
    python3 suno_client.py credits

NEVER print or commit the API key — the client redacts it from any verbose
logging via the `_redact()` helper.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import requests

# ───────────────────────────────────────────────────────────────────────────
# Config
# ───────────────────────────────────────────────────────────────────────────

DEFAULT_BASE_URL = "https://api.sunoapi.org"
DEFAULT_MODEL = "V4_5"
DEFAULT_CALLBACK = "https://example.com/no-callback"
POLL_INTERVAL_S = 15
POLL_MAX_S = 6 * 60  # 6 minutes
GENERATE_PATH = "/api/v1/generate"
RECORD_PATH = "/api/v1/generate/record-info"
CREDIT_PATH = "/api/v1/generate/credit"

# Universal style suffix appended to every Cosmos OST track to enforce
# the D-minor folktronica palette per `_SUNO_PROMPTS.md`.
COSMOS_STYLE_SUFFIX = (
    " — folktronica, ambient koto, wooden flute, granular textures,"
    " analog tape hiss, organic warmth, no harsh highs, no aggressive drums,"
    " key D minor"
)

NEGATIVE_TAGS = (
    "blues rock, ZZ Top, generic cinematic trailer, dubstep, EDM drop,"
    " vocal samples, harsh distortion"
)


def _load_env() -> tuple[str, str]:
    """Load SUNO_API_KEY + SUNO_API_URL from env (must be already exported).

    Returns (api_key, base_url). Raises SystemExit with a non-leaking message
    if the key is missing.
    """
    api_key = os.environ.get("SUNO_API_KEY", "").strip()
    base_url = os.environ.get("SUNO_API_URL", DEFAULT_BASE_URL).strip().rstrip("/")
    if not api_key:
        sys.stderr.write(
            "ERROR: SUNO_API_KEY not in environment. Run:\n"
            "  set -a; . ~/Documents/games/.env; set +a\n"
        )
        sys.exit(2)
    return api_key, base_url


def _redact(value: str | None) -> str:
    """Mask secrets so they never end up in logs/error messages."""
    if not value:
        return "<empty>"
    if len(value) <= 8:
        return "***"
    return f"{value[:3]}***{value[-3:]}"


def _headers(api_key: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


# ───────────────────────────────────────────────────────────────────────────
# Public client
# ───────────────────────────────────────────────────────────────────────────

@dataclass
class SunoTrack:
    """One audio variant returned by `/record-info`."""
    track_id: str
    title: str
    audio_url: str
    duration_s: float
    image_url: str
    raw: dict[str, Any]


@dataclass
class GenerateResult:
    task_id: str
    tracks: list[SunoTrack]


class SunoClient:
    def __init__(self, api_key: str | None = None, base_url: str | None = None) -> None:
        env_key, env_url = _load_env()
        self.api_key = api_key or env_key
        self.base_url = (base_url or env_url).rstrip("/")
        self.session = requests.Session()
        self.session.headers.update(_headers(self.api_key))

    # — Credits ————————————————————————————————————————————————

    def get_credits(self) -> float:
        """Return current credit balance (float). Raises on transport error."""
        resp = self.session.get(f"{self.base_url}{CREDIT_PATH}", timeout=20)
        resp.raise_for_status()
        body = resp.json()
        if body.get("code") != 200:
            raise RuntimeError(f"credit lookup failed: {body.get('msg')}")
        return float(body.get("data", 0))

    # — Generate ———————————————————————————————————————————————

    def generate(
        self,
        *,
        title: str,
        style: str,
        prompt: str | None = None,
        instrumental: bool = True,
        model: str = DEFAULT_MODEL,
        callback_url: str = DEFAULT_CALLBACK,
        negative_tags: str = NEGATIVE_TAGS,
        style_weight: float | None = None,
    ) -> str:
        """Submit a generate request, return the taskId.

        Uses customMode=True so we can lock the style + title (required by
        `_SUNO_PROMPTS.md`). Callers should call `wait_for_task()` next.
        """
        body: dict[str, Any] = {
            "customMode": True,
            "instrumental": instrumental,
            "model": model,
            "style": (style + COSMOS_STYLE_SUFFIX)[:1000],
            "title": title[:80],
            "callBackUrl": callback_url,
            "negativeTags": negative_tags,
        }
        if prompt and not instrumental:
            body["prompt"] = prompt
        if style_weight is not None:
            body["styleWeight"] = max(0.0, min(1.0, style_weight))

        resp = self.session.post(
            f"{self.base_url}{GENERATE_PATH}", json=body, timeout=30
        )
        resp.raise_for_status()
        data = resp.json()
        if data.get("code") != 200:
            # Note: 429 (insufficient credits) comes back as HTTP 200 with code=429
            raise RuntimeError(f"generate failed (code={data.get('code')}): {data.get('msg')}")
        task_id = data["data"]["taskId"]
        return task_id

    # — Polling —————————————————————————————————————————————————

    def fetch_task(self, task_id: str) -> dict[str, Any]:
        resp = self.session.get(
            f"{self.base_url}{RECORD_PATH}", params={"taskId": task_id}, timeout=20
        )
        resp.raise_for_status()
        body = resp.json()
        if body.get("code") != 200:
            raise RuntimeError(f"fetch_task code={body.get('code')}: {body.get('msg')}")
        return body.get("data", {})

    def wait_for_task(
        self,
        task_id: str,
        *,
        poll_interval: int = POLL_INTERVAL_S,
        max_wait: int = POLL_MAX_S,
        verbose: bool = True,
    ) -> GenerateResult:
        """Poll `/record-info` until `audioUrl` is filled or we time out.

        Suno populates streamAudioUrl first (~30-40 s) then audioUrl (~2-3 min).
        We wait for audioUrl because we want to download a stable file.
        """
        deadline = time.time() + max_wait
        last_status = ""
        while time.time() < deadline:
            data = self.fetch_task(task_id)
            status = str(data.get("status", "")).upper()
            if status != last_status:
                last_status = status
                if verbose:
                    print(f"  [{task_id[:6]}…] status={status}", flush=True)
            if "FAIL" in status or "ERROR" in status:
                raise RuntimeError(f"task {task_id} failed: status={status}")
            sd_list = ((data.get("response") or {}).get("sunoData")) or []
            ready = [sd for sd in sd_list if sd.get("audioUrl")]
            if status == "SUCCESS" and ready:
                tracks = [
                    SunoTrack(
                        track_id=str(sd.get("id", "")),
                        title=str(sd.get("title", "")),
                        audio_url=str(sd.get("audioUrl", "")),
                        duration_s=float(sd.get("duration", 0) or 0),
                        image_url=str(sd.get("imageUrl", "")),
                        raw=sd,
                    )
                    for sd in ready
                ]
                return GenerateResult(task_id=task_id, tracks=tracks)
            time.sleep(poll_interval)
        raise TimeoutError(
            f"task {task_id} did not finish within {max_wait}s (last status={last_status})"
        )

    # — Download + transcode ——————————————————————————————————————

    @staticmethod
    def download(url: str, out_path: Path) -> Path:
        """Stream-download a URL to disk."""
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with requests.get(url, stream=True, timeout=120) as resp:
            resp.raise_for_status()
            with open(out_path, "wb") as fh:
                for chunk in resp.iter_content(chunk_size=64 * 1024):
                    if chunk:
                        fh.write(chunk)
        return out_path

    @staticmethod
    def transcode_to_mp3(src: Path, dst: Path, bitrate: str = "112k") -> Path:
        """Re-encode src to mono-friendly 112 kbps MP3 via ffmpeg.

        Suno usually returns MP3 already, but we re-encode anyway to:
        * normalise loudness target (-14 LUFS-ish, simple `loudnorm`)
        * cap bitrate so payload size is reasonable for theuws.com hosting
        """
        dst.parent.mkdir(parents=True, exist_ok=True)
        cmd = [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(src),
            "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
            "-codec:a", "libmp3lame",
            "-b:a", bitrate,
            str(dst),
        ]
        subprocess.run(cmd, check=True)
        return dst


# ───────────────────────────────────────────────────────────────────────────
# CLI
# ───────────────────────────────────────────────────────────────────────────

def cmd_credits(_: argparse.Namespace) -> int:
    client = SunoClient()
    bal = client.get_credits()
    print(f"credits: {bal}")
    if bal < 8:
        print("WARNING: <8 credits — a single V4_5 generation needs ~8 credits.",
              file=sys.stderr)
        return 1
    return 0


def cmd_generate(args: argparse.Namespace) -> int:
    client = SunoClient()
    bal = client.get_credits()
    print(f"credits before: {bal}")
    if bal < 8:
        print("ERROR: insufficient credits (<8). Top up at sunoapi.org.",
              file=sys.stderr)
        return 2

    print(f"submitting: {args.title!r}")
    task_id = client.generate(
        title=args.title,
        style=args.style,
        instrumental=True,
        model=args.model,
    )
    print(f"taskId: {task_id}")

    result = client.wait_for_task(task_id)
    if not result.tracks:
        print("no tracks ready", file=sys.stderr)
        return 3

    pick = result.tracks[0]
    print(f"picked variant: {pick.track_id} duration={pick.duration_s:.1f}s")

    out_path = Path(args.output)
    tmp_path = out_path.with_suffix(".raw.mp3")
    client.download(pick.audio_url, tmp_path)
    print(f"downloaded raw → {tmp_path}")
    client.transcode_to_mp3(tmp_path, out_path, bitrate=args.bitrate)
    tmp_path.unlink(missing_ok=True)
    print(f"saved → {out_path}")

    # Save sidecar metadata for manual review of the second variant.
    meta = {
        "task_id": task_id,
        "primary_id": pick.track_id,
        "duration_s": pick.duration_s,
        "all_variants": [
            {"id": t.track_id, "url": t.audio_url, "duration_s": t.duration_s}
            for t in result.tracks
        ],
    }
    out_path.with_suffix(".json").write_text(json.dumps(meta, indent=2))

    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="sunoapi.org client for Cosmos OST")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_credits = sub.add_parser("credits", help="Show remaining credit balance")
    p_credits.set_defaults(fn=cmd_credits)

    p_gen = sub.add_parser("generate", help="Generate one track")
    p_gen.add_argument("--title", required=True, help="Track title (≤80 chars)")
    p_gen.add_argument("--style", required=True,
                       help="Style tags string. Suffix is auto-appended.")
    p_gen.add_argument("--output", required=True, help="Output mp3 path")
    p_gen.add_argument("--model", default=DEFAULT_MODEL,
                       help="Suno model (default V4_5)")
    p_gen.add_argument("--bitrate", default="112k",
                       help="ffmpeg MP3 bitrate (default 112k)")
    p_gen.set_defaults(fn=cmd_generate)

    args = parser.parse_args()
    return int(args.fn(args) or 0)


if __name__ == "__main__":
    sys.exit(main())
