#!/bin/bash
# fase-b-batch.sh — Sprint 4.5 Fase B coherent asset regeneration
# Canonical STEM + per-asset rider + optional BiRefNet remove-bg
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GAME_DIR="$(dirname "$SCRIPT_DIR")"
GAMES_ROOT="$(dirname "$GAME_DIR")"

source "$GAMES_ROOT/.env"
[[ -z "$FAL_AI_KEY" ]] && { echo "Missing FAL_AI_KEY"; exit 1; }

# ============================================================================
# CANONICAL STEM (locked v4 hybrid — copy LITERAL from _STYLE-STEM.md)
# ============================================================================
STEM='Moebius Arzach woodcut illustration crossed with Tenniel Alice in Wonderland and Hayao Miyazaki, HEAVY INK LINEWORK with visible ink-aubergine underdrawing and ragged outlines, BUT filled with SATURATED LUSH WATERCOLOR — cosmic dreamy luminous palette with glowing magenta-pink fluo-lime electric sky-wash and saffron-glow accents, paper-grain texture, slightly uncanny psychedelic illustration, cosmic-adventure mood, NOT dusk NOT dark NOT moody, full daylight luminous, NOT kawaii NOT chibi NOT pixar NOT cute NOT children-book NOT roblox NOT digital NOT 3D NOT photoreal, INK LINEWORK COMPULSORY'

SPRITE_RIDER='side-view facing right on neutral grey paper card background, character fills 70% of frame, full ink-line woodcut definition, wet-edge watercolor bleeds inside silhouette, NOT centered overlay, NOT blurry NOT soft focus, sharp focus high detail crisp ink lines'

TILE_RIDER='close-up macro view of ONE 2D platformer game tile element only, horizontal strip filling entire frame edge to edge, NO landscape NO scenery NO sky NO mountains NO trees NO horizon, NOT a painting NOT a scene, just a single ground-strip texture asset for sidescroller game, organic painted edges that tile flush left and right with no outline on left or right sides, top edge prominent ink-line, sharp focus crisp ink lines NOT blurry, isolated game asset on flat neutral grey card background'

PICKUP_RIDER='close-up centered view of ONE single floating game-pickup object only, NO landscape NO scenery NO background scene, isolated object on flat neutral grey card background, faint micro-halo, fluo-pop magenta and lime ring around object only (max 5 percent of pixels), painted illustration not icon, sharp focus crisp ink lines NOT blurry, NOT a painting of a scene, just a single 2D game collectible asset'

# ============================================================================
# Helpers
# ============================================================================
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

# Submit a fal.ai generation to the queue, return request_id + response_url
submit_flux_dev() {
    local prompt="$1"
    local size_json="$2"
    local body
    body=$(jq -n --arg p "$prompt" --argjson s "$size_json" '{prompt:$p, image_size:$s, num_images:1}')
    curl -s -X POST "https://queue.fal.run/fal-ai/flux/dev" \
        -H "Authorization: Key $FAL_AI_KEY" \
        -H "Content-Type: application/json" \
        -d "$body"
}

submit_flux_pro() {
    local prompt="$1"
    local size_json="$2"
    local body
    body=$(jq -n --arg p "$prompt" --argjson s "$size_json" '{prompt:$p, image_size:$s, num_images:1}')
    curl -s -X POST "https://queue.fal.run/fal-ai/flux-pro/v1.1" \
        -H "Authorization: Key $FAL_AI_KEY" \
        -H "Content-Type: application/json" \
        -d "$body"
}

submit_birefnet() {
    local image_url="$1"
    curl -s -X POST "https://queue.fal.run/fal-ai/birefnet" \
        -H "Authorization: Key $FAL_AI_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"image_url\": \"$image_url\"}"
}

# Poll a queued request until COMPLETED, return image url
poll_until_image() {
    local response_url="$1"
    local label="$2"
    local max_polls=90
    for i in $(seq 1 $max_polls); do
        local result
        result=$(curl -s "$response_url" -H "Authorization: Key $FAL_AI_KEY")
        local status
        status=$(echo "$result" | python3 -c "import sys,json
try: d=json.load(sys.stdin); print(d.get('status',''))
except: print('')" 2>/dev/null)

        if [ "$status" = "COMPLETED" ]; then
            local url
            url=$(echo "$result" | python3 -c "import sys,json
try:
  d=json.load(sys.stdin)
  img=d.get('image',{})
  if isinstance(img,dict) and img.get('url'):
    print(img['url']); raise SystemExit
  imgs=d.get('images',[])
  if imgs: print(imgs[0].get('url','')); raise SystemExit
  print('')
except SystemExit: pass
except: print('')")
            echo "$url"
            return 0
        elif [ "$status" = "FAILED" ]; then
            echo "" >&2
            echo "FAILED: $label" >&2
            echo "$result" >&2
            return 1
        fi

        # No status — maybe direct response
        if [ -z "$status" ]; then
            local url
            url=$(echo "$result" | python3 -c "import sys,json
try:
  d=json.load(sys.stdin)
  img=d.get('image',{})
  if isinstance(img,dict) and img.get('url'):
    print(img['url']); raise SystemExit
  imgs=d.get('images',[])
  if imgs: print(imgs[0].get('url','')); raise SystemExit
  print('')
except SystemExit: pass
except: print('')")
            if [ -n "$url" ]; then
                echo "$url"
                return 0
            fi
        fi
        sleep 2
    done
    echo ""
    return 1
}

# Generate a single image asset to a target path. Skips if exists.
# Args: 1=output_path, 2=prompt, 3=size_json, 4=model (flux-dev|flux-pro)
gen_image() {
    local outpath="$1"
    local prompt="$2"
    local size_json="$3"
    local model="$4"
    local label
    label="$(basename "$outpath")"

    if [ -f "$outpath" ] && [ -s "$outpath" ]; then
        echo -e "${YELLOW}SKIP${NC} $label (already exists)"
        return 0
    fi

    mkdir -p "$(dirname "$outpath")"
    echo -e "${CYAN}GEN${NC}  $label  ($model)"

    local resp
    if [ "$model" = "flux-pro" ]; then
        resp=$(submit_flux_pro "$prompt" "$size_json")
    else
        resp=$(submit_flux_dev "$prompt" "$size_json")
    fi

    local response_url
    response_url=$(echo "$resp" | python3 -c "import sys,json
try: print(json.load(sys.stdin).get('response_url',''))
except: print('')")
    local request_id
    request_id=$(echo "$resp" | python3 -c "import sys,json
try: print(json.load(sys.stdin).get('request_id',''))
except: print('')")

    if [ -z "$response_url" ]; then
        if [ "$model" = "flux-pro" ]; then
            response_url="https://queue.fal.run/fal-ai/flux-pro/v1.1/requests/$request_id"
        else
            response_url="https://queue.fal.run/fal-ai/flux/dev/requests/$request_id"
        fi
    fi

    local img_url
    img_url=$(poll_until_image "$response_url" "$label")
    if [ -z "$img_url" ]; then
        echo -e "${RED}FAIL${NC} $label"
        return 1
    fi

    curl -s -o "$outpath" "$img_url"
    if [ -f "$outpath" ] && [ -s "$outpath" ]; then
        local size
        size=$(ls -lh "$outpath" | awk '{print $5}')
        echo -e "${GREEN}OK${NC}   $label  ($size)"
    else
        echo -e "${RED}FAIL${NC} $label (download)"
        return 1
    fi
}

# Run BiRefNet remove-bg. Output goes next to input as <name>-cleaned.png.
# Skip if cleaned file already exists with reasonable size.
remove_bg() {
    local inpath="$1"
    local outpath="${inpath%.png}-cleaned.png"
    local label
    label="$(basename "$outpath")"

    if [ -f "$outpath" ] && [ "$(stat -f%z "$outpath" 2>/dev/null || echo 0)" -gt 5000 ]; then
        echo -e "${YELLOW}SKIP${NC} $label (already cleaned)"
        return 0
    fi

    if [ ! -f "$inpath" ]; then
        echo -e "${RED}FAIL${NC} $label (no source)"
        return 1
    fi

    # Upload the file to fal.ai's storage so we get a URL? — easier: re-fetch
    # using the local file via fal.run upload endpoint
    echo -e "${CYAN}REMBG${NC} $label"

    # fal.ai supports passing an image URL OR a data URL. Use data URL for local files.
    local mime="image/png"
    local b64
    b64=$(base64 -i "$inpath" | tr -d '\n')
    local data_url="data:$mime;base64,$b64"

    local resp
    resp=$(curl -s -X POST "https://queue.fal.run/fal-ai/birefnet" \
        -H "Authorization: Key $FAL_AI_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"image_url\": \"$data_url\"}")

    local response_url
    response_url=$(echo "$resp" | python3 -c "import sys,json
try: print(json.load(sys.stdin).get('response_url',''))
except: print('')")
    local request_id
    request_id=$(echo "$resp" | python3 -c "import sys,json
try: print(json.load(sys.stdin).get('request_id',''))
except: print('')")

    if [ -z "$response_url" ]; then
        response_url="https://queue.fal.run/fal-ai/birefnet/requests/$request_id"
    fi

    local img_url
    img_url=$(poll_until_image "$response_url" "$label")
    if [ -z "$img_url" ]; then
        echo -e "${RED}FAIL${NC} $label (rembg)"
        return 1
    fi

    curl -s -o "$outpath" "$img_url"
    local size_bytes
    size_bytes=$(stat -f%z "$outpath" 2>/dev/null || echo 0)
    if [ "$size_bytes" -lt 5000 ]; then
        echo -e "${RED}WARN${NC} $label (cleaned <5KB, possibly over-stripped: $size_bytes bytes)"
        rm -f "$outpath"
        return 1
    fi
    local size
    size=$(ls -lh "$outpath" | awk '{print $5}')
    echo -e "${GREEN}OK${NC}   $label  ($size)"
}

# ============================================================================
# Asset definitions
# ============================================================================
SQUARE='{"width":1024,"height":1024}'
LANDSCAPE_16_9='{"width":1024,"height":576}'

GAME="$GAME_DIR"
SPRITES_V2="$GAME/public/assets/sprites/v2"
TILES="$GAME/public/assets/tiles"
PICKUPS="$GAME/public/assets/pickups"
BG="$GAME/public/assets/backgrounds/slow-bloom-v2"

mkdir -p "$SPRITES_V2" "$TILES" "$PICKUPS" "$BG"

# ----- COSMO frames (6) -----
COSMO_BASE='small slim moss-sage alien creature, two long suction-cup hands like wet rubber gloves dangling at sides, single thin antenna with faded-rose tip on top of head, large solemn black ink-eye with single saffron catchlight, woodcut linework, slightly uncanny NOT cute'

declare -a COSMO_FRAMES=(
    "cosmo-walk-1|side profile facing right, mid-stride left foot forward, body slight forward lean, suction-cup hands loose at sides"
    "cosmo-walk-2|side profile facing right, neutral standing pose, suction-cup hands at sides"
    "cosmo-walk-3|side profile facing right, mid-stride right foot forward, body slight forward lean"
    "cosmo-jump-up|side profile facing right, mid-air apex jump pose, suction-cup hands raised upward, antenna trailing slightly back"
    "cosmo-jump-fall|side profile facing right, falling pose mid-air, suction-cup hands spread for balance, antenna trailing back, downward motion"
    "cosmo-cling|front-facing perspective, body flattened against invisible vertical wall, both suction-cup palms pressed forward toward viewer, slight squash deformation"
)

# ----- ENEMIES (3) -----
declare -a ENEMIES=(
    "enemy-brumberry|uncanny faded-rose berry-creature with three ink-aubergine tendril-arms ending in beaks, single sleepy half-closed eye dripping a saffron tear, sinister-melancholic mood, side-view threat pose, slightly menacing"
    "enemy-hopper-cabbage|uncanny moss-sage cabbage-creature with overlapping leafy layers and faded-rose vein patterns on leaves, single sleepy droopy eye, two tiny saffron-tipped legs caught mid-jump, side-view, slightly absurd alien"
    "enemy-eye-plant|sinister hostile alien plant, single oversized aubergine eye on top of a twisted forest-deep stalk emerging from ground, faded-rose iris with saffron pupil dripping ink-aubergine sap, three thorny moss-sage leaves spread at base, threat pose"
)

# ----- TILES (5) -----
declare -a TILES_DEF=(
    "tile-ground|moss-sage organic ground strip with grass tufts on top edge, ink-aubergine ragged bottom edge, woodcut linework, lateral strip composition"
    "tile-dirt|packed earth strip with horizontal ink-line striations and small embedded pebbles, forest-deep tone, lateral strip composition"
    "tile-wall|vertical alien-bark or stone strip with prominent ink-line vertical wood-grain texture, ink-aubergine main color, lateral strip composition"
    "tile-mushroom|painted mushroom-cream platform-cap strip with faded-rose lichen patches and fluo-lime moss tufts on top edge, painted ink-line top, lateral strip composition"
    "tile-spike|row of four sharp magenta-pink thorns with ink-aubergine outlines growing upward from a forest-deep base strip, organic NOT geometric thorns, lateral strip composition"
)

# ----- PICKUPS (4) -----
declare -a PICKUPS_DEF=(
    "pickup-star|single floating saffron-glow geometric Dewdrop crystal pickup with bright pop-magenta and pop-lime micro-halo glow rays, painted illustration"
    "pickup-powerup|painted alien power-up mushroom with mushroom-cream cap fluo-lime stem and ink-aubergine spores swirling around it, faint saffron halo"
    "pickup-cheeseburger|painted alien cheeseburger easter-egg pickup, mushroom-cream bun top and bottom with faded-rose meat patty and saffron-glow filling, ink-line outline, slightly absurd"
    "hint-globe|sky-wash blue painted floating hint orb with ink underdrawing visible inside the globe, faint saffron halo, soft inner glow, transparent crystal-ball look"
)

# ----- BACKGROUNDS (4) — Flux Pro, landscape 16:9 -----
BG_SKY_PROMPT="$STEM, pure cosmic alien sky composition NO foreground NO ground, layered nebula clouds in cosmic luminous palette of magenta cyan and yellow, distant glowing planet-moon with subtle nebula corona, faint star-field, watercolor wet-edge bleeds, paper grain, 16:9 landscape, NOT moody NOT dusk full luminous daylight, NO mountains NO trees NO mushrooms NO characters NO figures NO silhouettes"

BG_FAR_PROMPT="$STEM, distant horizon silhouette composition, ink-aubergine mountain ranges with saffron-glow rim-light, far translucent moss-sage mushroom canopy hints, atmospheric haze fading to transparent at top, transparent upper half so cosmic sky shows through, watercolor wet-edge bleeds, paper grain, 16:9 landscape, NO characters NO figures NO foreground flora"

BG_MID_PROMPT="$STEM, mid-distance painted alien forest composition, fluo-lime moss-sage and faded-rose mushroom-trees scattered, mushroom-cream stems with visible ink linework, mostly mid-frame and edges with transparent center for gameplay clarity, watercolor wet-edge bleeds, paper grain, 16:9 landscape, NO characters NO figures NO ground NO sky"

BG_NEAR_PROMPT="$STEM, foreground frame composition for parallax depth, ink-aubergine drooping vines and hanging branches at top of frame, bright magenta-pink glowing mushrooms at left and right edges only with fluo-lime moss patches at bottom corners, transparent center 70 percent so gameplay reads clearly, paper grain heavy outline, NO characters NO figures NO sky"

# ============================================================================
# EXECUTION
# ============================================================================
echo -e "${CYAN}=== Sprint 4.5 Fase B — coherent regen ===${NC}"
echo "Game: $GAME"
echo ""

# Track failures
FAILURES=()

generate_or_track() {
    if ! gen_image "$@"; then
        FAILURES+=("$1")
    fi
}

remove_bg_or_track() {
    if ! remove_bg "$1"; then
        FAILURES+=("rembg:$1")
    fi
}

# === COSMO ===
echo -e "${CYAN}--- Cosmo frames (6) ---${NC}"
for entry in "${COSMO_FRAMES[@]}"; do
    name="${entry%%|*}"
    pose="${entry##*|}"
    out="$SPRITES_V2/$name.png"
    prompt="$STEM, $COSMO_BASE, $pose, $SPRITE_RIDER"
    generate_or_track "$out" "$prompt" "$SQUARE" "flux-dev"
done

# === ENEMIES ===
echo -e "${CYAN}--- Enemies (3) ---${NC}"
for entry in "${ENEMIES[@]}"; do
    name="${entry%%|*}"
    desc="${entry##*|}"
    out="$SPRITES_V2/$name.png"
    prompt="$STEM, $desc, $SPRITE_RIDER"
    generate_or_track "$out" "$prompt" "$SQUARE" "flux-dev"
done

# === TILES ===
# IMPORTANT: tile-rider goes FRONT (before STEM) — STEM phrasing biases Flux Dev to landscapes
echo -e "${CYAN}--- Tiles (5) ---${NC}"
TILE_FORMAT_PREFIX='2D sidescroller game tile asset, isolated horizontal strip on flat neutral grey card background, NO scenery NO landscape NO sky NO horizon NO mountains NO trees, just a single flat strip block from a side-scrolling platformer game level, viewed from straight side, fills frame edge to edge horizontally, organic painted edges that tile flush left-right with no outline on left or right'
for entry in "${TILES_DEF[@]}"; do
    name="${entry%%|*}"
    desc="${entry##*|}"
    out="$TILES/$name.png"
    prompt="$TILE_FORMAT_PREFIX, $desc, $STEM, woodcut linework"
    generate_or_track "$out" "$prompt" "$SQUARE" "flux-dev"
done

# === PICKUPS ===
# Same: rider-FIRST to anchor format
echo -e "${CYAN}--- Pickups (4) ---${NC}"
PICKUP_FORMAT_PREFIX='close-up centered macro view of ONE single floating game-pickup object only, NO landscape NO scenery NO background scene NO horizon, isolated subject on flat neutral grey card background, painted illustration not icon, faint micro-halo with fluo-pop magenta and lime ring around object only (max 5 percent of pixels)'
for entry in "${PICKUPS_DEF[@]}"; do
    name="${entry%%|*}"
    desc="${entry##*|}"
    out="$PICKUPS/$name.png"
    prompt="$PICKUP_FORMAT_PREFIX, $desc, $STEM, sharp focus crisp ink lines NOT blurry"
    generate_or_track "$out" "$prompt" "$SQUARE" "flux-dev"
done

# === BACKGROUNDS ===
echo -e "${CYAN}--- Backgrounds (4 layers) ---${NC}"
generate_or_track "$BG/bg-sky.png"  "$BG_SKY_PROMPT"  "$LANDSCAPE_16_9" "flux-pro"
generate_or_track "$BG/bg-far.png"  "$BG_FAR_PROMPT"  "$LANDSCAPE_16_9" "flux-pro"
generate_or_track "$BG/bg-mid.png"  "$BG_MID_PROMPT"  "$LANDSCAPE_16_9" "flux-pro"
generate_or_track "$BG/bg-near.png" "$BG_NEAR_PROMPT" "$LANDSCAPE_16_9" "flux-pro"

# === BiRefNet pass — sprites/enemies/tiles/pickups, NOT backgrounds ===
echo ""
echo -e "${CYAN}--- BiRefNet remove-bg pass ---${NC}"

for entry in "${COSMO_FRAMES[@]}"; do
    name="${entry%%|*}"
    remove_bg_or_track "$SPRITES_V2/$name.png"
done

for entry in "${ENEMIES[@]}"; do
    name="${entry%%|*}"
    remove_bg_or_track "$SPRITES_V2/$name.png"
done

for entry in "${TILES_DEF[@]}"; do
    name="${entry%%|*}"
    remove_bg_or_track "$TILES/$name.png"
done

for entry in "${PICKUPS_DEF[@]}"; do
    name="${entry%%|*}"
    remove_bg_or_track "$PICKUPS/$name.png"
done

# === Summary ===
echo ""
echo -e "${CYAN}=== Summary ===${NC}"
if [ ${#FAILURES[@]} -eq 0 ]; then
    echo -e "${GREEN}All assets generated successfully${NC}"
else
    echo -e "${RED}Failures (${#FAILURES[@]}):${NC}"
    for f in "${FAILURES[@]}"; do
        echo "  - $f"
    done
    exit 1
fi
