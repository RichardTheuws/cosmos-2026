# Ink-Ocean — a sea drawn in one pen-line

> *Where Zorp learns he is weightless.*

A Moebius-ink underwater Universe (Wave 24). It exists to **prove the substrate is not forest-hardcoded**: every Room sets `biomeKey: null` and ships a custom `background(ctx)` that paints ink-water onto the **shared** `ctx.parallax.scene` (never a second `ParallaxScene` — the v2.2.4 one-renderer invariant). It also exercises the ceremonial Universe↔Universe portal and `localStorage` state (a stateful descent — you remember how deep you went).

## Files
`manifest.json` · `areas.json` · `rooms.json` · `behavior.ts` (custom background + arrival + room-filtered inhabitants/interactables + room-keyed audio) · this README.

## Area: The Drowned Cathedral (single Area, cool mood)

## Rooms
- **The Light-Shafts** (`light-shafts`, entry, y:0) — suspended, not standing; three saffron cathedral shafts comb through motes; a single pop-cyan jellyfish drifts. *Interactables:* Kelp-Organ (`walk`→`stretch`→`wink`), Float-Tap (`petted` + procedural upward bob).
- **The Trench** (`the-trench`, y:-4) — you sink; near-black abyss; a slow updraft-current rises; a deep-glow lure pulses (seen, not used). *Interactables:* Updraft-Current (`walk`→`jump`+procedural buoyant-arc→`fall`); Deep-Glow Lure (inhabitant — `look`, rarely `duck`).

## Weightlessness
Zorp's underwater idle is a **procedural hover-drift over the shipped `idle` clip** (small vertical drift-bob + faint rotational sway) — NOT a new clip. A dedicated `drift-swim` painted clip is a documented fast-follow (locomotion uses `walk` as the fallback until it lands).

## Brand
Locked palette skewed cool: **sky-wash / ink-aubergine / saffron-glow**, with exactly **one pop-cyan accent** (jellyfish + lure), peak/on-screen only. No magenta, no lime. Calm baseline, event-peaks. All in-game text English. `brandDeviation: null`.

## Known / hand-offs
- **Audio beds are stubs:** `ink-ocean-shafts.mp3` + `ink-ocean-trench.mp3` are currently 19.8s — regen to ~90s seamless before this Universe ships (prompts in `.claude/brainstorm/wave24/assets-ink-ocean.md`).
- Visual assets (ink-water backgrounds, kelp-organ, updraft, jellyfish, lure, shafts, motes) to generate per the same runbook.
- Event SFX named in `behavior.ts` await the substrate SFX-emit hook.

See [`UNIVERSE-AUTHORING.md`](../../UNIVERSE-AUTHORING.md) and the design canvas `.claude/brainstorm/wave24/00-FIRST-SETUP.md` §U2.
