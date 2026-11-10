# Area Authoring

An **Area** is a cluster of Rooms with a coherent mood, connected by a path-experience that is itself content.

Read [`NORTH-STAR.md`](./NORTH-STAR.md) first, then [`UNIVERSE-AUTHORING.md`](./UNIVERSE-AUTHORING.md) — Areas live inside Universes and inherit their post-FX preset and palette unless they override. The Rooms inside Areas are documented in [`ROOM-AUTHORING.md`](./ROOM-AUTHORING.md).

## What an Area is

NORTH-STAR §3 defines it: *"a cluster of Rooms connected by a psychedelic path. The path itself is its own experience (not a loading screen). Walking the path is a thing you do, with its own feel, lighting, sounds. An Area has a coherent mood; its Rooms vary that mood."*

In authoring terms: an Area is the **mood-bucket** between Universe (the whole world) and Room (the focused scene). It says "these Rooms feel like the same place, and the path between them is part of the experience". The substrate uses Areas to scope mood-overrides and path-experiences, and to drive the gradient-cut transition that fires when Zorp crosses an Area boundary inside the same Universe.

The forest Universe is a single Area called `the-mushroom-stand` containing three Rooms (`clearing`, `deep-grove`, `the-hollow`). Single-Area Universes are valid and common. Multi-Area Universes earn their second Area when the second mood truly needs its own palette tweak, its own path-experience, and its own boundary moment.

## When to split your Universe into multiple Areas

The single rule: **a second mood that needs its own palette tweak + path-experience earns a second Area**. Anything less stays one Area.

**Legitimate splits**:

- *Forest* + *Canopy above the Forest*. Two Areas because the path UP feels different (climbing through bioluminescent moss, ambient shifts from moss-sage to sky-wash). The Rooms in each share a Universe but the boundary between them is a moment.
- *Mushroom-stand* + *Ink-ocean shore*. Two Areas in a hypothetical "twin-biome" Universe — the gradient-cut between mushroom-cream and ink-aubergine *is the point*.
- *Daytime village* + *Nighttime village*. Same Rooms structurally, two Areas because the mood diverges and the path is a dusk-walk.

**When NOT to split**:

- A slightly different Room within the same palette. Different Rooms in the same Area can vary mood — that's what `Room.biomeKey` and per-Room overrides are for. Different palette = different Area; *same* palette, different decoration = same Area.
- A Room that's "deeper" in some sense (a hollow, a grove). The forest's three Rooms are mood-coherent; they don't need their own Areas. Density inside one Area beats artificial subdivision.
- A future-Wave Room that "might one day get its own mood". Author the Area it actually has *now*. Areas are cheap to add later when the mood arrives.

If you're not sure: **start with one Area**. Split when the second mood actually shows up.

## `areas.json` — full schema

```json
{
  "$schema": "https://cosmos-2026.dev/schemas/areas-1.0.json",
  "version": "1.0",
  "entryArea": "the-mushroom-stand",
  "areas": [
    {
      "id": "the-mushroom-stand",
      "displayName": "De paddenstoelenstand",
      "displayNameEn": "The Mushroom Stand",
      "description": "The slow-bloom heart of the forest. Mushroom-cream sky, moss-sage ground, three rooms threaded by drifting nectar-spore trails.",
      "moodOverrides": null,
      "pathExperience": {
        "kind": "mushroom-path",
        "duration": 2.4,
        "ambient": "#F5EDD8",
        "description": "Walking under a canopy that breathes; spore-motes drift at hip height; the next room fades in through the leaves."
      },
      "rooms": ["clearing", "deep-grove", "the-hollow"]
    }
  ]
}
```

- **`entryArea`** — the area used when the URL omits `&area=`. Should equal `manifest.defaultArea`; if the two disagree the manifest wins.
- **`areas[]`** — ordered. Order matters only for the "first-listed" fallback when the URL specifies a missing area.
- **`id`** — slug. Stable; URLs reference it. Renaming an `id` breaks share-links.
- **`displayName`** — any language. Dutch is fine; the forest uses *De paddenstoelenstand*.
- **`displayNameEn`** — ≤100 chars English so non-native readers can navigate.
- **`description`** — 1–3 sentences. Mood + what makes this Area distinct from its siblings. Reviewers read this; future Universe authors read this when they fork.
- **`moodOverrides`** — `null` means inherit the Universe's `manifest.post`. Otherwise a partial override:

  ```json
  "moodOverrides": {
    "ambient": "#1B0F2A",
    "primary": "#3D2E4A",
    "post": { "bloom": 0.6, "kaleido": 0.3 }
  }
  ```

  Keys are partial — anything absent inherits. You override only what's actually different.

- **`pathExperience`** — describes the Room-to-Room walk *inside this Area*. This is **not** a loading screen — quote NORTH-STAR §3: *"the path itself is its own experience"*. Walking the path is a thing Zorp does. Fields:
  - `kind` — `"mushroom-path" | "burrow-down" | "drift" | "fade"`. The substrate maps this to a default driver. Unknown kinds fall back to the default biome-blend transition.
  - `duration` — seconds.
  - `ambient` — a hex color used as the path's clear-color tint while traversing.
  - `description` — one sentence for reviewers and your future self.
- **`rooms[]`** — string ids referencing entries in `rooms.json`. Order does not matter for traversal (the room-graph in `rooms.json` `exits[]` describes which rooms connect to which); it's a set-membership declaration so the substrate knows which rooms belong to this Area.

The `kind` field is one place where the architect doc leaves the door open: any string is accepted and unknown kinds fall back to default biome-blend. That's by design — see [`.claude/brainstorm/wave21/01-substrate-architecture.md`](./.claude/brainstorm/wave21/01-substrate-architecture.md) §1.2 for the canonical list.

## The Area-to-Area transition: gradient-cut

When Zorp crosses an Area boundary inside a Universe, the substrate runs a **gradient-cut** transition by default. From [`.claude/brainstorm/wave21/01-substrate-architecture.md`](./.claude/brainstorm/wave21/01-substrate-architecture.md) §4.2:

- Duration: 0.6–1.2s (default 0.9s).
- Visual: a single-pass shader sweeps from the source Area's `primary` color to the target Area's `primary`, diagonally so the cut feels directional rather than a dip-to-black.
- Zorp continues rendering on top — the gradient-cut sits between the parallax background and Zorp's rig.

The substrate picks the colors automatically: source Area's `moodOverrides.primary` (or the Universe's primary if `moodOverrides` is null), to target Area's primary. You don't manage the lerp.

To override, export `behavior.transitions.areaToArea` from your Universe's `behavior.ts`:

```ts
transitions: {
  areaToArea: (ctx, fromAreaId, toAreaId) => myCustomAreaTransition(ctx, fromAreaId, toAreaId),
}
```

Your function returns a `TransitionDriver` with `run(): Promise<void>` and `dispose(): void`. The substrate awaits `run()` then calls `dispose()`. Most Universes never need to override; the default gradient-cut composes well with the locked palette.

## The path-experience between Rooms within an Area

Inside an Area, Room-to-Room movement uses the **biome-blend** transition (architect doc §4.1). Default duration 1.5–3.0s; mood lerps continuously between the two rooms' resolved moods (Universe → Area override → Room override). The `pathExperience` field in `areas.json` describes the *flavor* of this walk — its `kind`, `duration`, `ambient`. The substrate uses these to colour the default biome-blend.

If your Area wants something more characterful (the forest's `mushroom-path` with spore-motes drifting at hip height), override `behavior.transitions.roomToRoom`. Your driver gets `(ctx, fromRoomId, toRoomId)` and returns a `TransitionDriver` whose `run()` resolves when complete.

Tier inheritance: if you override `roomToRoom` but not `areaToArea`, the substrate still uses default gradient-cut for Area transitions. Each tier resolves independently.

## Brand fit at the Area level

Areas can tweak mood within the Universe via `moodOverrides`, but those are **tweaks, not pivots**. The Universe-level `brandDeviation` field is the only place to declare an intentional brand-deviation. Areas inherit; they do not declare their own brand-stance.

In practice: an Area can shift the ambient from mushroom-cream to ink-aubergine if its mood calls for it (the locked palette has both). It cannot declare "this Area is anime-styled" — that would be a Universe-level pivot, with a `brandDeviation` rationale, and probably a NORTH-STAR §6 entry first per [`CONTRIBUTING.md`](./CONTRIBUTING.md).

The locked palette is in NORTH-STAR §3. Stay inside it for mood-overrides; cross outside it only with deliberate authorial intent and reviewer engagement.

## Cross-references

- Up: [`UNIVERSE-AUTHORING.md`](./UNIVERSE-AUTHORING.md) — the Universe contract that contains your Areas.
- Down: [`ROOM-AUTHORING.md`](./ROOM-AUTHORING.md) — the Room contract for what lives inside each Area.
- Architect doc: [`.claude/brainstorm/wave21/01-substrate-architecture.md`](./.claude/brainstorm/wave21/01-substrate-architecture.md) — full schemas, transition implementations, default behaviors.

---

## Appendix — Paste-in-Claude-Code quickstart: append a new Area

Open Claude Code in this repository, paste the block below to add a new Area to an existing Universe.

````markdown
You are helping me add a new Area to an existing Zorp Universe. Read NORTH-STAR.md, UNIVERSE-AUTHORING.md, and AREA-AUTHORING.md first.

Then for universes/<UNIVERSE>/:
1. Read existing areas.json and rooms.json.
2. Append a new Area entry to areas.json:
   - id: "<AREA-ID>"
   - displayName + displayNameEn (≤100 chars)
   - description: 1-3 sentences on mood + what makes it distinct
   - moodOverrides: null (inherit Universe defaults) OR a partial override if the second mood actually differs
   - pathExperience: { kind: "fade" or "mushroom-path" or "drift", duration: 1.5-3s, ambient: hex, description }
   - rooms: ["<ROOM-1>", "<ROOM-2>"]  (must reference rooms.json entries)
3. Append the new Room entries to rooms.json with area: "<AREA-ID>".
4. Verify rooms.json `exits[]` connects at least one Room in the new Area to a Room in an existing Area (otherwise the new Area is unreachable).

After scaffolding, remind me to: (1) read ROOM-AUTHORING.md to populate each Room with the Sims-density bar, (2) test with `npm run dev` + ?substrate=v2&universe=<UNIVERSE>&area=<AREA-ID>, (3) consider whether the new Area really needs its own mood — single-Area Universes are valid.
````
