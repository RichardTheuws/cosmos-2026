# Wave 28 — The Clearing, alive at scale

**Status**: APPROVED (Richard, 2026-09-05: "Ga door met Wave 28, begin met systeem 1")
**Verdict that triggered it** (Richard, phone UAT v2.6.0): *"ik beleef nu te weinig in de
werelden om ze interessant te maken; het is nu een world switcher zonder stickyness,
amazement en return-factor."*

Three systems, one room, each mapped to one of those words:

| # | System | Word it answers | Status |
|---|--------|-----------------|--------|
| 1 | **The world answers in layers** — every clearing interactable has tiers; the room itself changes (canopy, stars, haze, dusk, dream) | amazement | v2.7.0 |
| 2 | **Cosmo's inner life** — energy / curiosity / sleep drive what he chooses and how he reacts | stickiness | next |
| 3 | **The clearing's clock** — real-time day/night + one thing that grows per visit (persisted) | return-factor | after 2 |

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
