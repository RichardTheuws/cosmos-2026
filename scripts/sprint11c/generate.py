"""
Sprint 11C — Tile-set redesign + spikes + ladders + grass strip.

Generates 9 painted tiles in Hayao×Moebius watercolor style:
  v3 painted-tile generation pass — replaces retro-feel tiles with cohesive
  watercolor look matching enemies (v4) and Cosmo canonical (v3).

Pipeline pattern (proven in Sprint 4.5 Fase B + 7D):
  1. Submit all Flux Pro / Flux Dev jobs in parallel
  2. Poll each until COMPLETED → download raw to public/assets/tiles/ (or backgrounds/)
  3. NO BiRefNet for tiles (would strip texture — proven in 7D tile-trap fix)
  4. Save manifest entries

KEY MEMORY LESSONS APPLIED:
  - Drop "psychedelic illustration" + "cosmic-adventure mood" STEM keywords
    (those bias Flux toward LANDSCAPES for square tiles — see asset_learnings.md)
  - Use rider-FRONT pattern with explicit "no landscape no scene no horizon"
  - Square 1024×1024 + close-up macro framing instructions
  - Aspect 8:1 for spike-strip (forces strip composition)
  - Vertical 1:4 for ladder (organic vine, tileable vertically)
  - NO BiRefNet for any of these (texture preservation)
"""
from __future__ import annotations
import json, time, urllib.request, urllib.error
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = Path('/Users/richardtheuws/Documents/games/cosmos-cosmic-adventure-2026')
TILES_DIR = ROOT / 'public/assets/tiles'
BG_DIR = ROOT / 'public/assets/backgrounds'
TILES_DIR.mkdir(parents=True, exist_ok=True)
BG_DIR.mkdir(parents=True, exist_ok=True)


def load_env() -> dict:
    env = {}
    with open(Path.home() / 'Documents/games/.env') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip().strip("'").strip('"')
    return env


ENV = load_env()
FAL_KEY = ENV.get('FAL_AI_KEY')
assert FAL_KEY, 'FAL_AI_KEY missing'


# ============================================================================
# fal.ai helpers
# ============================================================================
def http_post_json(url: str, headers: dict, body: dict, timeout: int = 60) -> dict:
    data = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode('utf-8'))


def http_get_json(url: str, headers: dict, timeout: int = 60) -> dict:
    req = urllib.request.Request(url, headers=headers, method='GET')
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode('utf-8'))


def http_download(url: str, target: Path, timeout: int = 120) -> int:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        data = r.read()
    target.write_bytes(data)
    return len(data)


def submit_flux(endpoint: str, prompt: str, size: dict) -> tuple[str, str]:
    """Returns (request_id, response_url)."""
    res = http_post_json(
        f'https://queue.fal.run/{endpoint}',
        {'Authorization': f'Key {FAL_KEY}', 'Content-Type': 'application/json'},
        {'prompt': prompt, 'image_size': size, 'num_images': 1},
    )
    return res['request_id'], res['response_url']


def poll_until_done(response_url: str, label: str, max_polls: int = 120) -> dict | None:
    headers = {'Authorization': f'Key {FAL_KEY}'}
    status_url = response_url + '/status' if not response_url.endswith('/status') else response_url
    for i in range(max_polls):
        try:
            status_res = http_get_json(status_url, headers)
            status = status_res.get('status', '')
            if status == 'COMPLETED':
                try:
                    return http_get_json(response_url, headers)
                except urllib.error.HTTPError as e:
                    print(f'[FAIL] {label} response fetch: {e.code}')
                    return None
            if status in ('FAILED', 'ERROR'):
                print(f'[FAIL] {label}: {status_res}')
                return None
        except urllib.error.HTTPError as e:
            if e.code in (404, 425, 400):
                time.sleep(2)
                continue
            raise
        time.sleep(2)
    print(f'[TIMEOUT] {label}')
    return None


def extract_image_url(payload: dict) -> str | None:
    if not payload:
        return None
    if 'images' in payload and payload['images']:
        first = payload['images'][0]
        if isinstance(first, dict):
            return first.get('url')
        return first
    if 'image' in payload:
        img = payload['image']
        if isinstance(img, dict):
            return img.get('url')
        return img
    return None


# ============================================================================
# Tile prompts — TILE-TRAP FIX RECIPE
#
# Critical: DROP "psychedelic illustration" + "cosmic-adventure mood" stem
# keywords. Those are scene-magnets that pull Flux toward landscapes for
# square tiles (proven 4/5 fail in Sprint 4.5 Fase B).
#
# Pattern: rider-FRONT (explicit close-up macro + anti-landscape negatives) +
# Hayao×Moebius watercolor style + locked palette tail. NO BiRefNet later.
# ============================================================================

# Style stem stripped of scene-magnets — focus on PAINT-FINISH only.
TILE_STYLE = (
    'hand-painted watercolor with ink underdrawing, paper-grain texture, '
    'Studio Ghibli x Moebius x Tenniel illustration style, soft wet-edge '
    'watercolor bleeds, ragged ink-line outlines, NOT digital NOT 3D NOT '
    'photoreal NOT pixel-art NOT cartoon NOT roblox'
)

# Locked 7-palette tail — applied to all tiles for coherence.
PALETTE = (
    'palette mushroom-cream moss-sage sky-wash-blue faded-rose ink-aubergine '
    'saffron-glow forest-deep, pop-magenta and pop-lime accents maximum 5 percent'
)

# Anti-landscape rider — ALWAYS at FRONT for square tiles.
TILE_RIDER_FRONT = (
    'macro close-up flat texture filling entire square frame edge to edge, '
    'NO landscape NO scene NO sky NO horizon NO mountains NO sun NO sunset '
    'NO trees NO ground NO floor NO perspective NO depth NO painting NO border, '
    'just a flat 2D platformer game wall texture asset viewed from directly '
    'above, sharp focus crisp ink lines NOT blurry'
)


def tile_prompt(subject: str) -> str:
    """Full tile prompt with anti-landscape rider FIRST."""
    return f'{TILE_RIDER_FRONT}. {subject}. {TILE_STYLE}, {PALETTE}'


# ----------------------------------------------------------------------------
# 1. tile-ground-painted-v3 — saturated moss-sage with sky-wash highlights
# ----------------------------------------------------------------------------
GROUND_SUBJECT = (
    'macro photograph-like top-down view of forest moss covered ground with '
    'morning dew droplets sparkling, saturated moss-sage green organic moss '
    'mat, soft sky-wash-blue highlight tints in dewdrops, faint cosmic '
    'micro-sparkles like fairy dust scattered, organic irregular texture, '
    'NO repeating geometric pattern, NO grid lines, watercolor edge-feathering, '
    'rich painterly variation across the surface'
)

# ----------------------------------------------------------------------------
# 2. tile-dirt-painted-v3 — warm faded-rose + ink-aubergine veins
# ----------------------------------------------------------------------------
DIRT_SUBJECT = (
    'macro top-down view of soft pink earth and damp soil mixed with mineral '
    'veins, warm faded-rose dusty pink tone, ink-aubergine deep dark mineral '
    'cracks veining through the dirt, granular grainy texture with tiny '
    'pebbles and earth flecks, organic uneven distribution, hand-painted '
    'Hayao Miyazaki watercolor earth, soft uneven Tenniel woodcut grain'
)

# ----------------------------------------------------------------------------
# 3. tile-wall-painted-v3 — ink-aubergine with saffron-glow accents
# ----------------------------------------------------------------------------
WALL_SUBJECT = (
    'macro top-down view of mystical underground stone block, ink-aubergine '
    'deep purple-black stone surface with subtle vertical shadow ribbing '
    'suggesting carved column structure, faint saffron-glow orange warm '
    'underlight highlights catching the edges, mineral wet-stone watercolor '
    'wash, irregular organic stone grain, NOT brick pattern NOT smooth wall'
)

# ----------------------------------------------------------------------------
# 4. tile-wall-cracked-painted-v3 — wall + 2-3 large ink cracks + saffron tip
# ----------------------------------------------------------------------------
WALL_CRACKED_SUBJECT = (
    'macro top-down view of damaged mystical stone block matching reference '
    'wall-tile style with TWO LARGE BRANCHING CRACKS forking diagonally '
    'across the surface, ink-aubergine deep purple-black stone base, ragged '
    'ink-line crack edges in pure-black, saffron-glow orange warm spark '
    'glow at one crack tip where bomb impacted, subtle vertical shadow '
    'ribbing in untouched areas, mineral wet-stone watercolor'
)

# ----------------------------------------------------------------------------
# 5. tile-mushroom-painted-v3 — extreme close-up cap texture (NOT full mushroom)
# ----------------------------------------------------------------------------
MUSHROOM_SUBJECT = (
    'extreme macro close-up of a wet mushroom cap surface filling the entire '
    'frame, saffron-glow orange and faded-rose pink tiny phosphorescent dots '
    'scattered organically across the cap texture, glossy wet-look watercolor '
    'wash with paper-grain underneath, mushroom-cream pale base color of the '
    'cap, NOT a full mushroom, NOT a stem, NOT a body, JUST the cap-skin '
    'texture viewed up close like a microscope, organic irregular dot pattern'
)

# ----------------------------------------------------------------------------
# 6. tile-spike-strip-v3 — 1024x128 horizontal STRIP of organic spikes
# ----------------------------------------------------------------------------
SPIKE_STRIP_SUBJECT = (
    'horizontal row of EIGHT organic pointy hazardous spikes pointing upward, '
    'each spike is a curved organic thorn shape painted in faded-rose pink '
    'gradient transitioning to pop-magenta at the tips with saffron-glow '
    'orange highlights at the very point, soft watercolor halos around each '
    'spike, ink-aubergine ragged outline, spikes share a common ground-line '
    'at the bottom edge, NO repeating geometric pattern just hand-painted '
    'thorns, organic irregular spacing, NOT digital, hand-painted hazard row'
)

# Aspect ratio 8:1 forces horizontal strip composition.
SPIKE_STRIP_RIDER = (
    'long horizontal strip composition, frame is wide and short, view from '
    'side showing all eight spikes lined up across the strip, NO landscape '
    'NO sky NO scene, just a flat hazard-strip texture asset for 2D '
    'platformer game, isolated game asset on flat neutral grey card '
    'background, sharp focus crisp ink lines NOT blurry'
)


def spike_strip_prompt() -> str:
    return f'{SPIKE_STRIP_RIDER}. {SPIKE_STRIP_SUBJECT}. {TILE_STYLE}, {PALETTE}'


# ----------------------------------------------------------------------------
# 6b. tile-spike-painted-v3 — fallback 1024x1024 single spike-tile (per-tile)
# ----------------------------------------------------------------------------
SPIKE_TILE_SUBJECT = (
    'macro close-up of THREE or FOUR organic pointy hazardous spikes pointing '
    'upward in a small cluster, each spike is a curved organic thorn shape '
    'painted in faded-rose pink gradient transitioning to pop-magenta at the '
    'tips with saffron-glow orange highlights at the very point, soft '
    'watercolor halos around each spike, ink-aubergine ragged outline, '
    'spikes share a common ground-line at the bottom of the tile, NOT '
    'geometric NOT digital, hand-painted thorn-cluster game-hazard tile'
)

# ----------------------------------------------------------------------------
# 7. tile-trampoline-painted-v3 — soft pink mushroom-cap-as-trampoline
# ----------------------------------------------------------------------------
TRAMPOLINE_SUBJECT = (
    'macro top-down view of a soft pink-peach mushroom cap acting as a '
    'taut bouncy trampoline surface, faded-rose pink-peach cap-skin stretched '
    'tight like a drum, saffron-glow orange warm rim light suggesting bounce-'
    'energy, mushroom-cream pale center, soft watercolor sheen catching the '
    'light, faint sky-wash-blue cosmic spark dots floating just above the '
    'surface suggesting bounce-energy, organic irregular cap shape'
)

# ----------------------------------------------------------------------------
# 8. tile-ladder-painted-v3 — VERTICAL 256x1024 organic vine/rope ladder
# ----------------------------------------------------------------------------
LADDER_SUBJECT = (
    'a vertical hand-painted organic climbing vine rope hanging straight down '
    'in the center of the frame, the vine is a thick faded-rose pink and '
    'moss-sage green twisted plaited cord with small ink-aubergine knots '
    'every short distance suggesting hand-grips, soft saffron-glow orange '
    'underlight catching the rope edges, faint cosmic dewdrops dripping '
    'downward suggesting moisture, ink-aubergine ragged outline, watercolor '
    'wet-edge bleeds, NOT a geometric ladder NOT metal NOT wooden rungs, '
    'organic plant-vine climbing rope, hand-painted Hayao Miyazaki style'
)

LADDER_RIDER = (
    'tall vertical strip composition, frame is narrow and tall, the vine '
    'fills the center vertically running top to bottom edge to edge, NO '
    'landscape NO scene NO sky NO horizon NO ground, just a flat climbing-'
    'vine texture asset for 2D platformer game, isolated game asset on flat '
    'neutral grey card background, tileable vertically'
)


def ladder_prompt() -> str:
    return f'{LADDER_RIDER}. {LADDER_SUBJECT}. {TILE_STYLE}, {PALETTE}'


# ----------------------------------------------------------------------------
# 9. bg-grass-strip-v3 — 1024x128 horizontal painted bottom-strip
# ----------------------------------------------------------------------------
GRASS_SUBJECT = (
    'horizontal painted strip of lush moss-sage green grass blades and '
    'tiny mushroom caps poking up at irregular intervals, with small cosmic '
    'flowers (faded-rose pink and saffron-glow orange) scattered between '
    'the grass tufts, painted ground-line at the bottom of the strip in '
    'forest-deep dark green, soft watercolor wet-edge bleeds, organic '
    'irregular plant heights, NO repeating pattern just continuous '
    'hand-painted grass-strip, ink-aubergine ragged plant outlines'
)

GRASS_RIDER = (
    'long horizontal strip composition, frame is wide and short, view from '
    'side showing the grass-line as a painted band, NO sky NO mountains NO '
    'scene above the grass, just a flat grass-strip texture asset for 2D '
    'platformer game level edges, isolated asset on flat neutral grey card '
    'background, sharp focus crisp ink lines'
)


def grass_strip_prompt() -> str:
    return f'{GRASS_RIDER}. {GRASS_SUBJECT}. {TILE_STYLE}, {PALETTE}'


# ============================================================================
# Job definitions — model + prompt + target + size
# ============================================================================
JOBS = [
    # 6 painted square tiles via Flux Pro v1.1 ($0.05 each = $0.30)
    {
        'label': 'tile-ground-painted-v3',
        'endpoint': 'fal-ai/flux-pro/v1.1',
        'prompt': tile_prompt(GROUND_SUBJECT),
        'size': {'width': 1024, 'height': 1024},
        'target': TILES_DIR / 'tile-ground-painted-v3.png',
    },
    {
        'label': 'tile-dirt-painted-v3',
        'endpoint': 'fal-ai/flux-pro/v1.1',
        'prompt': tile_prompt(DIRT_SUBJECT),
        'size': {'width': 1024, 'height': 1024},
        'target': TILES_DIR / 'tile-dirt-painted-v3.png',
    },
    {
        'label': 'tile-wall-painted-v3',
        'endpoint': 'fal-ai/flux-pro/v1.1',
        'prompt': tile_prompt(WALL_SUBJECT),
        'size': {'width': 1024, 'height': 1024},
        'target': TILES_DIR / 'tile-wall-painted-v3.png',
    },
    {
        'label': 'tile-wall-cracked-painted-v3',
        'endpoint': 'fal-ai/flux-pro/v1.1',
        'prompt': tile_prompt(WALL_CRACKED_SUBJECT),
        'size': {'width': 1024, 'height': 1024},
        'target': TILES_DIR / 'tile-wall-cracked-painted-v3.png',
    },
    {
        'label': 'tile-mushroom-painted-v3',
        'endpoint': 'fal-ai/flux-pro/v1.1',
        'prompt': tile_prompt(MUSHROOM_SUBJECT),
        'size': {'width': 1024, 'height': 1024},
        'target': TILES_DIR / 'tile-mushroom-painted-v3.png',
    },
    {
        'label': 'tile-trampoline-painted-v3',
        'endpoint': 'fal-ai/flux-pro/v1.1',
        'prompt': tile_prompt(TRAMPOLINE_SUBJECT),
        'size': {'width': 1024, 'height': 1024},
        'target': TILES_DIR / 'tile-trampoline-painted-v3.png',
    },
    # Spike strip — 1024x128 (8:1)
    {
        'label': 'tile-spike-strip-v3',
        'endpoint': 'fal-ai/flux-pro/v1.1',
        'prompt': spike_strip_prompt(),
        'size': {'width': 1024, 'height': 128},
        'target': TILES_DIR / 'tile-spike-strip-v3.png',
    },
    # Spike per-tile fallback (in case engine doesn't get refactored to strip)
    {
        'label': 'tile-spike-painted-v3',
        'endpoint': 'fal-ai/flux/dev',
        'prompt': tile_prompt(SPIKE_TILE_SUBJECT),
        'size': {'width': 1024, 'height': 1024},
        'target': TILES_DIR / 'tile-spike-painted-v3.png',
    },
    # Vertical ladder vine — 256x1024 (1:4)
    {
        'label': 'tile-ladder-painted-v3',
        'endpoint': 'fal-ai/flux/dev',
        'prompt': ladder_prompt(),
        'size': {'width': 256, 'height': 1024},
        'target': TILES_DIR / 'tile-ladder-painted-v3.png',
    },
    # Bottom grass strip — 1024x128 (8:1)
    {
        'label': 'bg-grass-strip-v3',
        'endpoint': 'fal-ai/flux/dev',
        'prompt': grass_strip_prompt(),
        'size': {'width': 1024, 'height': 128},
        'target': BG_DIR / 'bg-grass-strip-v3.png',
    },
]


# ============================================================================
# Pipeline runner
# ============================================================================
def submit_all() -> list[dict]:
    out = []
    for job in JOBS:
        try:
            req_id, resp_url = submit_flux(job['endpoint'], job['prompt'], job['size'])
            j = {**job, 'request_id': req_id, 'response_url': resp_url, 'status': 'submitted'}
            j['target'] = str(job['target'])
            out.append(j)
            print(f'[SUBMIT] {job["label"]} → {req_id}')
        except Exception as e:
            out.append({**job, 'status': 'submit-failed', 'error': str(e), 'target': str(job['target'])})
            print(f'[SUBMIT-FAIL] {job["label"]}: {e}')
    return out


def collect_raw(jobs: list[dict]) -> list[dict]:
    def collect_one(job: dict) -> dict:
        if job.get('status') != 'submitted':
            return job
        label = job['label']
        print(f'[POLL] {label}...')
        result = poll_until_done(job['response_url'], label)
        if not result:
            job['status'] = 'poll-failed'
            return job
        url = extract_image_url(result)
        if not url:
            job['status'] = 'no-image-url'
            job['poll_result'] = result
            return job
        try:
            target = Path(job['target'])
            size = http_download(url, target)
            job['raw_url'] = url
            job['raw_path'] = str(target)
            job['raw_size'] = size
            job['status'] = 'raw-downloaded'
            print(f'[OK] {label} {size//1024}KB → {target.name}')
        except Exception as e:
            job['status'] = 'download-failed'
            job['error'] = str(e)
        return job

    out = []
    with ThreadPoolExecutor(max_workers=6) as ex:
        futures = [ex.submit(collect_one, j) for j in jobs]
        for f in as_completed(futures):
            out.append(f.result())
    return out


def main():
    print('=== Sprint 11C — tile-set + spikes + ladders + grass redesign ===')
    print(f'Jobs: {len(JOBS)}')
    print('\n[1/2] Submitting jobs...')
    jobs = submit_all()
    submitted = sum(1 for j in jobs if j.get('status') == 'submitted')
    print(f'Submitted {submitted}/{len(jobs)}')

    print('\n[2/2] Polling + downloading...')
    jobs = collect_raw(jobs)
    raw_ok = sum(1 for j in jobs if j.get('status') == 'raw-downloaded')
    print(f'Downloaded {raw_ok}/{len(jobs)}')

    # Strip job dicts of unserializable fields
    for j in jobs:
        j.pop('endpoint_func', None)

    manifest = {
        'sprint': 'Sprint 11C — Tile-set + spikes + ladders + grass redesign',
        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'flux_jobs': jobs,
        'summary': {
            'total_jobs': len(jobs),
            'submitted': submitted,
            'downloaded': raw_ok,
        },
    }
    out_path = ROOT / 'scripts/sprint11c/_manifest.json'
    out_path.write_text(json.dumps(manifest, indent=2))
    print(f'\nManifest: {out_path}')

    # Print summary per job
    for j in jobs:
        st = j.get('status', '?')
        sz = j.get('raw_size', 0)
        print(f"  {j['label']:36s}  {st:20s}  {sz//1024 if sz else 0} KB")


if __name__ == '__main__':
    main()
