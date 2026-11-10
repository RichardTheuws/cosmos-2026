#!/usr/bin/env python3
"""
generate_mvp_tracks.py — Sprint 8B batch driver.

Generates the 4 MVP tracks for Zorp's Universe (per
`public/assets/audio/music/_SUNO_PROMPTS.md`):

    1. title-theme.mp3        — slow-bloom psychedelic D-minor opener
    2. slow-bloom-loop.mp3    — Level 1 ambient loop (= slow-bloom-l1)
    3. inkpool-loop.mp3       — Level 4 ambient (= inkpool-hollow-l4)
    4. boss-stinger.mp3       — short stinger (5–10s) D-minor

Runs sequentially because:
  * sunoapi.org rate-limits sustained `/generate` bursts
  * we want a clean log of which prompt produced which track
  * 4 × ~3 min ≈ 12 min total walltime — acceptable

Output: `public/assets/audio/music/<name>.mp3` (and `.json` sidecar
with all variant URLs for manual A/B). On insufficient-credit failure the
script exits early so partial state is obvious.

NEVER prints the API key. Set it via the standard env-load:
    set -a; . ~/Documents/games/.env; set +a
    python3 scripts/sprint8b/generate_mvp_tracks.py
"""

from __future__ import annotations

import sys
from pathlib import Path

# Make the local module importable when running from repo root.
sys.path.insert(0, str(Path(__file__).parent))

from suno_client import SunoClient  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[2]
MUSIC_DIR = REPO_ROOT / "public" / "assets" / "audio" / "music"

# Each entry mirrors a row in `_SUNO_PROMPTS.md` but trims to the parameters
# Suno's `/generate` actually consumes (style + title; instrumental).
TRACKS: list[dict[str, str]] = [
    {
        # Track 1 from the prompts doc
        "filename": "title-theme.mp3",
        "title": "Cosmos Title Theme",
        "style": (
            "Warm folktronica title theme. Sparse wooden flute melody floating "
            "over koto plucks and granular pads. Vintage video-game warmth, "
            "Hisaishi Ghibli wonder kissed by Boards of Canada tape hiss. "
            "Distant field-recording crickets. Slow build, no drums until 1:00, "
            "then soft brushed kick and shaker. Eigen motif: 4-note descending "
            "D-A-F-D in koto, wooden flute answers an octave up. Tempo 92 BPM. "
            "End on suspended A-minor that resolves D-minor for loop."
        ),
    },
    {
        # Track 2 (slow-bloom-l1) renamed to the MVP filename
        "filename": "slow-bloom-loop.mp3",
        "title": "Slow Bloom Loop",
        "style": (
            "Curious mystical alien-mushroom forest theme. Translucent moss-sage "
            "atmosphere. Wooden flute high-register motif over fingerpicked nylon "
            "guitar harmonics, soft koto bed. Crickets and gentle wind field-"
            "recording. No percussion — just breathing. Discovery feeling, first "
            "wallcling moment. Light pizzicato strings shimmer at chorus. Tempo "
            "86 BPM. Loops seamlessly back to bar 1."
        ),
    },
    {
        # Track 4 (inkpool-hollow-l4) renamed to the MVP filename
        "filename": "inkpool-loop.mp3",
        "title": "Inkpool Hollow Loop",
        "style": (
            "Reflective ink-aubergine cave theme with ghost-mechanic tension. "
            "Slow ambient koto drone, wooden flute long sustained notes, reverse-"
            "reverb tape texture. Saffron bioluminescent moss feeling — warm "
            "pinpoints in dark. Subtle hand-drum heartbeat at 78 BPM. No melody "
            "hooks — pure atmosphere. Boards of Canada analog VHS warble. "
            "Loops seamlessly."
        ),
    },
    {
        # Boss stinger — short (Suno minimum is ~30s; we trim post-render)
        "filename": "boss-stinger.mp3",
        "title": "Boss Stinger D-minor",
        "style": (
            "Short ominous stinger. Single rising koto tremolo cluster, wooden "
            "flute drone, granular pad swell, suspended D-minor resolution. "
            "8-bar build, no resolution — leaves tension hanging. No drums. "
            "Folktronica timbre, no metal, no harsh distortion. Tempo 96 BPM."
        ),
    },
]


def main() -> int:
    client = SunoClient()
    balance = client.get_credits()
    print(f"credits available: {balance}")
    needed = 8 * len(TRACKS)  # ~8 credits per V4_5 generate
    if balance < needed:
        print(
            f"ERROR: insufficient credits — have {balance}, need ~{needed} for "
            f"{len(TRACKS)} tracks. Top up at https://sunoapi.org/ and re-run.",
            file=sys.stderr,
        )
        return 2

    MUSIC_DIR.mkdir(parents=True, exist_ok=True)
    successes: list[str] = []
    failures: list[tuple[str, str]] = []

    for i, t in enumerate(TRACKS, 1):
        print(f"\n[{i}/{len(TRACKS)}] {t['filename']}")
        out_path = MUSIC_DIR / t["filename"]
        try:
            task_id = client.generate(title=t["title"], style=t["style"])
            print(f"  taskId={task_id}")
            result = client.wait_for_task(task_id)
            if not result.tracks:
                raise RuntimeError("no tracks in response")
            pick = result.tracks[0]
            tmp = out_path.with_suffix(".raw.mp3")
            client.download(pick.audio_url, tmp)
            client.transcode_to_mp3(tmp, out_path, bitrate="112k")
            tmp.unlink(missing_ok=True)
            print(f"  ✓ saved {out_path.name} ({pick.duration_s:.1f}s)")
            successes.append(t["filename"])
        except Exception as exc:  # noqa: BLE001 — log and continue
            print(f"  ✗ FAILED: {exc}", file=sys.stderr)
            failures.append((t["filename"], str(exc)))

    print("\n────────── summary ──────────")
    print(f"success: {len(successes)} / {len(TRACKS)}")
    for name in successes:
        print(f"  ✓ {name}")
    for name, err in failures:
        print(f"  ✗ {name}: {err}")
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
