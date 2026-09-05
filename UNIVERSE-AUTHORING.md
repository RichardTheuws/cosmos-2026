# Universe Authoring

A **Universe** is a self-contained module that Cosmo can travel into.

Read [`NORTH-STAR.md`](./NORTH-STAR.md) first — it is the *why*. This document is the **technical contract**: the JSON shapes, the optional TypeScript escape-hatch, the URL grammar, and the defaults that make a JSON-only Universe playable. Everything here implements [`.claude/brainstorm/wave21/01-substrate-architecture.md`](./.claude/brainstorm/wave21/01-substrate-architecture.md), which is the source of truth for the substrate.

## The hierarchy you are joining

```
Universe                   ← top-level container (you are here)
└── Area                   ← cluster of Rooms with a coherent mood
    └── Room               ← a single screen, fully alive
```

A **Universe** holds one or more Areas. An **Area** holds one or more Rooms connected by a path-experience (the path itself is content, not a loading screen). A **Room** is the focused scene Cosmo inhabits right now — Sims-dense, packed with little things to notice.

When you author a Universe you also author its Areas and Rooms. The schemas for those tiers live in two companion docs you should read in order: [`AREA-AUTHORING.md`](./AREA-AUTHORING.md), then [`ROOM-AUTHORING.md`](./ROOM-AUTHORING.md). Together the three files form a tree.

## The four required artifacts

Every Universe ships these four files. They live at `universes/<your-name>/` and are loaded in this order at boot.

### 1 · `manifest.json` — Universe metadata + asset preload list

```json
{
  "$schema": "https://cosmos-2026.dev/schemas/manifest-1.1.json",
  "version": "1.1",
  "name": "your-universe",
  "displayName": "Jouw Universum",
  "displayNameEn": "Your Universe — one-line English summary, ≤100 chars",
  "summaryEn": "Two sentences. What this Universe is, why it wants to exist.",
  "author": "Your Name",
  "license": "MIT",
  "behaviorModule": false,
  "defaultArea": "entry",
  "brandDeviation": null,
  "assets": [
    { "type": "image", "path": "assets/backgrounds/entry/sky.png", "preload": true },
    { "type": "audio", "path": "assets/ambient.mp3", "preload": false }
  ],
  "post": {
    "preset": "calm-baseline",
    "intensityCurve": { "bloom": 1.0, "kaleido": 0.85, "fluid": 0.9, "chroma": 1.0 }
  }
}
```

- **`version`** — schema version. Unknown majors fail loudly; minors are forward-compatible.
- **`name`** — the slug. Must equal the folder name. It is what appears in `?universe=<name>`.
- **`displayName`** / **`displayNameEn`** — any language for the first; English ≤100 chars for the second so non-native readers can navigate.
- **`summaryEn`** — two sentences. Used in PR review and any future Universe index.
- **`author`** / **`license`** — required. MIT is the project default; nothing stops you from picking something else, but reviewers will ask why.
- **`behaviorModule`** — `true` if you ship a `behavior.ts` (see below), `false` for JSON-only Universes. The substrate uses this hint to skip a 404-probe in production.
- **`defaultArea`** — the area id loaded when the URL omits `&area=`. Must reference an entry in `areas.json`.
- **`brandDeviation`** — `null` for Universes that follow the brand contract; otherwise a short rationale reviewers will engage with.
- **`assets[]`** — declarative preload list. Paths are universe-folder-relative; `../` is stripped for safety. `preload: true` resolves before arrival; `preload: false` is lazy.
- **`post.preset`** — one of `"calm-baseline" | "deep-trip" | "neutral"`. Drives the post-FX biome curve while inside this Universe. Defaults to `"calm-baseline"`.
- **`post.intensityCurve`** — multipliers on the post-FX stack. Optional.

### 2 · `areas.json` — the Area tier

Required. Even a single-Area Universe declares it explicitly. Full schema and design guidance live in [`AREA-AUTHORING.md`](./AREA-AUTHORING.md). The minimum shape:

```json
{
  "$schema": "https://cosmos-2026.dev/schemas/areas-1.0.json",
  "version": "1.0",
  "entryArea": "entry",
  "areas": [
    {
      "id": "entry",
      "displayName": "Entry",
      "displayNameEn": "Entry",
      "description": "One-to-three sentences describing the mood and what makes this Area distinct.",
      "moodOverrides": null,
      "pathExperience": {
        "kind": "fade",
        "duration": 1.6,
        "ambient": "#F5EDD8",
        "description": "Default fade-through path between Rooms in this Area."
      },
      "rooms": ["start"]
    }
  ]
}
```

`entryArea` is the area used when the URL omits `&area=`. It should equal `manifest.defaultArea`; if they disagree the manifest wins.

### 3 · `rooms.json` — the Room tier

Required. The room-graph is flat at the Universe level so the substrate can do `getRoom(id)` without traversing Areas. Full schema and design guidance live in [`ROOM-AUTHORING.md`](./ROOM-AUTHORING.md). The minimum shape:

```json
{
  "$schema": "https://cosmos-2026.dev/schemas/rooms-1.1.json",
  "version": "1.1",
  "entryRoom": "start",
  "rooms": [
    {
      "id": "start",
      "area": "entry",
      "displayName": "Start",
      "displayNameEn": "Start",
      "description": "Where Cosmo arrives. One sentence describing what's in the room.",
      "anchor": { "x": 0, "y": 0, "z": 0 },
      "cameraBounds": { "panRangeX": 1.6, "panRangeY": 0.6 },
      "biomeKey": null,
      "exits": []
    }
  ]
}
```

The new `area` field is what Wave 21 added. Existing Wave-20a `rooms.json` files without `area` keep loading — the substrate treats missing `area` as belonging to `manifest.defaultArea`. New Universes declare `area` explicitly.

### 4 · `README.md` — author's notes

Required. Multilingual welcome, a "why this Universe exists" paragraph, and (recommended) a "how to copy this" snippet. The forest's README is the working pattern; do not duplicate its words, write your own.

## The hybrid contract: JSON-only or +behavior.ts

The substrate ships a **declarative spine** (the four files above) and an **optional TypeScript escape-hatch** (`behavior.ts`). This split is the Wave 21 §2.3 locked decision.

**The floor**: a JSON-only Universe with `manifest.json` + `areas.json` + `rooms.json` + `README.md` + at least one composition-spec.json + its PNG layers ships a working experience. The substrate fills in default behaviors:

- **Background**: composition-spec parallax wrapped by `DefaultBackground`.
- **Arrival**: 1.4s portal, hue derived from `manifest.post.preset`.
- **Inhabitants**: empty (a Room with no inhabitants is valid; the world still breathes).
- **Interactables**: empty (your reviewers will ask about delight-loops at PR time, but the substrate doesn't enforce). When you do author them, the substrate's InteractionDirector walks Cosmo there on a tap — and on his own when the visitor goes quiet — and calls `onUse(cosmo, api)`; `api.playClip('stretch')` + `api.sfx('cling')` is a complete interaction.
- **Transitions**: biome-blend (Room↔Room) / gradient-cut (Area↔Area) / portal (Universe↔Universe).
- **Audio**: silence, unless `manifest.assets[]` declares an audio entry with `preload: true`, in which case it loops at 0.45 volume.

Confidently more than a wallpaper. Defaults are documented in full in [`.claude/brainstorm/wave21/01-substrate-architecture.md`](./.claude/brainstorm/wave21/01-substrate-architecture.md) §7.

**The escape hatch**: ship a `behavior.ts` that exports any subset of `{ background, arrival, inhabitants, interactables, audio, transitions }`. Each export is independently optional. Want a custom background but the default arrival, default inhabitants, and default transitions? Write a 30-line `behavior.ts` exporting only `background`.

> ⚠️ **A driver REPLACES the default — it does not augment it.** If you export `audio`, the substrate runs *your* `AudioHandle` instead of `DefaultAudio`, so the per-room `audioBed` swap stops happening unless your handle calls `ctx.audioBridge.setMusicTrack()` itself. Do **not** ship a no-op driver "to show the registration shape" — omit the key to inherit the default. (Live UAT 2026-06-07: a no-op `audio` stub copied across all universes silently killed every room bed, falling back to the title theme.)

```ts
import type * as THREE from 'three';
import type { GlobalUniforms } from '../../src/core/globalUniforms';
import type { CosmoV2Rig, CosmoState } from '../../src/three/cosmoV2';

export interface SubstrateCtx {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  globalUniforms: GlobalUniforms;
  assetPath: (rel: string) => string;
  universe: { id: string; name: string; displayName: string };
  area: { id: string; displayName: string; mood: ResolvedMood };
  room: { id: string; displayName: string; anchor: { x: number; y: number; z: number } };
}

export interface ResolvedMood {
  ambient: string;
  primary: string;
  post: { bloom: number; kaleido: number; fluid: number; chroma: number };
}

export interface BackgroundHandle { update(dt: number, u: GlobalUniforms): void; dispose(): void; }
export type ArrivalAnimation =
  | { kind: 'portal'; duration: number; hue?: number }
  | { kind: 'fade'; duration: number; color?: string }
  | { kind: 'drift'; from: { x: number; z: number }; duration: number }
  | { kind: 'custom'; run: (dt: number) => boolean };
export interface ArrivalCtx extends SubstrateCtx { cosmo: CosmoV2Rig; state: CosmoState; }
export interface InhabitantHandle { id: string; update(dt: number, u: GlobalUniforms): void; dispose(): void; }
export interface UseApi {
  playClip(name: string, opts?: { loop?: boolean; holdS?: number }): void; // idle/walk/bounce/jump/duck/dance/wave/wink/stretch/fall/petted/look
  sfx(name: string): void;                                                 // public/assets/audio/sfx/<name>.mp3
}
export interface InteractableHandle {
  id: string;
  anchor: { x: number; y: number; z: number }; // absolute stage space (Cosmo's home is the origin)
  range: number;
  arrival?: 'use' | 'bounce';                  // default 'use'
  update(dt: number, u: GlobalUniforms): void;
  onUse(cosmo: CosmoV2Rig, api?: UseApi): void; // tap or curiosity walks Cosmo here, then this fires
  dispose(): void;
}
export interface AudioHandle { enter(): void; exit(fadeMs: number): void; update(dt: number): void; dispose(): void; }
export interface TransitionDriver { run(dt: number): Promise<void>; dispose(): void; }
export interface TransitionCtx extends SubstrateCtx { fromMood: ResolvedMood; toMood: ResolvedMood; }

export interface UniverseBehavior {
  background?: (ctx: SubstrateCtx) => BackgroundHandle;
  arrival?: (ctx: ArrivalCtx) => ArrivalAnimation;
  inhabitants?: (ctx: SubstrateCtx) => InhabitantHandle[];
  interactables?: (ctx: SubstrateCtx) => InteractableHandle[];
  audio?: (ctx: SubstrateCtx) => AudioHandle;
  transitions?: {
    roomToRoom?: (ctx: TransitionCtx, fromRoomId: string, toRoomId: string) => TransitionDriver;
    areaToArea?: (ctx: TransitionCtx, fromAreaId: string, toAreaId: string) => TransitionDriver;
    universeToUniverse?: (ctx: TransitionCtx, fromUniverseId: string, toUniverseId: string) => TransitionDriver;
  };
}
```

The substrate detects which exports exist with `typeof mod[key] === 'function'`. Anything missing falls back to the default driver.

## URL grammar

| URL | Resolves to |
|---|---|
| `/play/?substrate=v2` | Default Universe (`forest`), its `defaultArea`, that Area's `entryRoom`. |
| `/play/?substrate=v2&universe=<u>` | Universe `<u>`, its `defaultArea`, that Area's `entryRoom`. |
| `/play/?substrate=v2&universe=<u>&area=<a>` | Area `<a>`, the `entryRoom` if it belongs to `<a>`, else first listed room of `<a>`. |
| `/play/?substrate=v2&universe=<u>&area=<a>&room=<r>` | Full triple. Validated left-to-right. |

After Wave 21 cutover, `?substrate=v2` is dropped — substrate becomes the default and the flag becomes a no-op for one release.

**Invalid-id fallback**: resolution is left-to-right with logged warnings, never silent errors. An invalid universe falls back to `forest`. An invalid area falls back to the universe's `defaultArea`. An invalid room falls back to the area's `entryRoom`. Each fallback updates `history.replaceState` so the URL shown to the user reflects what actually loaded — share-links self-heal.

**Cosmo state survives URL changes**. Mood, energy, memory, inventory, and traversal-history live in `localStorage["cosmos.state.v1"]` and persist across rooms, areas, universes, and full reloads. The URL specifies *where*; localStorage carries *who Cosmo is when he gets there*.

## Asset preloading

`manifest.assets[]` is the declarative preload list. `preload: true` resolves before arrival completes; `preload: false` is lazy-loaded on first use. For Wave 21 the substrate runs all `preload: true` assets at Universe-load (eager) — see architect doc §7.1 / open question §8.4 for the future Room-scoped lazy variant.

Paths are universe-folder-relative. The substrate sandboxes `assetPath()` so attempts to escape the folder (`../../something`) are normalised away.

## Brand fit + `brandDeviation`

Universes are expected to fit the brand contract by default: Hayao×Moebius watercolor, the locked palette (mushroom-cream / moss-sage / sky-wash / faded-rose / ink-aubergine / saffron-glow / forest-deep), pop-accents ≤5%, no emojis, no placeholders. NORTH-STAR §3 has the full visual contract — re-read it before opening a PR.

If your Universe intentionally deviates, set `manifest.brandDeviation` to a short rationale and document it in your README. Reviewers will engage with the argument carefully (per [`CONTRIBUTING.md`](./CONTRIBUTING.md)). The substrate does not block you on deviation; it asks you to justify it.

Areas can tweak mood within a Universe (via `moodOverrides`), but `brandDeviation` is **universe-level only**. See [`AREA-AUTHORING.md`](./AREA-AUTHORING.md) for the inheritance rules.

## Test your Universe locally

```bash
cd cosmos-cosmic-adventure-2026
npm install
npm run dev
# Then open:
# http://localhost:5174/play/?substrate=v2&universe=<your-name>
```

The substrate hot-reloads `universes/<your-name>/` on file change. Editing `behavior.ts` swaps drivers in place; editing JSON re-enters the affected scope. Cosmo's position is preserved across reloads in dev.

## Submit a PR

The submission flow is in [`CONTRIBUTING.md`](./CONTRIBUTING.md). The short form: branch off `main`, build under `universes/<your-name>/`, run `npm run build` and `bash scripts/sync-check.sh` clean, open a PR titled `universe: <your-name>`. Reviewers engage on contract-correctness, brand-fit, and posture-alignment.

## Reference Universe

[`universes/forest/`](./universes/forest/) is the working example. It ships all four required artifacts plus a `behavior.ts` that demonstrates every optional export. Read its files side-by-side with this document; copy the patterns; do not copy the words. Your Universe is yours.

---

## Appendix — Paste-in-Claude-Code quickstart

Open Claude Code in this repository, paste the block below, and let Claude scaffold a new Universe.

````markdown
You are helping me create a new Cosmo Universe. Read NORTH-STAR.md and UNIVERSE-AUTHORING.md first.

Then create universes/<NAME>/ with:
- manifest.json with name="<NAME>", displayName="...", author="...", license="MIT", behaviorModule=false, defaultArea="entry", brandDeviation=null
- areas.json with one area "entry" containing rooms ["start"]
- rooms.json with one room "start" with anchor {0,0,0}, area "entry"
- assets/backgrounds/start/composition-spec.json — minimal 3-layer parallax
- README.md describing what the universe wants to be

After scaffolding, remind me to: (1) generate parallax assets via fal.ai or my own pipeline, (2) test with `npm run dev` + ?substrate=v2&universe=<NAME>, (3) read AREA-AUTHORING.md before adding more Areas, ROOM-AUTHORING.md before designing Rooms.
````
