# Room Authoring

A **Room** is the focused scene Cosmo inhabits right now. One screen, fully alive.

Read [`NORTH-STAR.md`](./NORTH-STAR.md) first, then [`UNIVERSE-AUTHORING.md`](./UNIVERSE-AUTHORING.md) and [`AREA-AUTHORING.md`](./AREA-AUTHORING.md) — Rooms live inside Areas, which live inside Universes. This document is the technical contract for the Room tier.

## What a Room is

NORTH-STAR §3 defines it directly: *"the focused scene Cosmo inhabits right now. One screen, fully alive. Sims-like density: a single room is packed with little side-quests, side-activities, things to discover. Cosmo can be at full presence here, walking, jumping on a trampoline, exploring small interactables."*

A Room is where Cosmo lives — not a level, not a stage, not a screen between menus. It's a place. Cosmo walks around it, looks at things, picks things up, sits in glowing flowers, jumps on trampolines, watches eyeball-sentries blink at him. The user watches *him* live there. The Room is the unit of presence.

Mechanically: a Room is an entry in `rooms.json` plus optional driver overrides in `behavior.ts`. The substrate handles loading, transitions, and lifecycle; you describe what's in the Room and (optionally) how it behaves richer than the defaults.

## The Sims-density principle

Every Room should have multiple things to do, look at, or notice. Empty Rooms are technically valid in the contract — `inhabitants` and `interactables` both default to empty arrays (architect doc §7.3, §7.4) — but the **brand quality bar is "more than a wallpaper"**.

What density looks like in practice:

- **Inhabitants** that breathe and react: an eyeball-sentry that blinks on event-peaks, a mouth-pillar that breathes in time with whatever music plays, a breathing-portal at the far edge of the Room that pulses softly.
- **Background life** that's not directly interactive but creates a sense of liveness: spore-motes drifting at hip height, nectar dripping from the mushroom canopy, a floating star arcing slowly across the sky.
- **Interactables** Cosmo can walk to and use: the trampoline, a fruit Cosmo can pick, a glowing flower he can sit in, a button that makes the world hum.
- **Composition density**: 5–7 parallax layers in the composition-spec, not 2. Foreground decorations Cosmo can move past. A horizon that doesn't feel flat.

The forest's three Rooms (`clearing`, `deep-grove`, `the-hollow`) each have at least three of these. That's the bar. A Room with one tree and a Cosmo standing next to it is a wallpaper, not a Room.

Reviewers will not hard-block a sparse Room at PR time, but they will engage. If you ship a sparse Room deliberately — as a moment of stillness, a beat between busier Rooms — say so in your README. Stillness is valid; absence is not.

## The trampoline-analog principle

NORTH-STAR §3 says it directly: *"The trampoline. A regular trampoline, in the room. Cosmo can walk to it and jump on it. He loves it. The user loves watching him love it. They keep coming back. This is the canonical 'delight loop' — every Room should have at least one of these (not always literally a trampoline, but its analog: a small, juicy, repeatable joy)."*

A delight-loop is something Cosmo can return to repeatedly that feels good every time. It is small, mechanical, and self-contained. Examples of trampoline-analogs you might author:

- A fruit Cosmo can pick from a tree (it grows back after a beat).
- A glowing flower he can sit in (it blooms brighter while he's there).
- A button that makes the world hum (the hum's pitch shifts each press).
- A puddle of nectar he can drink (he wags-equivalent — antenna-bob).
- A pebble he can pat (the pebble sighs).

The principle: it loops, it rewards watching, it doesn't require player skill. Cosmo loves it. The user loves watching him love it. That is the canonical Cosmo-game gesture.

Author at least one per Room. If you skip it, say why in your README.

## `rooms.json` — full Room entry schema

Rooms live flat at the Universe level (`rooms.json`) so the substrate can do `getRoom(id)` without traversing Areas. Each entry:

```json
{
  "id": "clearing",
  "area": "the-mushroom-stand",
  "displayName": "The Clearing",
  "displayNameEn": "The Clearing",
  "description": "A soft mushroom-cream open space where Cosmo arrives. The trampoline lives here.",
  "anchor": { "x": 0, "y": 0, "z": 0 },
  "cameraBounds": { "panRangeX": 1.6, "panRangeY": 0.6 },
  "biomeKey": "slow-bloom",
  "exits": [
    { "to": "deep-grove", "via": "left-mushroom-path", "distance": 12 },
    { "to": "the-hollow", "via": "down-burrow", "distance": 8 }
  ]
}
```

- **`id`** — slug. Stable; URLs and `exits[].to` reference it. Renaming breaks links.
- **`area`** — area id this room belongs to. Must reference an entry in `areas.json`. Required from schema v1.1; missing values default to `manifest.defaultArea` for backwards-compat with Wave-20a Universes.
- **`displayName`** / **`displayNameEn`** — same convention as Areas. Any language for the first; English ≤100 chars for the second.
- **`description`** — one-sentence room summary. Reviewers and forks read this.
- **`anchor`** — world-space `{ x, y, z }` where Cosmo is placed when he enters this Room. Set deliberately; the camera centres on it.
- **`cameraBounds`** — passed to `CosmoStage.setCameraBounds()` on enter. Optional; falls back to default pan ranges. See "Camera bounds" below.
- **`biomeKey`** — optional reference to a key in the existing `BIOMES` registry. If present, the default background driver routes through `BiomeManager` for a known curve (matches forest rendering quality bar). Omit (or set `null`) for fully custom rooms whose background is defined entirely by `assets/backgrounds/<room-id>/composition-spec.json`.
- **`exits[]`** — the room-graph edges. Each exit has `to` (target room id), `via` (the path's flavour string used by `behavior.transitions.roomToRoom` if you override), and `distance` (informational, used by the AI for traversal-cost heuristics).

## Inhabitants vs Interactables

The two are different by intent:

**Inhabitants** are autonomous lives sharing Cosmo's space that he doesn't directly use. Eyeball-sentries that blink at him. Mouth-pillars that breathe. Breathing-portals that pulse. Floating-stars that drift. They make the Room feel populated. Cosmo notices them; he doesn't activate them.

```ts
export interface InhabitantHandle {
  id: string;
  update(dt: number, u: GlobalUniforms): void;
  dispose(): void;
}
```

Authored via `behavior.inhabitants(ctx)` returning an `InhabitantHandle[]`. Default: empty array.

**Interactables** are things Cosmo walks to and uses. The trampoline. A fruit. A door. A button. They have an `anchor` (where Cosmo walks to, in absolute stage space — Cosmo's home is the origin), a `range` (how close his AI considers him "at" them), and an `onUse(cosmo, api)` hook the substrate's InteractionDirector fires when he reaches the anchor. He gets there two ways: the visitor taps the interactable, or — after ~14 s without input — Cosmo picks one himself and wanders over. He stays for the clip's hold, then walks home.

```ts
export interface UseApi {
  /** A shipped painted clip: idle · walk · bounce · jump · duck · dance · wave · wink · stretch · fall · petted · look */
  playClip(name: string, opts?: { loop?: boolean; holdS?: number }): void;
  /** One-shot from public/assets/audio/sfx/<name>.mp3 */
  sfx(name: string): void;
}
export interface InteractableHandle {
  id: string;
  anchor: { x: number; y: number; z: number };
  range: number;
  /** 'bounce' runs the trampoline combo on arrival; default 'use'. */
  arrival?: 'use' | 'bounce';
  update(dt: number, u: GlobalUniforms): void;
  onUse(cosmo: CosmoV2Rig, api?: UseApi): void;
  dispose(): void;
}
```

Authored via `behavior.interactables(ctx)` returning an `InteractableHandle[]`. Default: empty array. A complete interaction is two lines: `api.playClip('stretch', { holdS: 4 }); api.sfx('cling');`. The Clearing (`universes/forest/behavior.ts`) is the reference: trampoline, spore-puddle, sunbeam-patch, nap-cap — from wild to slow.

The distinction matters because the companion-AI treats them differently. Inhabitants are *seen*; Interactables are *targeted*. A trampoline is an Interactable. The eyeball-sentry watching Cosmo bounce is an Inhabitant.

## Camera bounds

`cameraBounds` controls how far the camera can pan around the Room's anchor:

```json
"cameraBounds": { "panRangeX": 1.6, "panRangeY": 0.6 }
```

Tighten for **small intimate Rooms** — a hollow under the ground, a spore-cellar, anywhere claustrophobic feels right. Smaller pan ranges focus the user's attention on Cosmo.

Widen for **vista Rooms** — a clearing with a wide horizon, a canopy room with sky in three directions. Larger pan ranges let the user explore the space with their gaze (or gyro on mobile).

If you omit `cameraBounds`, the substrate uses default pan ranges that work for forest-clearing-sized Rooms. Override deliberately when the Room's scale calls for it.

## Linking Rooms with `exits[]`

The room-graph is a directed graph. Each Room's `exits[]` lists the edges going *out* of it. The substrate doesn't auto-create back-edges; if you want bi-directional traversal (almost always — Cosmo should be able to walk back), declare both directions:

```json
{
  "id": "clearing",
  "exits": [{ "to": "deep-grove", "via": "left-path", "distance": 12 }]
},
{
  "id": "deep-grove",
  "exits": [{ "to": "clearing", "via": "right-path", "distance": 12 }]
}
```

Symmetric back-edges are convention; they are not enforced by the schema. Asymmetric exits (a one-way burrow Cosmo can fall down but not climb up) are valid — design intent, not a bug.

Cross-Area exits are valid (a Room in Area A exits to a Room in Area B). The substrate detects the Area transition and runs the gradient-cut instead of biome-blend automatically — you don't declare which transition fires; the spatial scope determines it.

## Designing Room-to-Room transitions

Default: biome-blend (architect doc §4.1) — 1.5–3.0s, mood lerps continuously between the two Rooms' resolved moods. The `pathExperience` you declared in `areas.json` colours the default biome-blend's flavour (its `ambient` tints the path, its `kind` selects the default driver variant).

If your Room-to-Room walk needs more character than biome-blend provides — a literal mushroom-path with spore-motes drifting at hip height, a burrow-down where the camera tilts as Cosmo descends — override `behavior.transitions.roomToRoom`:

```ts
transitions: {
  roomToRoom: (ctx, fromRoomId, toRoomId) => myCustomMushroomPath(ctx, fromRoomId, toRoomId),
}
```

Your driver returns a `TransitionDriver` with `run(): Promise<void>` and `dispose(): void`. The substrate awaits `run()` then disposes. Cosmo's position is set at transition midpoint (t=0.5) so he "lands" with the new mood — see architect doc §3.3.

Authoring tip: most Rooms don't need a custom transition. Default biome-blend is the calm baseline; override only when the path between two specific Rooms wants to be its own moment. Overriding everything makes the world shake; overriding nothing flattens it. The forest overrides one path (mushroom-path) and uses defaults for the rest. Match that ratio.

## Cross-references

- Up: [`AREA-AUTHORING.md`](./AREA-AUTHORING.md) — the Area contract that contains your Rooms.
- Up further: [`UNIVERSE-AUTHORING.md`](./UNIVERSE-AUTHORING.md) — the Universe contract.
- Architect doc: [`.claude/brainstorm/wave21/01-substrate-architecture.md`](./.claude/brainstorm/wave21/01-substrate-architecture.md) — full schemas, transition implementations, lifecycle, default behaviors.

---

## Appendix — Paste-in-Claude-Code quickstart: append a new Room

Open Claude Code in this repository, paste the block below to add a new Room to an existing Area.

````markdown
You are helping me add a new Room to an existing Cosmo Universe Area. Read NORTH-STAR.md, UNIVERSE-AUTHORING.md, AREA-AUTHORING.md, and ROOM-AUTHORING.md first.

Then for universes/<UNIVERSE>/:
1. Read existing rooms.json and areas.json.
2. Append a new Room entry to rooms.json with:
   - id: "<ROOM-ID>" (stable slug — URLs reference it)
   - area: "<AREA-ID>" (must reference an entry in areas.json)
   - displayName + displayNameEn
   - description: one sentence on what's in the Room
   - anchor: { x, y, z } where Cosmo lands when he enters
   - cameraBounds: tighten for intimate Rooms, widen for vista Rooms (default ~1.6/0.6)
   - biomeKey: existing BIOMES key OR null for fully-custom background
   - exits[]: at least one edge connecting to an existing Room (with symmetric back-edge added to that Room)
3. Append "<ROOM-ID>" to the rooms[] array of the matching Area in areas.json.
4. If biomeKey is null, scaffold assets/backgrounds/<ROOM-ID>/composition-spec.json with 3-5 parallax layers.
5. Consider whether this Room needs custom inhabitants/interactables. If so, prompt me to update behavior.ts; otherwise the substrate's defaults apply.

After scaffolding, remind me to: (1) author at least one trampoline-analog (a small juicy repeatable joy) per the NORTH-STAR §3 delight-loop principle, (2) aim for Sims-density (multiple things to notice), (3) test with `npm run dev` + ?substrate=v2&universe=<UNIVERSE>&area=<AREA-ID>&room=<ROOM-ID>.
````
