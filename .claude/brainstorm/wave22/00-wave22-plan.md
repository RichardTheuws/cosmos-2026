# Wave 22 — Make the spine real, reachable, and proven

**Status**: synthesis locked (2026-05-30) — direction + second-universe pick decided; ready to implement.
**Decided direction** (2026-05-30, NORTH-STAR §6): hard cutover (delete legacy after parity), second Universe in the same wave = **Ink-Ocean**, test+UAT gate in parallel.
**Source**: 7-team vision-fit audit (overall 5.5/10) + the four Wave 22 brainstorm docs in this folder.

---

## The one truth driving this wave

The entire Room→Area→Universe vision (§3) and the open-substrate pitch (§3b) are **fully coded but dead in production** — `/play/` never sets `?substrate=v2` (`src/main.ts:51-53`). The architecture is good; it is unreachable. Wave 22 turns it on, proves it with a second Universe, and protects the cutover with the first real test gate this project has had.

## The structural linchpin (do this first)

**D4 — one parallax tick per frame.** Both the cutover and the second Universe depend on the substrate owning its own background. The fix (doc 01): move the *sole* `parallax.update` call out of `main.ts:~348` into the background driver, un-no-op `ForestBackground` to configure the shared instance via a new `SubstrateCtx.parallax` field. This makes the v2.2.4 double-tick bug *structurally impossible* and lets a non-forest Universe (the second one) paint its own world. Everything else sits on top of this.

## Dependency spine

```
D4 substrate-owns-background (parallax single-tick)   ← linchpin
  ├─ D3 SubstrateInteractionManager (walk+bounce in substrate mode)
  │     └─ one canonical trampoline (delete +=0.05 stub)
  ├─ D2 traversal wiring (clearing↔deep-grove via MushroomPathTransition)
  ├─ 2nd Universe (Ink-Ocean, proposed) — needs import.meta.glob universe discovery
  │     └─ cross-Universe portal travel (PortalTransition + StatePersistence)
  └─ D6 dead head-track/focusPoint cleanup
D5 test+UAT gate  ← parallel strand, MUST exist before cutover ships
LEGACY DELETION   ← last, only after visual-UAT confirms parity
```

## Commit sequence (revertable, parity-before-deletion)

1. **D5 scaffold** (parallel): Vitest on the 4 pure-logic resolvers + Playwright screenshot harness + `window.__substrateReady` hook. Gate must exist before cutover lands.
2. **D4**: parallax single-tick → background driver; un-no-op `ForestBackground`; `SubstrateCtx.parallax`.
3. **D3**: `SubstrateInteractionManager` drives the existing `CosmoAgent.walkTo→startBounce→onBounce` chain (full juice: sin-arc, squash-stretch, sfx, kaleido spike, vibe +0.18, DeepTrip). Delete the `+=0.05` stub. Redefine `InteractableHandle.onUse` so any Room gets the locked delight feel for free.
4. **D2**: traversal — tap a watercolor path-affordance → `walkTo(edge, 'traverse')` → un-stubbed `MushroomPathTransition` (mood crossfade + spore-mote drift, the path is *content*) → `enterAreaRoom`, repositioning Cosmo at the reciprocal edge, `syncURL`.
5. **2nd Universe**: `discoverUniverses()` → `import.meta.glob` (currently hard-coded `['forest']`); author the new Universe manifest + rooms; portal travel exercising `StatePersistence` (localStorage/token, async + content-portable per §3b).
6. **D6**: strip dead head-track/focusPoint scaffolding (or honestly implement as UV-offset cue).
7. **Flip the flag unconditional** → substrate is the only boot path.
8. **Legacy deletion** — separate commit, **only after a passing human visual-UAT** (no `?legacy` hatch = revert is the only rollback).

## What needs live human eyes (code cannot self-verify)

- Cosmo billboard character-DNA fidelity on the live build (sticker vs being).
- Trampoline delight-loop *feel* (juice, repeatability) in substrate mode.
- The walk-out → mote-drift → re-tint → walk-in path sequence (path-as-content).
- Cross-Universe portal round-trip + inhabitant coherence (the recurring 21.2.x failure mode).
- Calm-baseline post-FX at rest (no constant-trippy regression) + parallax render after the tick-move.

## What survives untouched (do NOT reopen)

Brand contract (watercolor + character-DNA); the billboard-Cosmo pivot; the 4 transform anims; the chrome-stripped `/play/` shell; the substrate architecture itself.

## Second Universe — DECIDED: Ink-Ocean (2026-05-30)

Richard chose **Ink-Ocean** from three scored candidates (over canopy/sky-Room and dream-Area, both weaker because they are same-Universe Areas, not cross-Universe proofs). A Moebius-ink underwater Universe inside the locked Hayao×Moebius palette (ink-aubergine / sky-wash / saffron-glow + one pop-cyan accent). It is the strongest pluggability proof: it forces D4 (a non-forest background the substrate must own) and a real cross-Universe portal round-trip (`PortalTransition` + `StatePersistence`) — the literal "your Cosmo visits my world" (§3b). Design sketch in `02-traversal-and-second-universe.md`.
