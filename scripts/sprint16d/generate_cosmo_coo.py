#!/usr/bin/env python3
"""
Sprint 16D — gibberish-coo generation via ElevenLabs Sound Generation API.

Sprint 15D mistakenly hooked up the hint-orb Dutch voice (`globe-l1-1.mp3`)
as the BONDING-state stinger ("3-syllable kid-alien babble"). The hint orb
voice is a full Dutch sentence — wrong character, wrong language, breaks
the WEIRDO-brief. This script replaces it with three short prompted variants
generated via the ElevenLabs Sound Generation endpoint (text-to-sound, NOT
voice cloning) so the result is genuinely non-language gibberish-coo.

Output:
  public/assets/audio/sfx/cosmo-coo-1.mp3
  public/assets/audio/sfx/cosmo-coo-2.mp3
  public/assets/audio/sfx/cosmo-coo-3.mp3

Cost: ~$0.20 total for 3 variants (sound-generation pricing as of 2026-04).

Usage (env loaded from ~/Documents/games/.env):
  set -a; . ~/Documents/games/.env; set +a
  python3 scripts/sprint16d/generate_cosmo_coo.py
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

EL_KEY = os.environ.get('ELEVENLABS_API_KEY')
if not EL_KEY:
    sys.exit('ELEVENLABS_API_KEY not set; load ~/Documents/games/.env first.')

REPO_ROOT = Path(__file__).resolve().parents[2]
SFX_DIR = REPO_ROOT / 'public' / 'assets' / 'audio' / 'sfx'
SFX_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR = Path(__file__).resolve().parent / '_logs'
LOG_DIR.mkdir(exist_ok=True)

VARIANTS = [
    {
        'label': 'cosmo-coo-1',
        'prompt': (
            'tiny cute alien baby cooing, 3 syllable nonsensical babble, '
            'kid-alien gibberish, no language, soft, friendly'
        ),
        'duration': 1.0,
    },
    {
        'label': 'cosmo-coo-2',
        'prompt': (
            'small alien creature wonder coo, 4 syllable melodic gibberish, '
            'child-like, mystic'
        ),
        'duration': 1.2,
    },
    {
        'label': 'cosmo-coo-3',
        'prompt': (
            'weird cosmic baby gurgle, ascending 3-tone babble, no words, dreamy'
        ),
        'duration': 0.9,
    },
]


def el_sound(prompt: str, duration_s: float, target: Path) -> dict:
    body = json.dumps({
        'text': prompt,
        'duration_seconds': duration_s,
        'prompt_influence': 0.6,
    }).encode('utf-8')
    req = urllib.request.Request(
        'https://api.elevenlabs.io/v1/sound-generation',
        data=body,
        headers={
            'xi-api-key': EL_KEY,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            data = r.read()
        target.write_bytes(data)
        return {'status': 'ok', 'size': len(data), 'path': str(target)}
    except urllib.error.HTTPError as e:
        return {'status': 'failed', 'http': e.code,
                'body': e.read().decode('utf-8', 'ignore')[:300]}
    except Exception as e:
        return {'status': 'failed', 'error': str(e)}


def main() -> int:
    print('=== Sprint 16D — Cosmo coo gibberish generation ===')
    results = []
    for v in VARIANTS:
        target = SFX_DIR / f"{v['label']}.mp3"
        print(f"[REQ] {v['label']} dur={v['duration']}s prompt={v['prompt'][:60]}...")
        r = el_sound(v['prompt'], v['duration'], target)
        record = {
            'label': v['label'],
            'prompt': v['prompt'],
            'duration': v['duration'],
            **r,
        }
        results.append(record)
        if r['status'] == 'ok':
            print(f"[OK]  {v['label']} -> {target} ({r['size']//1024} KB)")
        else:
            print(f"[ERR] {v['label']} -> {r}")
        # gentle pacing — ElevenLabs has per-second rate limits.
        time.sleep(0.5)

    log_path = LOG_DIR / f"coo_gen_{int(time.time())}.json"
    log_path.write_text(json.dumps(results, indent=2))
    print(f'\nLog written: {log_path}')

    ok_count = sum(1 for r in results if r['status'] == 'ok')
    print(f'\nSummary: {ok_count}/{len(results)} files generated.')
    return 0 if ok_count == len(results) else 1


if __name__ == '__main__':
    sys.exit(main())
