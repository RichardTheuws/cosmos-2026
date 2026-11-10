# Asset Runbook — The Singing Dunes (`universes/dunes`)

> Every NEW visual asset the Dunes universe references, ready to generate.
> Brand contract: Hayao×Moebius watercolor + locked palette
> (saffron-glow / ink-aubergine / faded-rose / mushroom-cream) + **one** pop-accent
> = **pop-magenta**, ≤5% of frame, peak-only. No emoji, no placeholder, no stock.
> Calm baseline + event-peaks — "the world breathes, it does not shake."
>
> Audio already exists: `dune-drone-open.mp3` + `dune-drone-hollow.mp3` ship in
> `public/assets/audio/music/`. Event SFX (ElevenLabs) are listed at the bottom
> for the audio pipeline — not visual assets, so no generation blocker here.

Asset-path convention: mirror forest verbatim — every asset resolved as
`../../public/assets/<...>` in `manifest.json`; the files live under
`public/assets/...`. `behavior.ts` loads them via `assetPath('assets/...')`.

---

## 1. BACKGROUND COMPOSITION LAYERS

`biomeKey:null` everywhere → the two rooms are painted by per-room
`composition-spec.json` (already authored). Each spec's layers are individual
alpha-cut PNGs sitting in the **same folder as the spec**. Generate them as
separate transparent layers (a multi-layer parallax stack), NOT a single flat
image. Frame sizes match the spec `frame_size`.

### ROOM A — The Long Dune  →  `public/assets/backgrounds/biome-dusk-dune/`
Spec frame: **2048 × 1024** (wide vista). 6 layers, back-to-front:

| File | dims | alpha-cut | Prompt (Hayao×Moebius watercolor, dusk sand-sea) |
|---|---|---|---|
| `layer-1_dusk-sky-gradient.png` | 2048×1024 | no (full-frame) | "A vast empty dusk sky over a desert, hand-painted Hayao Miyazaki × Moebius watercolor. A tall vertical gradient: a low band of warm saffron-glow light at the horizon bleeding upward into deep ink-aubergine at the top, a faded-rose mid-band where they meet. The first faint stars not yet committed, barely visible. Soft paper-grain wash, no hard edges, melancholy-beautiful, calm. No ground, no objects, no text." |
| `layer-2_heat-shimmer-horizon.png` | 2048×512 | yes (transparent above/below the band) | "A thin horizontal band of heat-shimmer haze at a desert horizon, watercolor Moebius style, faint saffron-glow wavering distortion, semi-transparent, soft wobble, dry warm air made visible. Transparent background, only the shimmer band painted." |
| `layer-3_far-dune-ranks.png` | 2048×600 | yes | "Ranks of distant desert dune-ridges receding toward a horizon, hand-painted watercolor, each ridge fainter than the last (atmospheric perspective), rendered in pale faded-rose alpenglow with ink-aubergine shadow-sides. Sparse, calm, horizontal. Transparent background above the dunes." |
| `layer-4_mid-dunes.png` | 2048×640 | yes | "A middle rank of sand dunes, watercolor Moebius style, lit faces in saffron-glow, long shadow-sides in ink-aubergine, a few wind-combed striations on the slopes, dry-brush sand texture. Transparent background. Calm, sparse." |
| `layer-5_near-crest.png` | 2048×720 | yes | "A single near foreground dune-crest seen from high on its lip, hand-painted watercolor, lit slope in dry-brush saffron-glow sand, long ink-aubergine shadow in its lee, a few wind-combed striations, mushroom-cream highlights on the brightest sand catching the last light. The crest fills the lower frame; transparent sky above. Moebius line-economy, calm, beautiful." |
| `layer-6_foreground-sand-grain.png` | 2048×1024 | yes (additive) | "A sparse field of fine drifting sand grains and dust motes for an additive overlay, faint warm saffron-glow specks on a fully transparent background, very subtle, like dry air catching the last light. No solid shapes." |

### ROOM B — The Windless Hollow  →  `public/assets/backgrounds/biome-dusk-hollow/`
Spec frame: **1536 × 1024** (tighter, cupped). 5 layers, back-to-front:

| File | dims | alpha-cut | Prompt |
|---|---|---|---|
| `layer-1_narrow-dusk-sky.png` | 1536×1024 | no (full-frame) | "A narrow band of dusk sky glimpsed from inside a sheltered desert hollow, hand-painted Hayao×Moebius watercolor. Soft ink-aubergine deepening upward, a gentler saffron-glow low, one single faint early star. Most of the frame is the dark upper sky; the warm band is narrow at the bottom. Calm, cradling, still." |
| `layer-2_far-dune-wall.png` | 1536×700 | yes | "The far inner wall of a sand hollow, watercolor, faded-rose reflected pooled light on the sand, curving away into ink-aubergine where it leaves the light. Soft, sheltered, intimate. Transparent background." |
| `layer-3_cupping-dune-walls.png` | 1536×900 | yes | "Two cupping dune-walls framing a sheltered desert hollow on the left and right, hand-painted watercolor, saffron-glow on the lit inner faces turning to ink-aubergine where they curve from light, faded-rose pooled reflections. They cup inward, leaving an open center. Transparent center and top." |
| `layer-4_rippled-bowl-floor.png` | 1536×640 | yes | "The cupped sand floor of a desert hollow drawn in concentric ripple-rings, hand-painted watercolor, faded-rose and mushroom-cream ripple-edges catching soft light, a smooth scoured wind-bowl depression at center. Fills the lower frame; transparent above. Calm, still, intimate." |
| `layer-5_settling-sand-shimmer.png` | 1536×1024 | yes (additive) | "A very faint settling-sand shimmer for an additive overlay, sparse warm mushroom-cream specks drifting down on a fully transparent background, almost subliminal, the air settling in a sheltered place. No solid shapes." |

> Generation note: 4K-quality watercolor; generate each layer on transparent
> alpha (green-screen workflow → BiRefNet alpha-cut as marked). Regenerate 3–5×
> for the brand bar. Keep cyan/lime OUT entirely — this universe's only
> pop-accent is **pop-magenta**, and it lives on the bead/bowl decals, not the
> sky.

---

## 2. INTERACTABLE OBJECT DECALS (painted, on-brand — no icons)

Rendered by `behavior.ts` as alpha-cut billboard planes (the forest-inhabitant
pattern). All under `public/assets/objects/`.

| File | dims | alpha-cut | Blend | Prompt |
|---|---|---|---|---|
| `slide-crest.png` | 1024×512 | yes | **additive sheen** | "A smooth dry-brushed sheen of saffron-glow sand on a dune's lit slope — the subtle mark of 'the place that slides,' hand-painted Hayao×Moebius watercolor. A soft elongated highlight-wash following the fall-line of the slope, brightest at the crest, fading downhill. NO icon, NO arrow, NO outline — just a luminous sand-sheen. Transparent background, soft additive glow." |
| `glass-bead-bloom.png` | 512×384 | yes | normal | "A small cluster of three or four half-buried desert-glass nodules in dune sand, hand-painted watercolor Moebius style. Mostly dormant warm-grey translucent nodules with faded-rose sand around them; ONE catches a tiny pinprick of impossible pop-magenta glint at its facet. Intimate, almost-hidden, a secret jewel. Transparent background. The magenta is a single sharp point, ≤5% of the asset." |
| `wind-bowl.png` | 1024×512 | yes | normal | "A scoured rippled sand-depression — a natural wind-bowl resonator — seen from a low angle, hand-painted watercolor. Concentric faded-rose and mushroom-cream sand ripples settling toward a smooth center, soft cream highlight-edges on the ripple-crests. Calm, still, a place that could ring. NO rim-light at rest (the pop-magenta rim is added in-engine on the peak only). Transparent background." |

> The pop-magenta rim-light that races the wind-bowl ripples and the brighter
> bead-glint are **engine-driven, peak-only** (set on the material color in
> `behavior.ts`'s `DuneDecal.update`) — do NOT bake them into the base PNG, so
> calm baseline carries zero pop-accent in the hollow (the peak feels earned).

---

## 3. LEGACY-FALLBACK 4K STILLS (declared in manifest `assets[]`)

The manifest lists `biome-dusk-dune-4k.png` (preload:true) and
`biome-dusk-hollow-4k.png` (preload:false) as the single-plane fallback if the
composition-spec fetch fails (the substrate's `addLegacyFallback` path). Each is
a flattened 4K render of the corresponding room.

| File | dims | alpha-cut | Prompt |
|---|---|---|---|
| `public/assets/backgrounds/biome-dusk-dune-4k.png` | 3840×2160 | no | The full Long Dune vista, all 6 layers composited: vast dusk sky (saffron→ink-aubergine→faded-rose), heat-shimmer horizon, receding dune-ranks, a near lit crest, drifting sand-grain. Hayao×Moebius watercolor, calm, near-empty, horizontal. |
| `public/assets/backgrounds/biome-dusk-hollow-4k.png` | 3840×2160 | no | The full Windless Hollow, all 5 layers composited: narrow dusk sky + one faint star, cupping dune-walls in saffron→faded-rose pooled light, a rippled wind-bowl floor. Intimate, cradling, still. |

---

## 4. EVENT SFX (ElevenLabs — not blocking visual gen; for the audio pipeline)

Beds already shipped. Five event sounds the interactables/transitions cue:
1. **sand-slide boom** (slide-crest onUse) — "deep resonant sand-boom swelling near-silence → warm sustained chord over ~1.8s then decaying into granular hiss, a cello note made of sand, no attack-transient."
2. **glass-bead glint** (bead-bloom onUse) — "single tiny crystalline shimmer-ping with a long soft tail, ~700ms, warm, almost subliminal."
3. **crest-wind** (Room A traversal/ambient peak) — "slow textured dry-wind swell with fine grain, rising/falling once over ~2.5s, no gust-spikes."
4. **bowl-ring** (singing-bowl onUse) — "sustained crystalline-sand singing-bowl tone rising slowly + blooming overtones over ~2.5s, wet finger circling a glass rim made of sand, very long decay."
5. **ripple-settle** + **hollow-hush** — "soft granular sand-trickle settling, ~1.5s, dry/descending" / "brief soft pressure-drop *whoomp* as wind cuts out, ~600ms (fires at the descend-leeward threshold)."

---

## 5. ANIMATION REQUESTS (cross-builder — Cosmo painted-frame clips)

These are NOT generatable here (shared 8×8 atlas, count 61, cell 256, fps 12).
The behavior.ts ships brand-true fallbacks so the universe is not blocked.

- **`slide`** (Dunes Room A) — ~1.6s one-shot: Cosmo sledding down a slope on his
  backside, arms out for balance, body angled downslope, antenna streaming back,
  calm not frantic, slight grin, suction-cups trailing. *Fallback shipped:*
  `fall` + procedural lateral-glide (rollZ + downhill `root.position` drift) +
  `stretch`. Doc-rated only **"acceptable"** → track as a REAL dependency (Room A
  headline joy). Preserves character-DNA: antenna-bulb, suction-cup hands, no tail.
- **`circle-sway`** (Dunes Room B) — 2s loop: slow trance-like circular sway,
  leaning into the turn, eyes half-lidded, suction-cups trailing. *Fallback
  shipped:* `dance` + procedural slow-orbit ("reads well"). Nice-to-have.
