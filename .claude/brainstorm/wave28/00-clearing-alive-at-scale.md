# Wave 28 — The Clearing, alive at scale

**Status**: APPROVED (Richard, 2026-09-05: "Ga door met Wave 28, begin met systeem 1")
**Verdict that triggered it** (Richard, phone UAT v2.6.0): *"ik beleef nu te weinig in de
werelden om ze interessant te maken; het is nu een world switcher zonder stickyness,
amazement en return-factor."*

Three systems, one room, each mapped to one of those words:

| # | System | Word it answers | Status |
|---|--------|-----------------|--------|
| 1 | **The world answers in layers** — every clearing interactable has tiers; the room itself changes (canopy, stars, haze, dusk, dream) | amazement | v2.7.0 |
| 2 | **Cosmo's inner life** — energy / zin / affection drive what he chooses, how fast he goes, when he sleeps | stickiness | v2.8.0 |
| 3 | **The clearing's clock** — real-time day/night + one thing that grows per visit (persisted) | return-factor | v2.9.0 |

## System 1 — design (v2.7.0)

A room-scoped `ClearingResponse` (an inhabitant handle the forest authors, ticked and
disposed by RoomHost like any other) owns the room-level effects. Interactables report
each use to it; it decides the tier and answers. Counts are per session now; system 3
persists them.

| Interactable | Tier 1 (every use) | Tier 2 | Tier 3 |
|---|---|---|---|
| Trampoline | walk + bounce-combo + `jump` | **3rd visit**: the canopy lights up (warm glow across the top of the room, 8 s) + kaleido swell | **5th, 10th, …**: a star shower drifts down over the room (10 s) + hallucination overlay + full kaleido |
| Spore-puddle | `dance` + splash | **2nd visit**: the spores linger — a saffron haze hangs in the room for 60 s, bloom +0.15 | **3rd+**: the haze stays for the session and tints the light (bloom +0.3, chroma +0.2) |
| Sunbeam | `stretch`, then `look` | — | **3rd visit**: the beam widens (×1.6 for 20 s), a dust column rises in it, Cosmo `wink`s |
| Nap-cap | `petted` rest, underglow warms | **every rest**: the room dusks — a veil darkens the world 45 %, tiny stars come out, bloom −0.2; lifts over 4 s when he wakes | **2nd+ rest**: he dreams — dusk 70 %, star field, hallucination overlay, kaleido 0.6, `jump` when he wakes (the dream *room* is system 2/3 material) |

Rules: calm baseline stays (NORTH-STAR §3 — the world breathes); every tier-2/3 effect
decays back on its own. Nothing is scored, nothing is shown as a counter.

Pure tier logic lives in `src/substrate/escalation.ts` (unit-tested). Post-FX offsets are
written as `base + offset` onto `u.biomeIntensity` each frame (base captured at room enter,
after `applyUniverseDefaults`).

## Gate
Phone, AirPods: after five minutes Richard can name one thing the *room* did back.

## System 2 — design (v2.8.0)

`src/substrate/innerLife.ts` (pure, tested). Three quantities, never shown as numbers:
**energy** (wild −0.3 · play −0.2 · calm +0.1 · rest +0.5 per visit; +0.008/s idle, ×4 asleep),
**zin** (appetite: +0.012/s quiet, −0.25 per visit; idle wait before he goes looking =
26 s → 6 s as zin rises), **affection** (+0.12 when you send him somewhere, +0.25 when
you send a tired Cosmo to rest, +0.3 per pet; settles to neutral). Per-interactable
**novelty** recovers over ~90 s so his own choices don't repeat.

Behaviour: tired (< 0.28) → he trudges (pace 0.55); sleepy (< 0.14) → he goes to the
room's `rest` interactable himself (the nap-cap, so system 1's dusk/dream fires), or
sleeps where he stands for 14 s if the room has none. Eager (zin > 0.8, energy > 0.6)
→ he hurries (1.15). His own choice = fit(nature, energy) × novelty.

Contract: `InteractableHandle.nature?: 'wild' | 'play' | 'calm' | 'rest'` (default play).
Clearing: trampoline wild · puddle play · sunbeam calm · nap-cap rest. Deep grove:
echo-cap + portal-greeting calm (no rest → he sleeps in place there).

## System 3 — design (v2.9.0)

`src/substrate/clock.ts` (pure, tested) + `readMemory`/`writeMemory` on the persisted state.

- **The clock.** `phaseFor(localHour)` → night (23–05, fades 20→23 and 05→07) · dusk (17–22, rose) ·
  dawn (05–09, pale). ClearingResponse eases a veil to 50 % at night (stars out, bloom −0.15),
  28 % rose at dusk (the canopy catches the evening), 12 % at dawn. The nap's dusk/dream and the
  clock's veil combine as "whichever is deeper". `?hour=22` overrides for authoring/UAT.
- **The garden.** `SporeGarden`: an arc of glow-caps beside the puddle, one more for every
  calendar day you come (cap 7), persisted. On the day it grows, the new cap rises out of the
  moss over 4 s with a bloom.
- **Memory.** Tier counts persist (`forest.clearing.counts`) — the spores you raised are still
  hanging tomorrow (sticky haze restores on enter). Cosmo's inner life persists (`cosmo.inner`);
  energy comes back +0.15/h away, zin +0.1/h, affection is remembered.

Gate: come back tomorrow and name what is different.
