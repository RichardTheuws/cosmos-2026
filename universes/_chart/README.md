# The Spore-Chart — the open map (reserved pseudo-universe)

> *A hand-inked atlas where every world someone built is a luminous spore-bloom — and the empty dark beside them says "your world here."*

The hub of the dweller experience (Wave 24). The **leading underscore is intentional**: `discoverUniverses()` skips `_`-prefixed folders, so the chart is never enumerated as a destination on itself — it *is* the place the destinations are reached from. It is also a Room you can dwell in (it passes the Dweller Lens), not a menu / level-select / progress-grid (those would reintroduce the retired score/lean-in shape).

## Files
`manifest.json` · `areas.json` · `rooms.json` · `behavior.ts` · this README.

## How it works
- `behavior.ts::background(ctx)` paints an ink-aubergine cosmic void + drifting faded-rose/sky-wash nebula wash on the **shared** scene.
- `behavior.ts::inhabitants(ctx)` renders **one drifting spore-bloom per discovered Universe** — via the same `import.meta.glob('/universes/*/manifest.json')` the loader uses (skipping `_`-prefixed). Each bloom is painted in that Universe's signature palette and labelled (Cormorant Italic) from its `displayNameEn` + first `summaryEn` sentence. **Author a conformant Universe folder → you appear on the chart automatically.** The breadth is always current; it can never lie about what exists.
- Tapping a lit bloom writes the existing `?substrate=v2&universe=<u>&area=<defaultArea>&room=<entryRoom>` triple — no router is invented; a share-link to a bloom IS a deep-link to that Universe's entry.
- Zorp drifts on the chart and autonomously `look`s/`wave`s at the blooms (shipped clips only; a no-op if no rig is parked).

## The build invitation
Around the lit blooms sit exactly **3 "becoming-blooms"** — faint dotted ink-circles labelled *"your world here"*, each with a ghost spore-trail already drawn toward it. Tapping one opens an on-brand, non-gatekeepy invitation card; **[ Copy the prompt ]** copies the README quickstart block **verbatim** (single source — the invite can never drift from the real on-ramp). This puts the participation surface in the same frame as the breadth: *visiting seeds building.*

## Brand
Ink-aubergine void + faded-rose/sky-wash nebula; each bloom carries its Universe's palette; **one pop-cyan mote** on the Ink-Ocean bloom only. Calm, slow, breathing. All copy English, Cormorant Italic for the poetic lines / Inter for the practical. `brandDeviation: null`.

## Shared-substrate dependencies (orchestrator-only — NOT authored here)
This Universe needs two substrate-level pieces that no per-Universe behavior may own (specified in `.claude/brainstorm/wave24/assets-chart.md`):
1. **"Look up" way-mote overlay** — a free, substrate-provided top-of-frame mote in *every* room of *every* Universe (so no world can trap a player), → plays `look` → returns to the chart. Requires a **resolver exemption** so the reserved `_chart` triple is a valid loadable place even though it's excluded from discovery.
2. **Portal both directions** — forward: a lit bloom irises out into the Universe's `arrival` hue; return: the room recedes up into its bloom (the ceremony in reverse).

See `.claude/brainstorm/wave24/00-FIRST-SETUP.md` §6 (The Open Map).
