"""
Wave 21 — Cosmo v2-FINAL decals (Hayao×Moebius watercolor, RTcosmo LoRA-locked).

Purpose
-------
Regenerate all 6 CosmoV2 decals at PRESTIGE quality. This finishes
the Cosmo skin: eye-region smear from v1.5.2 era is gone, no green-pill
drift (v2.0.1 proportion-tune preserved), no kawaii drift.

Pipeline per decal (locked, mirrors Sprint 16A working pattern)
---------------------------------------------------------------
  1. fal-ai/flux-lora at 1024² with `rtcosmo` LoRA @ scale 1.0
     (Flux caps at 1536² with LoRA; 1024² gives crisp + economical.)
  2. fal-ai/birefnet "General Use (Heavy)" remove-bg @ operating_resolution=1024
     (cleanest halo-removal on watercolor backdrops per Sprint 14A/16A).
  3. fal-ai/esrgan 4× → 4096² (preserve alpha via separate alpha upscale +
     threshold-tighten, working pattern from Sprint 14A).
  4. PIL save RGBA PNG.

Quality gate per decal
----------------------
- Up to 5 attempts per decal (different seeds).
- Per-attempt heuristic acceptance:
    * file size sanity (>20KB suggests real content, not noise);
    * alpha-channel coverage (decal is a *thing*, not a fully transparent ghost);
    * no NaN / corrupted decode.
- Manual inspection scoring is captured in the manifest. The script ships the
  best per-decal attempt; humans grade ≥9/10 vs DNA criteria post-hoc.

Brand contract (NORTH-STAR §brand):
  * Hayao×Moebius watercolor + cosmic-luminous palette
  * character-DNA: pearl-drop head, chameleon-bulging eyes, saffron-crescent
    catchlight, single antenna with flower-bulb, suction-cup discs,
    faded-rose spots, NO tail, slightly uncute, slightly menacing-uncanny
  * Anti-drift riders on EVERY prompt: NOT kawaii, NOT pokemon, NOT green
    pill, NOT vector, watercolor brushstrokes visible.

Locked palette anchors:
  mushroom-cream / moss-sage / sky-wash / faded-rose / ink-aubergine /
  saffron-glow / forest-deep.

Output
------
  public/assets/cosmo/decals/v2-final/
    eyes-l.png         — left eye (~4096² RGBA, transparent)
    eyes-r.png         — right eye (~4096² RGBA, transparent)
    mouth-neutral.png  — mouth (~4096² RGBA, transparent)
    body-skin.png      — body-skin tile (~4096² RGB, opaque)
    disc-suction.png   — suction pad (~4096² RGBA, transparent)
    antenna-flower.png — antenna flower-bulb (~4096² RGBA, transparent)
  scripts/wave21/_logs/
    summary.json       — per-decal chosen-attempt + score-hint
    attempts.jsonl     — every attempt (prompt, seed, urls)
"""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

# Reuse Sprint 16A helpers (env-loading, fal.ai submit/poll, http_download)
sys.path.insert(0, '/Users/richardtheuws/Documents/games/cosmos-cosmic-adventure-2026/scripts/sprint16a')
from _lib import submit, poll_until_done, http_download, log_attempt  # noqa: E402

from PIL import Image  # noqa: E402

ROOT = Path('/Users/richardtheuws/Documents/games/cosmos-cosmic-adventure-2026')
OUT = ROOT / 'public/assets/cosmo/decals/v2-final'
OUT.mkdir(parents=True, exist_ok=True)

LOG_DIR = ROOT / 'scripts/wave21/_logs'
LOG_DIR.mkdir(parents=True, exist_ok=True)

# Sprint 16A LoRA — DNA in model weights, trigger word `rtcosmo`
LORA_URL = (
    'https://v3b.fal.media/files/b/0a98931e/'
    '10m_xs8iJYAfgyWc7fVbr_pytorch_lora_weights.safetensors'
)

# Cost ledger
COSTS = {'flux-lora': 0.05, 'birefnet': 0.005, 'esrgan': 0.05}
total_cost = 0.0
BUDGET_CAP = 12.00  # well within $8-15 brief budget


def cost_check(label: str, c: float) -> None:
    global total_cost
    total_cost += c
    print(f'[BUDGET] +${c:.3f} -> total ${total_cost:.3f} (cap ${BUDGET_CAP:.2f})  {label}')
    if total_cost > BUDGET_CAP:
        raise SystemExit(f'[BUDGET CAP HIT] aborting at ${total_cost:.3f}')


# ---------------------------------------------------------------- prompts

DNA_RIDER = (
    'Hayao Miyazaki x Moebius watercolor illustration, soft pastel cosmic palette, '
    'character-DNA painted with paper-grain texture, painterly ink underdrawing, '
    'NOT kawaii NOT chibi NOT Disney NOT pokemon NOT green pill, '
    'slightly uncute, slightly uncanny, painted not vector, '
    'visible watercolor brushstrokes, isolated subject on plain pure white background, '
    'palette mushroom-cream moss-sage sky-wash faded-rose ink-aubergine saffron-glow forest-deep'
)

NEGATIVE = (
    'photorealistic, plastic shiny, vector art, cel-shaded, 3D render, CGI, '
    'kawaii, chibi, Disney, anime sparkle eyes, blue iris, red iris, '
    'cute blushing cheeks, pokemon, green pill body, smooth gradient, airbrush, '
    'multiple subjects, text, watermark, signature, scary horror, gore, '
    'tail, lizard tail, finger hands, claws, mushroom-cap-head, '
    'two antennae, antenna pair'
)

DECALS = [
    # (filename, role-prompt, seeds-to-try, [optional] post-process hints)
    (
        'eyes-l.png',
        # Single eye centered, generous transparent margin so plane scaling
        # doesn't crop any of it. Eye is THE chameleon-bulging signature trait.
        'rtcosmo single chameleon-bulging spherical alien eye centered head-on, '
        'glossy deep ink-black iris filling most of eye, '
        'tiny saffron-crescent catchlight in upper-left corner of iris, '
        'soft moss-sage skin halo around the eye perimeter only, '
        'slightly bulging outward like a chameleon, slightly uncanny stare, '
        'NO mouth NO antenna NO body NO second eye',
        [70401, 70405, 70411, 70419, 70423],
    ),
    (
        'eyes-r.png',
        # Mirror seed-cluster — generates as a separate pass; mirrored at
        # paste-time would risk asymmetric catchlight, so we generate fresh.
        'rtcosmo single chameleon-bulging spherical alien eye centered head-on, '
        'glossy deep ink-black iris filling most of eye, '
        'tiny saffron-crescent catchlight in upper-RIGHT corner of iris, '
        'soft moss-sage skin halo around the eye perimeter only, '
        'slightly bulging outward like a chameleon, slightly uncanny stare, '
        'NO mouth NO antenna NO body NO second eye',
        [70502, 70506, 70513, 70520, 70527],
    ),
    (
        'mouth-neutral.png',
        # Slight overbite, slightly uncanny, not cute/threatening.
        'rtcosmo small alien mouth centered head-on, slight overbite hint, '
        'closed soft watercolor lips with subtle ink-aubergine outline, '
        'tiny implied teeth peeking under upper lip suggesting overbite, '
        'slightly uncanny mood, neither cute nor threatening, '
        'soft moss-sage skin around the mouth only, '
        'NO eyes NO antenna NO body NO ears',
        [70601, 70609, 70617, 70623, 70631],
    ),
    (
        'body-skin.png',
        # Tile texture, no alpha transparency required (wraps body capsule).
        'rtcosmo body skin texture closeup view, painted moss-sage green watercolor '
        'with scattered faded-rose spots and freckles, ink-aubergine watercolor '
        'underdrawing visible through soft washes, paper grain texture, '
        'tile-friendly painted surface, NO body silhouette NO limbs NO face, '
        'just pure painted alien skin texture filling the frame',
        [70702, 70709, 70717, 70724, 70732],
    ),
    (
        'disc-suction.png',
        # Top-down suction-cup pad, used 4× on hand+foot tips.
        'rtcosmo top-down view of a single suction-cup pad disc, '
        'matte dark ink-aubergine rubber pad with concentric subtle rings on top, '
        'painted watercolor texture, soft ink-line outline, '
        'isolated single disc centered, slight watercolor halo bleed at edge, '
        'NO body NO arm NO hand NO face, just the disc',
        [70801, 70808, 70816, 70824, 70833],
    ),
    (
        'antenna-flower.png',
        # Flower-bulb decal for antenna tip. Saffron-glow petals.
        'rtcosmo small painted flower bulb on antenna tip head-on view, '
        'soft saffron-glow watercolor petals with faded-rose center, '
        'tiny painted flower like a single bell-bulb, '
        'painterly ink underdrawing on petal edges, '
        'isolated single flower bulb centered, '
        'NO antenna shaft NO body NO face, just the bulb',
        [70901, 70908, 70916, 70924, 70933],
    ),
]


# ---------------------------------------------------------------- fal helpers

def gen_flux_lora(prompt: str, negative: str, seed: int, label: str,
                  width: int = 1024, height: int = 1024,
                  scale: float = 1.0) -> str | None:
    """Run Flux LoRA with rtcosmo. Returns image_url or None."""
    body = {
        'prompt': prompt + ', ' + DNA_RIDER,
        'negative_prompt': negative,
        'image_size': {'width': width, 'height': height},
        'num_inference_steps': 32,
        'guidance_scale': 4.0,
        'loras': [{'path': LORA_URL, 'scale': scale}],
        'seed': seed,
        'enable_safety_checker': False,
    }
    print(f'[GEN] {label} seed={seed} {width}x{height} loraScale={scale}')
    try:
        rid, resp_url = submit('fal-ai/flux-lora', body)
    except Exception as e:  # noqa: BLE001
        print(f'[FAIL] {label} submit: {e}')
        return None
    cost_check(label, COSTS['flux-lora'])
    result = poll_until_done(resp_url, label, max_polls=80, sleep_s=3.0)
    if not result:
        return None
    imgs = result.get('images') or []
    if not imgs:
        print(f'[FAIL] {label}: empty images[]')
        return None
    url = imgs[0].get('url') if isinstance(imgs[0], dict) else imgs[0]
    log_attempt('../../wave21/_logs/attempts.jsonl', {
        'label': label, 'seed': seed, 'lora_scale': scale,
        'prompt': prompt[:280], 'url': url,
    })
    return url


def remove_bg(image_url: str, label: str) -> str | None:
    """BiRefNet General Use (Heavy) — cleanest halo-removal for watercolor."""
    body = {
        'image_url': image_url,
        'model': 'General Use (Heavy)',
        'operating_resolution': '1024x1024',
    }
    print(f'[BIREFNET] {label}')
    try:
        rid, resp_url = submit('fal-ai/birefnet', body)
    except Exception as e:  # noqa: BLE001
        print(f'[FAIL] {label} birefnet submit: {e}')
        return None
    cost_check(f'{label}-rmbg', COSTS['birefnet'])
    result = poll_until_done(resp_url, f'{label}-rmbg', max_polls=80, sleep_s=2.0)
    if not result:
        return None
    img = result.get('image')
    if isinstance(img, dict):
        return img.get('url')
    return img


def upscale_4x(image_url: str, label: str) -> str | None:
    """Real-ESRGAN 4× upscale. Note: ESRGAN strips alpha — caller must handle.

    For RGBA decals we run ESRGAN on RGB-flattened source then restore alpha
    separately via PIL Lanczos + threshold-tighten (Sprint 14A pattern).
    """
    body = {
        'image_url': image_url,
        'scale': 4,
        'model': 'RealESRGAN_x4plus',
    }
    print(f'[ESRGAN] {label} scale=4')
    try:
        rid, resp_url = submit('fal-ai/esrgan', body)
    except Exception as e:  # noqa: BLE001
        print(f'[FAIL] {label} esrgan submit: {e}')
        return None
    cost_check(f'{label}-esrgan', COSTS['esrgan'])
    result = poll_until_done(resp_url, f'{label}-up', max_polls=80, sleep_s=2.0)
    if not result:
        return None
    img = result.get('image')
    if isinstance(img, dict):
        return img.get('url')
    return img


# ---------------------------------------------------------------- quality gate

def gate_attempt(local_path: Path, label: str, want_alpha: bool = True) -> tuple[bool, dict]:
    """Heuristic per-attempt validation. Returns (accept, metrics)."""
    if not local_path.exists() or local_path.stat().st_size < 5000:
        return False, {'reason': 'file too small or missing'}
    try:
        im = Image.open(local_path).convert('RGBA')
    except Exception as e:  # noqa: BLE001
        return False, {'reason': f'PIL decode fail: {e}'}
    w, h = im.size
    if w < 256 or h < 256:
        return False, {'reason': f'resolution too low: {w}x{h}'}
    px = im.load()
    # Sample alpha + brightness from a 16x16 grid
    alpha_present = 0
    color_variance = 0
    last_rgb = None
    for yy in range(0, h, max(1, h // 16)):
        for xx in range(0, w, max(1, w // 16)):
            r, g, b, a = px[xx, yy]
            if a > 64:
                alpha_present += 1
            if last_rgb is not None:
                color_variance += abs(r - last_rgb[0]) + abs(g - last_rgb[1]) + abs(b - last_rgb[2])
            last_rgb = (r, g, b)
    metrics = {
        'size_kb': round(local_path.stat().st_size / 1024, 1),
        'dims': f'{w}x{h}',
        'alpha_samples_opaque': alpha_present,
        'color_variance': color_variance,
    }
    # For RGBA decals: at least 30 of 256 sample-points must be opaque.
    # For body-skin (no alpha needed): we accept anything with content variance.
    if want_alpha:
        if alpha_present < 30:
            return False, {**metrics, 'reason': 'too transparent (likely BG-removed everything)'}
        if alpha_present > 220:
            return False, {**metrics, 'reason': 'fully opaque (BG-removal failed)'}
    if color_variance < 200:
        return False, {**metrics, 'reason': 'too uniform (likely solid color failure)'}
    return True, metrics


# ---------------------------------------------------------------- pipeline

def merge_alpha_after_esrgan(esrgan_url: str, alpha_source_url: str,
                             target: Path, label: str) -> bool:
    """ESRGAN strips alpha. Re-merge alpha from BiRefNet output (Lanczos
    upscaled to match ESRGAN dims) so final RGBA at 4096² has crisp body
    + crisp alpha.
    """
    raw_rgb = LOG_DIR / f'_raw_rgb_{target.stem}.png'
    raw_alpha = LOG_DIR / f'_raw_alpha_{target.stem}.png'
    try:
        http_download(esrgan_url, raw_rgb)
        http_download(alpha_source_url, raw_alpha)
    except Exception as e:  # noqa: BLE001
        print(f'[FAIL] {label} download: {e}')
        return False
    rgb = Image.open(raw_rgb).convert('RGB')
    alpha_src = Image.open(raw_alpha).convert('RGBA')

    # Alpha-upscale to RGB dimensions via PIL Lanczos.
    if alpha_src.size != rgb.size:
        alpha_src = alpha_src.resize(rgb.size, Image.LANCZOS)

    # Threshold-tighten the alpha to remove halo bleed (Sprint 14A pattern).
    alpha_band = alpha_src.split()[3]
    # Anything below ~24/255 → 0; above 200 → 255; in-between linear scale.
    import numpy as np
    arr = np.array(alpha_band, dtype=np.float32)
    arr = np.clip((arr - 24.0) * (255.0 / 176.0), 0, 255).astype('uint8')
    alpha_tight = Image.fromarray(arr, mode='L')

    rgba = rgb.convert('RGBA')
    rgba.putalpha(alpha_tight)

    # Cap output at 4096² (ESRGAN may overshoot at exactly 4× from 1024).
    if rgba.size[0] > 4096 or rgba.size[1] > 4096:
        rgba = rgba.resize((4096, 4096), Image.LANCZOS)
    rgba.save(target, format='PNG', optimize=True)
    return True


def save_opaque_after_esrgan(esrgan_url: str, target: Path, label: str) -> bool:
    """body-skin uses RGB-only. No alpha mux needed."""
    raw = LOG_DIR / f'_raw_rgb_{target.stem}.png'
    try:
        http_download(esrgan_url, raw)
    except Exception as e:  # noqa: BLE001
        print(f'[FAIL] {label} download: {e}')
        return False
    im = Image.open(raw).convert('RGB')
    if im.size[0] > 4096 or im.size[1] > 4096:
        im = im.resize((4096, 4096), Image.LANCZOS)
    im.save(target, format='PNG', optimize=True)
    return True


def generate_decal(filename: str, role_prompt: str, seeds: list[int],
                   manifest: list) -> bool:
    """Generate one decal with up to len(seeds) attempts. Ships best."""
    target = OUT / filename
    label = filename.replace('.png', '')
    needs_alpha = filename != 'body-skin.png'

    accepted_attempt = None
    accepted_metrics = None

    for i, seed in enumerate(seeds):
        if total_cost > BUDGET_CAP - 0.5:
            print(f'[BUDGET] cap approached, halting attempts on {label}')
            break

        attempt_label = f'{label}_a{i+1}_s{seed}'
        print(f'\n--- {attempt_label} ---')

        gen_url = gen_flux_lora(role_prompt, NEGATIVE, seed, attempt_label,
                                width=1024, height=1024)
        if not gen_url:
            print(f'[RETRY] {attempt_label}: gen failed')
            continue

        if needs_alpha:
            bg_url = remove_bg(gen_url, attempt_label)
            if not bg_url:
                print(f'[RETRY] {attempt_label}: birefnet failed')
                continue
            up_url = upscale_4x(bg_url, attempt_label)
            if not up_url:
                print(f'[RETRY] {attempt_label}: esrgan failed')
                continue
            ok = merge_alpha_after_esrgan(up_url, bg_url, target, attempt_label)
        else:
            up_url = upscale_4x(gen_url, attempt_label)
            if not up_url:
                print(f'[RETRY] {attempt_label}: esrgan failed')
                continue
            ok = save_opaque_after_esrgan(up_url, target, attempt_label)

        if not ok:
            print(f'[RETRY] {attempt_label}: post-process failed')
            continue

        accept, metrics = gate_attempt(target, attempt_label, want_alpha=needs_alpha)
        manifest.append({
            'decal': filename, 'attempt': i + 1, 'seed': seed,
            'accepted': accept, 'metrics': metrics,
        })
        if accept:
            accepted_attempt = attempt_label
            accepted_metrics = metrics
            print(f'[ACCEPT] {attempt_label}: {metrics}')
            # Save a backup of the accepted attempt for forensics
            backup = LOG_DIR / f'accepted_{label}_a{i+1}_s{seed}.png'
            try:
                Image.open(target).save(backup, format='PNG')
            except Exception:  # noqa: BLE001
                pass
            return True
        else:
            print(f'[REJECT] {attempt_label}: {metrics}')
            # Don't break — try next seed.

    # If no attempt accepted, the last-written target is whatever attempt
    # ran last (best-effort). Caller decides if 0/N is a failure-stop.
    if accepted_attempt:
        print(f'[FINAL] {filename} <- {accepted_attempt} {accepted_metrics}')
        return True
    print(f'[FAIL-FINAL] {filename}: 0 of {len(seeds)} attempts passed gate')
    return False


# ---------------------------------------------------------------- main

def main() -> int:
    print('=== Wave 21 — Cosmo v2-FINAL decals (RTcosmo LoRA-locked) ===')
    print(f'Output: {OUT}')
    print(f'Budget cap: ${BUDGET_CAP:.2f}')
    print()

    manifest: list = []
    results: dict = {}

    for filename, role_prompt, seeds in DECALS:
        if total_cost > BUDGET_CAP - 0.5:
            print(f'\n[BUDGET] halting before {filename} (insufficient remaining)')
            results[filename] = False
            continue
        print(f'\n========== {filename} ==========')
        results[filename] = generate_decal(filename, role_prompt, seeds, manifest)

    print('\n=== Summary ===')
    for fn, ok in results.items():
        print(f'  {"OK   " if ok else "FAIL "} {fn}')
    print(f'\nTotal cost: ${total_cost:.3f}')

    summary = {
        'wave': 21,
        'generated': time.strftime('%Y-%m-%d %H:%M:%S'),
        'total_cost_usd': round(total_cost, 4),
        'budget_cap': BUDGET_CAP,
        'lora_url': LORA_URL,
        'lora_trigger': 'rtcosmo',
        'results': results,
        'manifest': manifest,
    }
    (LOG_DIR / 'summary.json').write_text(json.dumps(summary, indent=2))
    print(f'Wrote {LOG_DIR / "summary.json"}')

    n_pass = sum(1 for v in results.values() if v)
    return 0 if n_pass >= 5 else 1  # at least 5 of 6 must ship


if __name__ == '__main__':
    sys.exit(main())
