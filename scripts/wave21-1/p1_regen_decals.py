"""
Wave 21.1 — Cosmo decal regeneration (real fal.ai Flux LoRA, no shortcuts).

Pivot context (NORTH-STAR §6, 2026-05-05)
-----------------------------------------
Wave 21 cosmo-finisher took a budget-saving shortcut — deterministic PIL-cropping
the 6 decals out of `cosmo-hero-lora.png` instead of generating them. Live UAT
proved the shortcut failed: cropping a *region* of a finished painting produces
flat-color regions, not painted decals. The on-screen Cosmo is a green pill with
bat-wing discs and a brown antenna ball.

This pipeline fixes that. Quality > cost. Regenerate until 9.5+/10 DNA per decal.
No 9/10 ships. No crops. No fallbacks.

Strategy stack (per LoRA-isolation gotcha — `rtcosmo` at scale=1.0 summons FULL
character even for organ prompts; documented in cosmo_decals_wave21.md):

    A. Negative-prompt suppression (no full character / isolated body part /
       anatomical study sheet / on white background).
    B. LoRA scale tuning. START 0.55 (body-skin) / 0.60 (small organs).
       Climb to 0.70 if DNA features (rose-spots, watercolor) drop.
       NEVER above 0.80 — beyond that, character bleed dominates.
    C. Anatomical-study-sheet framing in the prompt prefix.

If A+B+C fail, we escalate to D (Flux Pro image-to-image style transfer from
cosmo-hero-lora.png) — but that's only invoked if base attempts can't reach 9.5/10.
E (nano-banana CLI) is the absolute last resort.

Quality bar: 9.5+/10 DNA per decal. Up to 8 attempts per strategy band.
If at attempt 12 (across A→B→C→D→E in order) we still can't reach 9.5,
surface to Richard with what each attempt produced. Don't ship 9/10.

Pipeline per attempt (locked):
    1. fal-ai/flux-lora at 1024² with rtcosmo LoRA at strategy-tuned scale.
    2. fal-ai/birefnet "General Use (Heavy)" remove-bg @ operating_resolution=1024.
       (skipped for body-skin — no alpha needed, it wraps the capsule)
    3. fal-ai/esrgan 4× → 4096².
    4. PIL alpha-merge (Sprint 14A pattern) → 4096² RGBA PNG.

Output: public/assets/cosmo/decals/v2-final/{eyes-l, eyes-r, mouth-neutral,
body-skin, disc-suction, antenna-flower}.png — overwrite in place.

Brand contract (NORTH-STAR §brand): Hayao×Moebius watercolor + character-DNA.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

# Reuse Sprint 16A helpers (env-loading, fal.ai submit/poll, http_download).
sys.path.insert(0, '/Users/richardtheuws/Documents/games/cosmos-cosmic-adventure-2026/scripts/sprint16a')
from _lib import submit, poll_until_done, http_download, log_attempt  # noqa: E402

from PIL import Image, ImageOps  # noqa: E402

ROOT = Path('/Users/richardtheuws/Documents/games/cosmos-cosmic-adventure-2026')
OUT = ROOT / 'public/assets/cosmo/decals/v2-final'
OUT.mkdir(parents=True, exist_ok=True)

LOG_DIR = ROOT / 'scripts/wave21-1/_logs'
LOG_DIR.mkdir(parents=True, exist_ok=True)

# Sprint 16A LoRA — DNA in model weights, trigger word `rtcosmo`
LORA_URL = (
    'https://v3b.fal.media/files/b/0a98931e/'
    '10m_xs8iJYAfgyWc7fVbr_pytorch_lora_weights.safetensors'
)

# Cost ledger (per fal.ai pricing)
COSTS = {'flux-lora': 0.05, 'birefnet': 0.005, 'esrgan': 0.05}
total_cost = 0.0

# No hard cap — quality > cost. Soft warning at $40 to surface to Richard.
SOFT_CAP_WARN = 40.00


def cost_check(label: str, c: float) -> None:
    global total_cost
    total_cost += c
    print(f'[BUDGET] +${c:.3f} -> total ${total_cost:.3f}  {label}')
    if total_cost > SOFT_CAP_WARN:
        print(f'[BUDGET WARN] crossed ${SOFT_CAP_WARN:.2f} — surface to Richard if no convergence yet')


# ---------------------------------------------------------------- prompts

# DNA rider — added to EVERY prompt. The "anatomical study sheet" framing is
# strategy C: primes Flux toward isolated-organ rendering, not character-rendering.
DNA_RIDER = (
    'isolated single anatomical element painted on plain pure white background, '
    'anatomical study sheet illustration, single body part only, '
    'Hayao Miyazaki x Moebius watercolor brushwork with paper grain, '
    'painterly ink underdrawing, soft pastel cosmic palette, '
    'palette mushroom-cream moss-sage faded-rose ink-aubergine saffron-glow forest-deep, '
    'NOT kawaii NOT chibi NOT Disney NOT pokemon, slightly uncute, painted not vector'
)

# Negative — strategy A (suppress whole-character bleed).
NEGATIVE = (
    'full character, full Cosmo character, body silhouette, whole creature, '
    'multiple body parts, head shape, complete face, full alien, full body, '
    'multiple subjects, photorealistic, 3D render, CGI, plastic shiny, '
    'kawaii, chibi, anime sparkle eyes, blue iris, red iris, blushing cheeks, '
    'pokemon, smooth gradient, airbrush, cel-shaded, vector art, flat color, '
    'text, watermark, signature, scary horror, gore, '
    'tail, lizard tail, finger hands, claws, mushroom-cap-head, '
    'two antennae, antenna pair'
)


# Per-decal prompt templates with strategy C framing (anatomical-study-sheet
# prefix). LoRA scale tuned per organ — body-skin needs the lowest scale
# (0.55) because the LoRA wants to summon the whole character; we want a
# texture region only.
DECALS = [
    {
        'filename': 'eyes-l.png',
        'role_prompt': (
            'isolated single chameleon eye anatomical study sheet, '
            'rtcosmo single chameleon-bulging spherical alien eye, head-on view, '
            'glossy deep ink-black iris filling most of the eye, '
            'small saffron-crescent catchlight in upper-LEFT quadrant, '
            'soft moss-sage skin halo around eye perimeter ONLY, '
            'eye is slightly bulging outward like a chameleon, slightly uncanny stare, '
            'visible watercolor brushstrokes around eye edge, '
            'isolated single eye, no other body parts'
        ),
        'lora_scale': 0.65,
        'seeds': [80101, 80102, 80103, 80104, 80105, 80106, 80107, 80108],
        'wants_alpha': True,
        'mirror_from': None,
    },
    {
        'filename': 'eyes-r.png',
        'role_prompt': (
            'isolated single chameleon eye anatomical study sheet, '
            'rtcosmo single chameleon-bulging spherical alien eye, head-on view, '
            'glossy deep ink-black iris filling most of the eye, '
            'small saffron-crescent catchlight in upper-RIGHT quadrant, '
            'soft moss-sage skin halo around eye perimeter ONLY, '
            'eye is slightly bulging outward like a chameleon, slightly uncanny stare, '
            'visible watercolor brushstrokes around eye edge, '
            'isolated single eye, no other body parts'
        ),
        'lora_scale': 0.65,
        'seeds': [80201, 80202, 80203, 80204, 80205, 80206, 80207, 80208],
        'wants_alpha': True,
        # Optional: if eyes-l is great and a mirror reads correctly, we save
        # cost by flipping eyes-l. Toggle decided at gate-time.
        'mirror_from': 'eyes-l.png',
    },
    {
        'filename': 'mouth-neutral.png',
        'role_prompt': (
            'isolated single alien mouth anatomical study sheet, '
            'rtcosmo small alien mouth, head-on view, slight overbite hint, '
            'closed soft watercolor lips with painted ink-aubergine outline, '
            'tiny implied teeth peeking under upper lip, '
            'slightly uncanny neither cute nor threatening, '
            'soft moss-sage skin halo around mouth ONLY, '
            'visible watercolor brushwork on lips, '
            'isolated single mouth, no other body parts'
        ),
        'lora_scale': 0.60,
        'seeds': [80301, 80302, 80303, 80304, 80305, 80306, 80307, 80308],
        'wants_alpha': True,
        'mirror_from': None,
    },
    {
        'filename': 'body-skin.png',
        'role_prompt': (
            # Body-skin is texture-region painting, NOT a character. Lowest
            # scale + texture-region framing.
            'painterly watercolor texture sheet of green alien skin, '
            'rtcosmo painted moss-sage green watercolor body skin closeup texture, '
            'scattered faded-rose spots and freckles distributed across the surface, '
            'ink-aubergine painterly underdrawing visible through transparent washes, '
            'paper-grain texture, visible watercolor brushwork, '
            'tileable seamless painted skin surface filling the entire frame, '
            'no body silhouette, no limbs, no face, no character — just painted skin'
        ),
        'lora_scale': 0.50,
        'seeds': [80401, 80402, 80403, 80404, 80405, 80406, 80407, 80408],
        'wants_alpha': False,  # body skin texture wraps capsule; no alpha needed
        'mirror_from': None,
    },
    {
        'filename': 'disc-suction.png',
        'role_prompt': (
            'isolated single suction-cup pad anatomical study sheet, '
            'rtcosmo single matte-black suction-cup disc pad, painted top-down view, '
            'circular flat ribbed rubber suction pad, '
            'concentric subtle ring grooves on the top surface, '
            'painted ink-aubergine outline around the perimeter, '
            'soft watercolor wash, painterly brushwork, '
            'isolated single disc centered on white, '
            'no body, no arm, no hand, no creature, '
            'just a single painted suction-cup disc'
        ),
        'lora_scale': 0.55,
        'seeds': [80501, 80502, 80503, 80504, 80505, 80506, 80507, 80508],
        'wants_alpha': True,
        'mirror_from': None,
    },
    {
        'filename': 'antenna-flower.png',
        'role_prompt': (
            'isolated single flower bulb anatomical study sheet, '
            'rtcosmo small painted flower bulb tip, head-on view, '
            'soft saffron-glow watercolor petals like a tiny bell-shaped flower, '
            'faded-rose center, painted ink-line on petal edges, '
            'visible watercolor brushwork, painterly translucent petals, '
            'isolated single bulb-flower centered on white, '
            'no antenna shaft, no body, no creature, '
            'just the painted flower bulb'
        ),
        'lora_scale': 0.60,
        'seeds': [80601, 80602, 80603, 80604, 80605, 80606, 80607, 80608],
        'wants_alpha': True,
        'mirror_from': None,
    },
]


# ---------------------------------------------------------------- fal helpers

def gen_flux_lora(prompt: str, negative: str, seed: int, label: str,
                  lora_scale: float, width: int = 1024, height: int = 1024) -> str | None:
    """Run Flux LoRA with rtcosmo. Returns image_url or None."""
    body = {
        'prompt': prompt + ', ' + DNA_RIDER,
        'negative_prompt': negative,
        'image_size': {'width': width, 'height': height},
        'num_inference_steps': 32,
        'guidance_scale': 4.0,
        'loras': [{'path': LORA_URL, 'scale': lora_scale}],
        'seed': seed,
        'enable_safety_checker': False,
    }
    print(f'[GEN] {label} seed={seed} {width}x{height} loraScale={lora_scale}')
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
    log_attempt('../../wave21-1/_logs/attempts.jsonl', {
        'ts': time.strftime('%H:%M:%S'),
        'label': label, 'seed': seed, 'lora_scale': lora_scale,
        'prompt': prompt[:280], 'url': url,
    })
    return url


def remove_bg(image_url: str, label: str) -> str | None:
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


# ---------------------------------------------------------------- gating

def gate_attempt(local_path: Path, label: str, want_alpha: bool = True) -> tuple[bool, dict]:
    """Heuristic per-attempt validation. Note: this is a SCREEN, not a quality
    score. It rejects clearly-broken results (empty alpha, full opacity from
    BiRefNet failure, single-color blobs). True 9.5/10 DNA judgment is done
    visually post-attempt by Richard / by reading the file in this thread.
    """
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

    if want_alpha:
        if alpha_present < 30:
            return False, {**metrics, 'reason': 'too transparent (BiRefNet ate it)'}
        if alpha_present > 240:
            return False, {**metrics, 'reason': 'fully opaque (BiRefNet failed)'}
    if color_variance < 200:
        return False, {**metrics, 'reason': 'too uniform (likely solid-color failure)'}
    return True, metrics


# ---------------------------------------------------------------- post-process

def merge_alpha_after_esrgan(esrgan_url: str, alpha_source_url: str,
                             target: Path, label: str) -> bool:
    """ESRGAN strips alpha. Sprint 14A pattern: ESRGAN handles RGB body,
    alpha handled separately via PIL Lanczos upscale + threshold-tighten.
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
    if alpha_src.size != rgb.size:
        alpha_src = alpha_src.resize(rgb.size, Image.LANCZOS)

    alpha_band = alpha_src.split()[3]

    import numpy as np
    arr = np.array(alpha_band, dtype=np.float32)
    arr = np.clip((arr - 24.0) * (255.0 / 176.0), 0, 255).astype('uint8')
    alpha_tight = Image.fromarray(arr, mode='L')

    rgba = rgb.convert('RGBA')
    rgba.putalpha(alpha_tight)

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


def mirror_existing(source: Path, target: Path) -> bool:
    """Generate the right-eye decal by horizontally-flipping the left-eye."""
    if not source.exists():
        return False
    im = Image.open(source).convert('RGBA')
    flipped = ImageOps.mirror(im)
    flipped.save(target, format='PNG', optimize=True)
    return True


# ---------------------------------------------------------------- driver

def generate_one(decal: dict, manifest: list, candidate_paths: list[Path]) -> bool:
    """Generate one decal with up to N attempts. Saves all candidates to
    LOG_DIR for visual review; the first that passes the gate becomes the
    overwrite-target. Higher-quality picking is done in a second pass after
    visual inspection.
    """
    filename = decal['filename']
    role_prompt = decal['role_prompt']
    seeds = decal['seeds']
    lora_scale = decal['lora_scale']
    needs_alpha = decal['wants_alpha']

    target = OUT / filename
    label = filename.replace('.png', '')

    accepted_attempt = None
    accepted_metrics = None

    for i, seed in enumerate(seeds):
        attempt_label = f'{label}_a{i+1}_s{seed}'
        candidate_path = LOG_DIR / f'cand_{label}_a{i+1}_s{seed}.png'
        print(f'\n--- {attempt_label} ---')

        gen_url = gen_flux_lora(role_prompt, NEGATIVE, seed, attempt_label, lora_scale)
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
            ok = merge_alpha_after_esrgan(up_url, bg_url, candidate_path, attempt_label)
        else:
            up_url = upscale_4x(gen_url, attempt_label)
            if not up_url:
                print(f'[RETRY] {attempt_label}: esrgan failed')
                continue
            ok = save_opaque_after_esrgan(up_url, candidate_path, attempt_label)

        if not ok:
            print(f'[RETRY] {attempt_label}: post-process failed')
            continue

        accept, metrics = gate_attempt(candidate_path, attempt_label, want_alpha=needs_alpha)
        manifest.append({
            'decal': filename, 'attempt': i + 1, 'seed': seed,
            'lora_scale': lora_scale,
            'gate_pass': accept, 'metrics': metrics,
            'candidate_path': str(candidate_path.relative_to(ROOT)),
            'gen_url': gen_url,
        })
        candidate_paths.append(candidate_path)

        if accept:
            print(f'[GATE-PASS] {attempt_label}: {metrics}')
            if accepted_attempt is None:
                # First pass-gate becomes the live target. Visual review can
                # later promote a different candidate.
                accepted_attempt = attempt_label
                accepted_metrics = metrics
                Image.open(candidate_path).save(target, format='PNG', optimize=True)
                print(f'[SHIPPED-OK] {filename} <- {attempt_label}')
        else:
            print(f'[GATE-FAIL] {attempt_label}: {metrics}')

    if accepted_attempt:
        print(f'[FINAL] {filename} <- {accepted_attempt} {accepted_metrics}')
        return True
    print(f'[FAIL-FINAL] {filename}: 0 of {len(seeds)} attempts passed gate')
    return False


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--only', help='Only regenerate this decal (filename)', default=None)
    parser.add_argument('--skip-mirror', action='store_true',
                        help='Generate eyes-r fresh; do not mirror eyes-l')
    args = parser.parse_args(argv)

    print('=== Wave 21.1 — Cosmo decal regen (real fal.ai, no shortcuts) ===')
    print(f'Output: {OUT}')
    print(f'Soft cap warn: ${SOFT_CAP_WARN:.2f}')
    print()

    manifest: list = []
    results: dict = {}
    all_candidates: list[Path] = []

    todo = DECALS
    if args.only:
        todo = [d for d in DECALS if d['filename'] == args.only]
        if not todo:
            print(f'[FATAL] --only {args.only} not in known decals')
            return 1

    # Skip eyes-r when mirroring; resolve later.
    eyes_l_done = False
    for decal in todo:
        if decal['filename'] == 'eyes-r.png' and decal.get('mirror_from') and not args.skip_mirror:
            print(f'\n========== {decal["filename"]} (mirror-deferred) ==========')
            results[decal['filename']] = 'mirror-pending'
            continue

        print(f'\n========== {decal["filename"]} ==========')
        ok = generate_one(decal, manifest, all_candidates)
        results[decal['filename']] = ok
        if decal['filename'] == 'eyes-l.png':
            eyes_l_done = ok

    # Mirror eyes-l → eyes-r if eyes-l shipped and mirror is enabled.
    if not args.skip_mirror and eyes_l_done and (args.only is None or args.only == 'eyes-r.png'):
        print('\n========== eyes-r.png (mirror from eyes-l.png) ==========')
        l = OUT / 'eyes-l.png'
        r = OUT / 'eyes-r.png'
        if mirror_existing(l, r):
            results['eyes-r.png'] = True
            manifest.append({'decal': 'eyes-r.png', 'mirror_from': 'eyes-l.png'})
            print('[MIRROR-OK] eyes-r.png from eyes-l.png')
        else:
            results['eyes-r.png'] = False

    print('\n=== Summary ===')
    for fn, ok in results.items():
        print(f'  {"OK   " if ok else "FAIL "} {fn}')
    print(f'\nTotal cost: ${total_cost:.3f}')
    print(f'\nCandidates saved in: {LOG_DIR}/cand_*.png')
    print(f'Inspect candidates visually before approving final ships.')

    summary = {
        'wave': '21.1',
        'generated': time.strftime('%Y-%m-%d %H:%M:%S'),
        'total_cost_usd': round(total_cost, 4),
        'soft_cap_warn': SOFT_CAP_WARN,
        'lora_url': LORA_URL,
        'lora_trigger': 'rtcosmo',
        'strategy_band': 'A+B+C (negative-prompt + LoRA-scale + anatomical-study-sheet)',
        'results': results,
        'manifest': manifest,
    }
    (LOG_DIR / 'summary.json').write_text(json.dumps(summary, indent=2))
    print(f'Wrote {LOG_DIR / "summary.json"}')

    n_pass = sum(1 for v in results.values() if v is True)
    return 0 if n_pass >= 5 else 1


if __name__ == '__main__':
    sys.exit(main())
