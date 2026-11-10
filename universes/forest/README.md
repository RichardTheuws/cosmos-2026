# The Mushroom Forest — Zorp's entry Universe

> *The first place Zorp learned to wander.*

This is the **canonical reference Universe** for the Zorp's Universe substrate. It implements the full hybrid authoring contract — JSON spine + optional `behavior.ts` — and ships every optional behavior export so that any Claude-paired contributor copying this folder lands a working starting point for their own Universe.

The forest's quality bar IS the substrate's quality bar. Read it side-by-side with the [`UNIVERSE-AUTHORING.md`](../../UNIVERSE-AUTHORING.md) contract and the architect's full design doc at [`.claude/brainstorm/wave21/01-substrate-architecture.md`](../../.claude/brainstorm/wave21/01-substrate-architecture.md).

---

## What this Universe is

A watercolor cosmic-mushroom forest in the Hayao×Moebius idiom. Slow-bloom mushrooms drip nectar from the canopy under a soft-pastel cosmic horizon. A single trampoline lives in the Clearing — the canonical delight-loop ([NORTH-STAR §3](../../NORTH-STAR.md)).

This is the **entry Universe** for every Zorp. It's where a new player arrives, where any cross-universe traveler returns to (Zorp always knows the way home), and where contributors first learn the substrate by reading code instead of docs.

---

## Files in this Universe

| File | What it does | What changes if you fork |
|---|---|---|
| `manifest.json` | Universe metadata: name, license, asset list, post-FX preset, default Area | `name`, `displayName`, `summaryEn`, `author`, possibly `post.preset` |
| `areas.json` | Declares the Areas inside the Universe + their path-experience | `entryArea`, the `areas[]` list (id, mood, path-kind, room-membership) |
| `rooms.json` | Flat list of every Room in the Universe + which Area each belongs to | `rooms[]` — each Room's id, anchor, biome key, exits, area membership |
| `behavior.ts` | Optional TypeScript module implementing the five behavior tiers | This is where you encode anything richer than the substrate defaults |
| `README.md` | This file. | Rewrite for your Universe; keep the structure so reviewers know what to look for |

A JSON-only Universe (no `behavior.ts`) is valid — the substrate provides defaults for every tier (background, arrival, inhabitants, interactables, transitions, audio). The forest ships `behavior.ts` because it's the **teaching example**: every contributor needs to see how each tier wires up.

---

## The single Area: The Mushroom Stand

The forest is a **single-Area Universe**. Why one Area and not three? Because every Room here shares the same coherent mood — slow-bloom mushroom-cream sky, moss-sage ground, calm-baseline post-FX. The moment a Room would deviate (an inkpool hollow, a cathedral-cloud sky), it becomes a second Area.

The architect contract ([`01-substrate-architecture.md`](../../.claude/brainstorm/wave21/01-substrate-architecture.md) §1.2): *"An Area has a coherent mood; its Rooms vary that mood."* Three rooms, one mood = one Area. Three rooms, three moods = three Areas (or three Universes, depending on how strongly the moods diverge).

`The Mushroom Stand` declares a `pathExperience.kind = "mushroom-path"` — the Room↔Room transition feels like walking under a breathing canopy with spore-motes drifting at hip height. This is implemented in `behavior.ts::transitions.roomToRoom` (currently as a 2.0s biome-blend; the spore-mote particle layer is a documented Wave-22 TODO).

---

## The three Rooms

### Clearing — the entry Room

A soft mushroom-cream open space. **The trampoline lives here.** This is where Zorp arrives via the universe-arrival portal (saffron→ink-aubergine, 1.4s). The trampoline is wired through `behavior.ts::interactables` — the canonical delight-loop. Zorp walks to it and jumps; the user watches him love it.

### Deep Grove — the slow wander

Tall slow-bloom mushrooms drip nectar from the canopy. A breathing-portal stands at the far edge — it pulses subtly with the music. This Room demonstrates inhabitants without interactables; a place to be in, not a place to do something at.

### The Hollow — the small surprise

A burrow under the ground. Mouth-pillars breathe in time with the music (sprite-sheet animation driven by the audio-FFT bins). Anchor is at `y = -3`, so descending into the Hollow visually drops the camera. This Room demonstrates how a third Room creates a small graph-traversal surprise without breaking mood.

---

## The trampoline-as-delight-loop

> *"The trampoline. A regular trampoline, in the room. Zorp can walk to it and jump on it. He loves it. The user loves watching him love it. They keep coming back. This is the canonical 'delight loop' — every Room should have at least one of these (not always literally a trampoline, but its analog: a small, juicy, repeatable joy)."* — [NORTH-STAR §3](../../NORTH-STAR.md)

The trampoline is wired through `behavior.ts::interactables` as an `InteractableHandle`:

- **id**: `'trampoline'`
- **anchor**: at the Clearing's room-anchor, slightly forward in z
- **range**: `2.0` world-units — Zorp's idle-AI may target it from this radius
- **onUse(cosmo)**: triggers a jump-arc on Zorp's root (anticipation → launch → settle)

Per `forestInteractables(ctx)` the trampoline is **only spawned in the Clearing**. Other Rooms get an empty array, which the substrate's default (no interactables) honors. This pattern — per-Room interactable-list — is how a fork puts different delight-loops in different Rooms.

---

## How to fork this for your own Universe

```bash
# from repository root
cp -r universes/forest universes/your-name

# 1. Edit manifest.json:
#    - "name": "your-name" (must match folder)
#    - "displayName": ...
#    - "summaryEn": ...
#    - "author": ...
#    - optional: "post.preset" → one of "calm-baseline" | "deep-trip" | "neutral"

# 2. Edit areas.json:
#    - "entryArea": "your-area-id"
#    - "areas[].id" + "areas[].displayName"
#    - "areas[].pathExperience.kind" → one of "mushroom-path" | "burrow-down" | "drift" | "fade"
#    - "areas[].rooms[]" → must match room ids in rooms.json

# 3. Edit rooms.json:
#    - "entryRoom": "your-room-id"
#    - "rooms[].id" + "rooms[].area" + "rooms[].anchor" + "rooms[].exits"

# 4. Edit behavior.ts:
#    - swap the inhabitants list for your own decorations
#    - swap the trampoline for your delight-loop analog
#    - or delete behavior.ts entirely → substrate uses defaults for every tier

# 5. Test locally
npm run dev
# open http://localhost:5173/?substrate=v2&universe=your-name
```

Open a PR titled `universe: your-name`. Reviewers engage on contract-correctness, brand-fit, and posture-alignment per [`CONTRIBUTING.md`](../../CONTRIBUTING.md). For deeper authoring guidance read [`UNIVERSE-AUTHORING.md`](../../UNIVERSE-AUTHORING.md).

---

## Brand notes

The forest's visual language is locked by [NORTH-STAR §3](../../NORTH-STAR.md):

- **Hayao×Moebius watercolor** — never anime, never graphic-novel pop, never stock-3D
- **Locked palette**: mushroom-cream / moss-sage / sky-wash / faded-rose / ink-aubergine / saffron-glow / forest-deep
- **Pop-accents** ≤5%: pop-magenta / pop-lime / pop-cyan
- **Calm baseline + event-driven peaks** — the world breathes, doesn't shake
- **Character DNA**: pearl-drop head, chameleon-bulging eyes, saffron-crescent catchlight, antenna with bulb, soft fingerless mitten-hands with faintly saffron-glowing palms, faded-rose-spotted green skin, NO tail, slightly uncute proportions, slightly menacing-uncanny

A fork that intentionally deviates documents it in `manifest.brandDeviation` (a short rationale string). Forks that silently violate the brand contract are returned for revision in PR review, not policed at runtime.

---

## TODOs handed off to runtime-wirer (substrate phase 3)

These are documented inside `behavior.ts` near the relevant code:

1. **Asset paths** — `manifest.json` still uses `../../public/assets/...` paths. The architect contract (§1.1) forbids `../` for security. Phase 3 should normalise these to universe-folder-relative `assets/...` and either copy or symlink the actual files into `universes/forest/assets/`.
2. **SubstrateCtx canvas** — `behavior.ts::ForestBackground` falls back to `document.getElementById('scene-canvas')` because the architect's `SubstrateCtx` (§1.4) does not expose the canvas element. Either extend the context type or formalise `scene.userData.renderer`.
3. **Audio routing** — `behavior.ts::ForestAudio` is a no-op because the substrate's audio bridge is owned at `UniverseHost` scope (architect §3.2) and the reference `behavior.ts` cannot reach it. Wire the bridge's `setMusicTrack(slow-bloom-loop)` through the AudioHandle when the substrate phase-3 lands.
4. **Mouth-pillar audio clock** — the inhabitant's frame-cycler uses `globalUniforms.audioFFT` energy as a rough proxy for the audio-clock; the original `weirdoObstacleFactory` uses `audioBridge.musicCurrentTime()`. Thread the real audio-clock through the context when phase 3 wires it.
5. **CosmoState import** — architect §1.4 imports `CosmoState` from `'../../src/three/cosmoV2'`, but the actual export lives in `'../../src/phaser/entities/CosmoAgent'`. Either re-export from cosmoV2 or update the contract doc.
6. **Spore-mote transition layer** — `MushroomPathTransition` ships the biome-blend portion only. The cosmetic spore-mote drift overlay is a Wave-22 TODO.
