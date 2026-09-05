# Wave 27 — Chapter 1: The Clearing comes alive

**Status**: APPROVED (Richard, 2026-09-05: "Game Master; begin met volle overgave")
**Version target**: 2.6.0
**Gate**: phone UAT with AirPods — five minutes in the clearing without boredom,
and afterwards you can name what the builder meant for you to feel.

## Why

The substrate is live (v2.5.x) and technically clean. But the dweller promise
(NORTH-STAR §1, 2026-05-31) — *you visit rooms and feel what the builder made
for you* — is not delivered anywhere. Diagnosis from the 2026-09-05 audit:

- The interactable contract exists (`InteractableHandle.onUse`) and the forest
  authors four of them (trampoline, sunbeam-patch, echo-cap, portal-greeting),
  but **nothing on the substrate path ever calls `onUse`**. The legacy
  `InteractionManager` only raycasts the legacy `TrampolineSpots`. The
  interactables are wallpaper with an `update()`.
- Even if called, every `onUse` is a stub: `root.position.y += 0.05`, a rollZ
  nudge. No named clip, no sound. The Wave-23 twelve painted clips are only
  reachable from legacy gestures (wave / dance / fall / petted).
- Deep-grove interactables add `room.anchor` (x = −12) to their positions
  while inhabitants use absolute positions, so echo-cap and the portal-greeting
  render at x ≈ −13, off-screen. The deep grove looks empty.
- Cosmo's autonomous life ("show, don't tell") knows only the trampoline.

## What ships (scope, in order)

1. **Interaction substrate (S3 + S5 from the shared-substrate backlog).**
   - `src/substrate/InteractionDirector.ts`: tap → nearest interactable on
     screen (pure `pickOnScreen`, unit-tested) → `cosmoAgent.walkTo(anchor,
     'use')` → on arrival `handle.onUse(rig, api)`.
   - `UseApi` on the contract: `playClip(name, {loop?, holdS?})` and
     `sfx(name)`. Backwards compatible (second optional arg).
   - `InteractableHandle.arrival?: 'use' | 'bounce'` — the trampoline keeps
     the existing bounce-combo path.
   - CosmoAgent gains a `using` state: he stays at the interactable for the
     clip's hold, then walks home (no snap to origin).
   - Curiosity: after ~14 s without input Cosmo picks an interactable in the
     room himself and goes to use it. Replaces the trampoline-only demo on
     the substrate path. Cosmo lives whether or not you watch (§1).
   - Legacy `InteractionManager` yields the tap when the director handled it.
2. **Forest interactables become real.** Each `onUse` drives a named clip +
   a sound: trampoline → walk + bounce combo + `jump`; sunbeam → `stretch`
   then `look` + coo; echo-cap → `duck` → cascade + `cling`; portal-greeting →
   `wave` + coo. Deep-grove anchors become absolute (bug fix).
3. **Two new clearing interactables** so the first room holds four:
   - **Spore-puddle** (ground pool of drifting spores): Cosmo steps in and
     `dance`s; spores lift with him.
   - **Nap-cap** (a soft, oversized mushroom cap): Cosmo `duck`s under it and
     rests in `petted` (curled, cozy) for a few breaths, then wakes with `wink`.
   Assets generated in the locked Hayao×Moebius watercolor language.
4. **Tests**: `pickOnScreen` + director state logic (vitest, node env).
5. Version 2.6.0, CHANGELOG, deploy, live check.

## Edge cases

- Tap while Cosmo is busy (bounce, pet, fall, dance): ignored, no queue.
- Tap that lands on nothing: no-op (legacy trampoline pick still runs as a
  fallback so nothing regresses).
- Room switch mid-walk: the director re-reads the room's interactables every
  tick; a stale arrival callback checks the handle is still mounted.
- Frame-player not ready (manifest fetch failed): `playClip` degrades to the
  static hero, sound still plays.
- No interactables in a room (dunes, ink-ocean today): curiosity stays quiet;
  the legacy AI idle-roam still runs.
- Onboarding paused / `?legacy=1`: director is not constructed.

## Not in scope

Legacy demolition, new Cosmo clips (fal), new ElevenLabs SFX (existing pool
reused: `jump`, `cling`, `cosmo-coo-1..3`), dunes / ink-ocean content.
