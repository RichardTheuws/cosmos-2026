# Wave 24 — THE FIRST DWELLER SETUP (Master Canvas)

> A design canvas for human review — NOT production code. The complete first dweller-setup: **three universes (six rooms) + the open map**, synthesized from `00-design-bible.md`, `universe-forest.md`, `universe-ink-ocean.md`, `universe-third.md`, `open-map.md`, the adversarial review verdicts, and the live `universes/forest/` JSON + `behavior.ts`.
>
> Held to NORTH-STAR §1 (the Dweller Lens), the locked brand/visual/language gate, the §3 substrate schema, and "the world breathes, it does not shake." No score, no win, no beat. All in-game text English. No emoji, no placeholder, no stock.
>
> **Verdict roll-up:** Forest **PASS**, Singing Dunes **PASS**, Ink-Ocean **FLAG** (1 blocker: asset-path convention), Open Map **FLAG** (2 must-resolve: phantom becoming-blooms, way-mote return-affordance). Every BLOCK/FLAG is carried as an open item in §7 — none is silently dropped.

---

## 1. THE DWELLER EXPERIENCE (what it is to visit)

You arrive — AirPods in, on a metro seat or in a waiting room — and you are *somewhere*. A sun-warmed clearing where a small uncanny green creature stretches in the light and will bounce on a trampoline if you ask him to; he also bounces alone, because he lives here whether you watch or not. You wander left under a breathing canopy into an underglow grove where touching a glow-cap makes the whole hollow answer in cool light. You look up — and the room dissolves into a hand-inked star-chart, a constellation of luminous **spore-blooms** drifting in a watercolor void, each one a whole world painted in its own palette: warm-Forest, cool-Ink-Ocean, vast-Dunes. You pick the cool one; a portal breathes you under the surface of a sea drawn in a single pen-line, where Cosmo discovers he is *weightless*. Later you drift the chart to the saffron bloom and step into an endless dusk where the sand itself sings a low chord when he slides a crest. Nothing counts. Nothing is won. You are a **visitor gathering experiences** — and beside the three lit blooms, in the empty dark, faint dotted circles wait, each labelled *"your world here."* Wandering what other people made plants the only question the chart needs to ask: *what would I make in mine?* **Visiting and building are one loop.** That is the whole pitch, rendered as a place you can dwell in.

---

## 2. THE MAP (traversal graph)

Grammar: `?substrate=v2&universe=<u>&area=<a>&room=<r>`. Transitions are **scale-selected automatically**: Room↔Room = biome-blend (continuous, 1.5–3.0s); Area↔Area = gradient-cut (brief, 0.6–1.2s); Universe↔Universe = portal (ceremonial, 1.4s). The Spore-Chart is the Universe-scale waypoint only; it never touches Room/Area transitions inside a universe.

```
                          ┌─────────────────────────────────────────────┐
                          │            THE SPORE-CHART (hub)              │
                          │     universes/_chart  ·  void drone bed       │
                          │   discovers every universes/*/manifest.json   │
                          │                                               │
                          │   (forest)      (ink-ocean)      (dunes)      │
                          │   warm bloom    cool bloom       dusk bloom   │
                          │      ·              ·               ·         │
                          │   ┌··becoming-bloom··┐  "your world here"     │
                          │   └···· (build invitation, 2–3 shown) ····┘   │
                          └───┬──────────────┬───────────────┬───────────┘
            portal (1.4s) ▲   │ portal        │ portal        │ portal
         "Look up" way-mote   ▼ saffron 0.62  ▼ cool 0.55     ▼ saffron-warm
        ┌─────────────────────┴──┐  ┌─────────┴─────────┐  ┌──┴──────────────────┐
        │ U1  FOREST              │  │ U2  INK-OCEAN     │  │ U3  SINGING DUNES   │
        │ area: the-mushroom-stand│  │ the-drowned-      │  │ the-singing-flat    │
        │ entryRoom: clearing     │  │   cathedral       │  │ entryRoom: long-dune│
        │                         │  │ entryRoom:        │  │                     │
        │  [clearing] ──biome──┐  │  │   light-shafts    │  │  [long-dune] ──┐    │
        │  anchor 0,0,0        │  │  │                   │  │  anchor 0,0,0  │    │
        │  trampoline,sunbeam  │  │  │ [light-shafts]    │  │  slide-crest,  │    │
        │      ▲   │left-      │  │  │ anchor 0,0,0  │   │  │  bead-bloom    │    │
        │      │   ▼mushroom-  │  │  │ kelp-organ    │   │  │     ▲  │descend │    │
        │  [deep-grove]  path  │  │  │   │ sink-down │   │  │     │  ▼ -leeward│    │
        │  anchor -12,0,0      │  │  │   ▼   ▲ rise- │   │  │ [the-windless-     │
        │  echo-cap,portal     │  │  │ [the-trench]  up  │  │   hollow]          │
        │                      │  │  │ anchor 0,-4,0     │  │  anchor 0,-2,0     │
        │  [the-hollow]        │  │  │ updraft,lure-orb  │  │  singing-bowl      │
        │  (declared-quiet stub)│  │  │ (climb-windward ▲)│
        └─────────────────────┘  └───────────────────┘  └─────────────────────┘
```

- **Forest** intra-traversal: `clearing ⇄ deep-grove` (biome-blend via `mushroom-path` override). `the-hollow` remains a valid declared-quiet graph node, out of scope this wave.
- **Ink-Ocean** intra-traversal: `light-shafts ⇄ the-trench` (biome-blend via `drift` + vertical-camera override; descent geometry `y:0 → y:-4`).
- **Dunes** intra-traversal: `long-dune ⇄ the-windless-hollow` (biome-blend via `drift` + hush override; `y:0 → y:-2`).
- **Hub ⇄ any universe**: ceremonial portal, reached from any room via the **"Look up" way-mote** (substrate-provided; see §6 open item).

---

## 3. PER UNIVERSE

### U1 — THE MUSHROOM FOREST  `name: "forest"` *(EXISTING — deepened; full continuity preserved)*

**Identity / soul:** The first breath — a sun-warmed clearing under a canopy that slow-blooms nectar, where a little uncanny creature has made a home and will bounce for you if you ask. This is **home**: the warmest, least-demanding, most obviously "a place someone made with love" frame in the substrate. `displayNameEn` keeps the live nav-suffix: *"The Mushroom Forest — Cosmo's entry Universe."*
**Sensory signature:** the only universe whose bed is **warm + organic-acoustic** (felt mallets, breath, wood) — "shade on a warm day." Intimate-but-open, grounded, daytime.
**Portal (U↔U):** the live **NebulaPortal**, saffron→ink-aubergine, hue `0.62` — *a warm door opening onto a sunlit room* (the most inviting of the three). Sound = a rising saffron-shimmer swell (warm ascending chord-bloom + chime-cluster + wind-through-leaves, ~1.4s, no impact-hit). Default `universeToUniverse` (no override); ceremony lives in the arrival warmth.

**ROOM A — The Clearing** `clearing` *(LIVE — deepened only in juice)*
- *Felt arrival:* 1.4s portal dissolves into warm cream light; canopy arches overhead; a fat nectar-bead swells and falls — *plip* — into the moss; Cosmo is mid-stretch, blinking; the blue/white trampoline breathes at z-2; a floating-star turns; an eyeball-sentry rotates to look at *you*. Feel: *welcomed, slightly watched, safe.*
- *Palette:* moss-sage ground · mushroom-cream trampoline highlights (live blue/white classic stays) · faded-rose spots · sky-wash→cream horizon · forest-deep canopy edges. **Pop-accent: pop-magenta** — only on the nectar-bead's 0.4s light-catch glint + a hairline rim on the floating-star. Well under 5%, event-peak only.
- *Sound:* **bed** `slow-bloom-loop.mp3` — "Beatless warm drone, ~52 bpm felt-pulse, felted vibraphone + breathy low flute + distant wood-chimes, sun-through-leaves, welcoming, Hayao-calm watercolor, loopable, no melody-hook." **Events:** (1) trampoline bounce → "soft taut membrane *boing* with felted wooden core + saffron-shimmer tail, ~550ms, each bounce slightly higher then settling"; (2) nectar-drip → "round wet *plip* into moss with a crystalline overtone, ~300ms" (idle heartbeat, every 18–30s); (3) eyeball-sentry turn → "slow wet ocular *creak*, leather iris widening, ~700ms."
- *Vibe:* arrival, shelter, gentle welcome. Holds a metro ride: always something to notice (drip, star, sentry tracking you), one thing to *do* that rewards every tap without skill.
- *Interactables:*
  1. **Trampoline** *(LIVE, example #1)* — anchor `{0,0,-2}`, range 2.0. `onUse`: `walkTo`→`walk`→`bounce` (loop, 2–4 cycles, procedural rollZ/pitchX trick-spins layered on)→`idle` settle (+ optional `wink` on final landing). Calm-baseline = membrane hover-bob. Peak = bounce cluster + rising SFX + magenta-nectar glint at apex. *Seed-hook: "a builder placed ONE object and it gives this much joy — what's my one object?"*
  2. **Sunbeam Patch** *(NEW)* — painted warm light-pool decal with slow painterly dust-motes, anchor `{2.5, 0, 0}`, range 1.6. `onUse`: `walkTo`→`stretch` (waking in the warmth)→`idle` inside the beam (catchlight brightens); re-use → `look` up at the canopy gap. Calm-baseline = motes drift + beam breathes ±4% on a ~9s sine. Peak = soft warm swell, saffron blooms, ~2s settle. *A slower second loop contrasting the trampoline's energy — no new clip.*
- *Cosmo (dweller):* default `idle`; autonomous micro-life on a ~20–40s player-idle timer — occasionally `walk`s to the trampoline for a *single* unprompted `bounce`, drifts into the sunbeam to `stretch`, `look`s up on a drip, or holds a `look` toward the sentry (the uncanny acknowledgement). Never >1 autonomous action per cycle.
- *Substrate (rooms.json):* `id:"clearing"`, `area:"the-mushroom-stand"`, anchor `{0,0,0}`, cameraBounds `{1.6,0.6}`, `biomeKey:"slow-bloom"`, exits → `deep-grove` (left-mushroom-path, 12), `the-hollow` (down-burrow, 8). All ids/anchors/exits preserved for share-link safety.

**ROOM B — Deep Grove** `deep-grove` *(brought to full Sims-density — the contrast room)*
- *The contrast:* same forest, same canopy, seen from *underneath* — enclosed + dim + intimate, lit from the ground up by glowing fungus. Keeps continuity with the live `breathing-portal` already placed here.
- *Felt arrival:* in from the left mushroom-path; cream light gone; moss-sage shadow lit from below by glow-cap clusters pulsing slow sky-wash blue-green; tall stems rise out of frame; the breathing-portal swells at the far edge; slow nectar drips into a dark light-rippling pool; Cosmo arrives mid-`look`. Feel: *hushed, curious, the good kind of small.*
- *Palette:* moss-sage glow-caps (the light source) · ink-aubergine shadow-pools · dark reflective nectar-pool · Cosmo's faded-rose + saffron catchlight now the warmest things in frame · forest-deep canopy underside. **Pop-accent: pop-cyan** — only the brightest core of a glow-cap pulse-apex (~0.5s, one cap at a time) + a single cyan glint on the portal inhale-apex. Cool counterpart to the Clearing's warm magenta; under 5%, peak-only.
- *Sound:* **bed** `deep-grove-loop.mp3` — "Beatless low drone, ~46 bpm, bowed double-bass harmonic + glass-bowl resonance + distant reverbed dripping water, underground hush, cool/luminous, Moebius-calm, sub-bass warmth, no melody" — *the same forest one octave down and indoors.* **Events:** (1) glow-cap pulse → "soft glassy *bloom-hum* swelling like a wet wineglass rim, ~900ms, cool-toned" (slow heartbeat, every 6–10s); (2) portal inhale → "deep slow organic *inhale*, breath-through-a-cave, faint cyan shimmer at the top, ~1.2s"; (3) pool-ripple → "low watery *bloop* with long luminous ring-out, ~600ms."
- *Vibe:* quiet wonder, intimacy, the cave you don't want to leave. The *opposite tempo* of the Clearing — you come here to slow down further. **Note (review):** Deep Grove deliberately trades "exciting" for *deeper calm* — it answers beautiful + strange + calm, which passes the ≥2 lens; this is a designed contrast, not a gap.
- *Interactables:*
  1. **Echo-Cap (glow-cap cluster)** *(NEW — this room's delight-loop / trampoline-analog)* — painted glow-cap cluster, nearest cap interactable, anchor `{-13, 0, -1}` *(world-frame: room anchor x=-12 plus 1 unit toward the player, in front of the portal)*, range 1.8. `onUse`: `walkTo`→`walk`→`duck` (crouch, press a hand-disc to the cap underside — suction-cup DNA)→`look` up as light blooms; touched cap flares pop-cyan, a soft cascade lights the neighbors in sequence. Calm-baseline = caps pulse on slow offset sines; pool ripples on drip. Peak = cyan flare + bloom-hum swell + cascade + bed brightens, ~3s settle. *A contemplative loop vs. the Clearing's energetic one. Seed-hook: "a delight-loop doesn't have to be loud." No new clip.*
  2. **Breathing Portal** *(LIVE inhabitant → promoted to soft greeting-interactable)* — anchor `{-13.4, 0, 0}` near the live inhabitant, range 1.6. **Contract (review):** the *inhabitant* owns the THREE.Group + calm-baseline scale-pulse; the *interactable* owns ONLY anchor/range/`onUse` and reads the inhabitant's pulse — it must NOT construct a second plane (v2.2.4 double-tick scar). `onUse`: `walkTo`→`wave` (greet the portal); the inhale-apex syncs to his wave and glints pop-cyan once. **No traversal** — a greeting, not a door. Feel: *the world noticed me back.* No new clip.
- *Cosmo (dweller):* default `idle`, catchlight the warmest point; ~25–45s player-idle timer (slower than Clearing) — `walk`s to a glow-cap and `duck`s to light it himself, holds a slow `look` toward the portal, `stretch`es in a pool of underglow. Never leaves on his own.
- *Substrate (rooms.json):* `id:"deep-grove"`, anchor `{-12,0,0}`, cameraBounds `{1.4,0.5}`, `biomeKey:"slow-bloom"` (kept — underglow authored in **room content** per Option A below, not a new biome), exits → `clearing` (right-mushroom-path, 12).
- *Underglow approach (review-resolved):* moodOverrides are Area-tier and the Forest area is `null`. **Option A (recommended, ships now):** author the dim/cool tint via the glow-cap inhabitant/interactable layer (additive glow-cap planes supplying the underglow) over the shared `slow-bloom` background — one Area, no new biome. **Option B (deferred):** a `slow-bloom-underglow` biome key (re-tinted composition-spec + PNG) only if review wants a deeper global split.

**Forest intra-traversal:** `clearing ⇄ deep-grove`, same Area → biome-blend; the live `MushroomPathTransition` (2.0s) override stays (matches "override exactly one path of three"). Canopy lowers + cream light drains into moss-sage shadow; beds cross-fade; *plip* deepens to *bloop*. Cosmo lands at t=0.5 in the new mood; arrives in Deep Grove on `look`, returns to Clearing on `stretch` (waking into sun). **Spore-mote overlay** on this path is the live Wave-22 TODO (blocked on post-FX composer render-order) — see §7; if not landed this wave the path is a plain biome-blend (the no-mote fallback).

---

### U2 — INK-OCEAN  `name: "ink-ocean"` *(the contract-proof universe — `biomeKey:null` everywhere + custom `background(ctx)`)*

**Identity / soul:** A sea rendered as a single Moebius pen-line, where light falls in cathedral-shafts and Cosmo learns he can be *weightless*. The universe that proves the substrate is **not forest-hardcoded**: every room omits `biomeKey` and ships a custom `background(ctx)` painting ink-water onto the single shared `ctx.parallax`. It exercises the ceremonial portal + `localStorage["cosmos.state.v1"]` for real (a stateful descent — you remember how deep you went).
**Sensory signature:** cool, translucent, **suspended** — everything hangs in negative space, contoured in ink, lit by vertical shafts; Cosmo never "stands." Submerged audio: low-passed drone, ear-pressure, distant whale-throat, slow bubbles. The *descend / let-go* universe.
**Portal (U↔U):** nebula-portal hue-shifted cool, `arrival: {kind:'portal', duration:1.4, hue:0.55}` — a drawn whirlpool of ink-aubergine + sky-wash with the pop-cyan accent spiraling at its eye; Cosmo `fall`s plunging beneath the surface, resolving on the `light-shafts` surface-skin + a wash of bubbles. Sound = ceremonial **submersion swell** ("deep watery whoosh-suck, rising pressure-drop, muffling low-pass sweep as ears go under, capped by a soft saffron bell, ~1.4s"). Leaving = the reverse breach (a gasp of surfacing). `transitions.universeToUniverse` omitted → substrate default portal, hue from `arrival`.

**ROOM A — The Light-Shafts** `light-shafts`
- *Felt arrival:* you arrive *suspended, not standing*; pale sky-wash top fading to ink-aubergine below; **three cathedral shafts of saffron-glow** comb down through drifting motes (ruled ink-hatching God-rays); Cosmo *hovers*, antenna trailing up, suction-cups splayed; slow bubbles rise past him. *I am underwater, and it is calm, and it is beautiful.*
- *Palette:* sky-wash (lit upper skin) · ink-aubergine (deepening lower two-thirds) · saffron-glow (the three shafts only). Foreground = dark ink-aubergine kelp silhouettes; mid = mote-field + bubble columns; bg = pale rippling caustic surface-skin. **Pop-accent: pop-cyan** — one small bioluminescent jellyfish drifting the upper-mid on a slow loop, ~2–3% of frame, only when on-screen. No magenta, no lime anywhere in this universe.
- *Sound:* **bed** `ink-ocean-shafts.mp3` — "Beatless underwater drone; low-pass pad swells, distant filtered whale-throat moan, sub-bass pressure pulse ~every 8s, glassy bowed-string harmonics, occasional single ringing marimba-mallet through water; no beat; weightless, suspended." **Events:** (1) kelp-organ → "slow underwater pipe-organ swell, low/reedy, blowing across a submerged bottle-neck, warm saffron overtone bends down as it settles, ~1.8s, all breath, no attack-click"; (2) jellyfish pass → "single soft glassy bell-chime, faint, cyan shimmer-tail + wet halo, ~700ms, once when it crosses center, randomized"; (3) bubble-release → "short cluster of slow rising bubble-blips, organic/wet, ~500ms, never arcade."
- *Vibe:* awe + release — the relief of letting gravity go. Holds a ride: shafts comb, jellyfish wanders, Cosmo floats; the single cyan accent gives the eye one rare moving thing to track.
- *Interactables:*
  1. **Kelp-Organ** *(headline / trampoline-analog)* — tall ink-aubergine kelp drawn as hollow reed-pipes (`assets/objects/kelp-organ.png`), anchor `{TBD x≈+3, y:0, z:0}`, range ~1.8. `onUse`: `drift-swim` (→ `walk` fallback) to the kelp, then `stretch` (reaches up into the tubes, suction-cups splayed) → `wink` ("I made it sing"); pipes brighten, organ-swell blooms, one shaft warms ~1.8s (small `post.bloom` nudge, decays 2s). Calm-baseline = pipes sway on a slow ~0.4Hz phase-offset sine, silent. *I touched the world and it answered with a chord.*
  2. **Float-Tap** *(uses live `petted`, no new asset)* — direct tap on Cosmo → `petted` (content loop) + a tiny upward procedural drift-impulse on `root.position.y` (decays) so he bobs up a hand's-width and sinks back; bubble-release SFX #3. *Proves the same clip reads new underwater — he's buoyant.*
- *Cosmo (dweller):* **suspended hover-idle** — `idle` + slow vertical drift-bob (±0.15 units, ~0.25Hz) + faint rotational sway (neutrally buoyant, not standing). ~25–40s: autonomous `look` to track the jellyfish, rarely `stretch` toward a shaft. No ground-walk; wandering = slow drift between two hover-anchors.
- *Substrate:* `id:"light-shafts"`, `area:"the-drowned-cathedral"`, anchor `{0,0,0}`, cameraBounds `{1.8,1.2}` (panRangeY taller than any forest room — vertical water), `biomeKey:null`, exits → `the-trench` (sink-down, 14).

**ROOM B — The Trench** `the-trench`
- *Felt arrival:* you sink; frame almost entirely ink-aubergine deepening to near-black at the lower edge; the surface a faint pale memory far above; shafts gone; a **slow vertical updraft-current** (rising ink-streak hatching + a bubble column) rises through center; the drone lower, pressure heavier; one faint cyan glow far below. *I have gone deep, and it is vast, and a little uncanny.*
- *Palette:* ink-aubergine (overwhelming) washing to forest-deep/near-black at the lower frame; a thin sky-wash band at the very top; saffron-glow reduced to one faint catchlight on the updraft. **Pop-accent: pop-cyan** — a deep-glow anglerfish-**lure-orb** resting low, a single luminous point with a soft slow pulse (the room's strange heartbeat), under 5%. *Seen, never used* — an inhabitant, slightly menacing per Cosmo's uncanny register.
- *Sound:* **bed** `ink-ocean-trench.mp3` — "Deep-abyss beatless drone, heavier/lower; sub-bass pulse ~every 10s, very long filtered whale-moan swells, faint distant metallic sonar-ping (~every 20s randomized), occasional glass shimmer rising from below; vast, weightless, slightly uncanny, never tense." **Events:** (1) updraft-ride → "rising whoosh of pressurized water + bubble column, pitch slowly rising as it lifts, ~2s, then a gentle settling sigh, all breath/water, no whoosh-cliché"; (2) deep-glow pulse → "very low slow glassy throb + faint cyan-cold shimmer, ~900ms, felt more than heard, low in the mix"; (3) surface-call → "faint distant choral 'aah' swell with a warm saffron edge, ~1.5s, heard only as Cosmo ascends."
- *Vibe:* vastness + a tolerable thread of the uncanny; the awe of the deep where you're very small. Calm because nothing pursues/threatens/can fail; the lure-orb + sonar pings + the chosen updraft-ride keep it alive. A deeper, more meditative chamber than Room A — closing your eyes and sinking.
- *Interactables:*
  1. **Updraft-Current** *(headline / trampoline-counterpoint)* — a *drawn current* (`assets/objects/updraft-current.png`), a tall semi-transparent scrolling parallax layer, base anchor `{0, y:-4, z:0}`, range ~1.6. `onUse`: `drift-swim` (→ `walk` fallback) to the column base, then `jump` (launch) + a procedural **buoyant-arc** (slow tall vertical lerp up + ease down, ~3s, much floatier than the snappy forest bounce), and on descent `fall` (gentle weightless sink); updraft SFX #1 through the lift; faint `post.fluid` nudge decaying on settle. Calm-baseline = bubble-column/ink-streaks scroll slowly upward, silent, doesn't move Cosmo. *Weightless joy — the trench's answer to the forest trampoline: same grammar, opposite physics.* Reuses the `drift-swim` request; `jump`/`fall` already exist.
  2. **Deep-Glow Lure** *(inhabitant — seen, not used)* — the pop-cyan lure-orb; Cosmo occasionally `look`s and rarely `duck`s (an uneasy flinch-crouch, "that's a little spooky") before idling. Pulses + SFX #2; never attacks/scores/threatens. The *strange/uncanny* texture, kept calm.
- *Cosmo (dweller):* same hover-idle as Room A but **slower and lower** (larger drift-bob, sits lower in frame); autonomous `look` toward the lure, occasional `duck`, rarely drifts into the updraft edge and lets it lift him unwatched (the world plays its own delight-loop). Mood slightly more solemn — the uncanny Cosmo fits the deep.
- *Substrate:* `id:"the-trench"`, anchor `{0,-4,0}` (real descent geometry, echoing forest's `the-hollow` y:-3), cameraBounds `{1.6,1.4}` (deepest vertical pan in the project), `biomeKey:null`, exits → `light-shafts` (rise-up, 14).

**Ink-Ocean intra-traversal:** `light-shafts ⇄ the-trench`, one Area → biome-blend, 2.6s, `pathExperience.kind:"drift"`. Thin `transitions.roomToRoom` override drives the **vertical camera drift** (down on sink-down, up on rise-up) + ink-aubergine tint (override the descent flavour, inherit the rest — matches forest's one-path ratio). Beds cross-fade; on rise-up the surface-call SFX bridges them; on sink-down the sonar-ping fades in as the whale-moan deepens. Cosmo lands at t=0.5 settling into neutral buoyancy; on rise-up frequently auto-`look`s up toward the surface.

---

### U3 — THE SINGING DUNES  `name: "dunes"` *(designer's commit: Dune-Sea at Dusk; Crystal Cavern + Cloud-Temple killed)*

**Identity / soul:** A windless dusk over an endless sand-ocean that hums when you move across it. Committed over Crystal Cavern (would re-tread ocean's enclosed-glow/cyan register) and Cloud-Temple (its thermal-updraft thrill fights the hands-free pocket-escape target). The most distinct universe on every spatial axis: **sparse, horizontal, vast-open, dry, low raking saffron dusk.** The most meditative-psychedelic within the palette; *emptiness itself is the strangeness.*
**Sensory signature:** almost no foreground clutter — wide horizontal bands of warm sand-light meeting a tall dusk sky; heat-shimmer at the horizon; a single long-shadowed crest. Audio: a sustained resonant **sand-drone** + textured wind with no gusts; dry, granular, wide-open.
**Portal (U↔U):** a **dusk-mirage portal** — a heat-shimmer rift on the horizon; the destination wavers into being through rising desert-heat, the saffron horizon-line bowing/parting like a mirage then resolving from the bottom up. 1.4s, hue from `calm-baseline` warmed toward saffron. No spinning vortex (that would shake) — a slow lateral mirage-bloom (it breathes). Sound = "low warm air-shimmer rising in pitch/brightness over ~1.4s, ending on a soft sustained saffron tone, heat made audible, no impact-hit." Arrival materializes Cosmo on **The Long Dune** crest (the "you have arrived somewhere vast" beat).

**ROOM A — The Long Dune** `long-dune`
- *Felt arrival:* high on a windswept crest; frame mostly sky — a tall saffron-glow band low, bleeding up into ink-aubergine, first faint stars not yet committed; sand-ridges recede in cooling bands toward a shimmering horizon; the first thing you hear is **width** — dry grainy wind + a low sustained tone felt more than heard; Cosmo at the lip, antenna tilting to test the air. *Dusk that has decided to last.*
- *Palette:* saffron-glow (low horizon + lit dune-faces) → ink-aubergine (upper sky + shadow-sides) → faded-rose (the alpenglow mid-band on far crests); mushroom-cream sparingly on the brightest highlights. **Pop-accent: pop-magenta** — a cluster of 3–4 half-buried desert-glass nodules that catch a pinprick magenta glint *only* at the exact last-light angle; well under 5%; the one "impossible" color, the strangeness made visible.
- *Sound:* **bed** `dune-drone-open.mp3` — "Beatless desert drone, ~52 bpm felt-pulse, bowed double-bass harmonic + soft glass-harmonica pad + a single sustained sine sub-tone, warm/dry, vast open-air reverb, slow swelling/receding like breath, melancholy-beautiful, no melody-line." **Events:** (1) sand-slide → "deep resonant sand-boom swelling from near-silence to a warm sustained chord over ~1.8s then decaying into granular hiss, like a cello note made of sand, no attack-transient"; (2) glass-bead glint → "single tiny crystalline shimmer-ping with a long soft tail, ~700ms, warm, almost subliminal"; (3) crest-wind → "slow textured dry-wind swell with fine grain, rising/falling once over ~2.5s, no gust-spikes."
- *Vibe:* awe + gentle melancholy — the last light of a day. Calm because the baseline is near-empty and slow; alive because the dunes **very slowly redraw their crests** (30–60s morph you notice only if you watch), the heat-shimmer never stops, and the slide is one tap away.
- *Interactables:*
  1. **Slide-Crest** *(trampoline-analog / delight-loop)* — the lit dune-edge marked by a smoother dry-brushed saffron sheen (`objects/slide-crest.png` decal on the foreground crest), anchor on the crest lip, range fits the slope. `onUse`: `walk` to the lip → `look` down the slope → **`fall`** as he slips over + a **procedural lateral-glide** (gentle rollZ sway + downhill translation, NOT a tumble) → soft `stretch` at the dune-foot as the sand-boom decays; the slope's sheen slowly re-forms uphill inviting another go. Calm-baseline = sheen slow shimmer-breathe + imperceptible downhill grain-drift, silent. *The satisfying whump-and-hum of a sand-slide — horizontal + meditative where the trampoline is bouncy.* **ANIM REQUEST: `slide`** (see §5; the `fall`+glide+`stretch` composite is the fallback, doc-rated only "acceptable" — track as a real dependency since this is Room A's headline joy).
  2. **Bead-Bloom** *(smaller, quieter)* — the desert-glass nodule cluster (`objects/glass-bead-bloom.png`), the pop-magenta accent. `onUse`: `walk`→`duck` to peer→`wink` as a tiny magenta glint answers (SFX #2). Calm-baseline = beads glint only on the light-angle cycle; mostly dormant warm-grey nodules. *The private delight of noticing something almost-hidden — strange, the desert's one secret jewel.*
- *Cosmo (dweller):* a small traveler at a viewpoint — long `idle`, antenna slowly tilting toward the horizon as if listening to the drone; spontaneous `look` out when a crest redraws; an occasional `stretch` as the light shifts; drifts a few steps along the crest and stops. Unhurried, faintly contemplative.
- *Substrate:* `id:"long-dune"`, `area:"the-singing-flat"`, anchor `{0,0,0}`, cameraBounds `{2.4,0.9}` (widest in the project — a vista), `biomeKey:"dusk-dune"` **(see §7 — recommend `null`+composition-spec OR register the biome)**, exits → `the-windless-hollow` (descend-leeward, 10).

**ROOM B — The Windless Hollow** `the-windless-hollow`
- *Felt arrival:* you descend into the lee of two dunes and the world goes *still*; sky narrows to a soft band; wind drops to almost nothing; saffron-glow is gentler, pooled into a warm faded-rose glow off the sheltering walls; the drone closer, enveloping; a scoured rippled **wind-bowl** in the cupped floor; Cosmo arrives lower in frame, cradled. *The quiet inside the vastness.*
- *Palette:* faded-rose (reflected pooled light on the inner walls — the hollow's signature) + saffron-glow (softer warm floor) + ink-aubergine (deepening upper shadow + narrow sky); mushroom-cream on the brightest ripple-edges. **Pop-accent: pop-magenta** — appears *only* on the peak, a thin rim-light racing the bowl's ripple-crests when the bowl rings. **At calm baseline there is ZERO pop-accent** (quieter than Room A) — which makes the peak feel earned.
- *Sound:* **bed** `dune-drone-hollow.mp3` — "Beatless enclosed-desert drone, ~48 bpm, the same bowed-bass harmonic as the open dune but warmer/closer with soft room-resonance, lower more intimate glass-harmonica, no wind-texture (sheltered), faint sand-settling shimmer, cradling/still, no melody" — *Room A's bed with wind removed + reverb tightened, so the Room-blend is a continuous closing-in, not a theme-cut.* **Events:** (1) bowl-ring → "sustained crystalline-sand singing-bowl tone rising slowly + blooming overtones over ~2.5s, like a wet finger circling a glass rim made of sand, very long decay"; (2) ripple-settle → "soft granular sand-trickle settling, ~1.5s, dry/descending"; (3) hollow-hush → "brief soft pressure-drop *whoomp* as wind cuts out, ~600ms, stepping into shelter."
- *Vibe:* safety + hush — Room A's held breath finally let out. The quietest room in the universe (no wind, no pop at baseline); alive via the slow ripple-shimmer + Cosmo's cradled idle + the always-available bowl-ring. The room you'd fall asleep to on the metro and be glad of. *The longest, slowest peak-decay of the universe — this room is where you land.*
- *Interactables:*
  1. **Singing Bowl** *(this room's delight-loop)* — the scoured rippled sand-depression (`objects/wind-bowl.png` floor decal), a natural resonator. `onUse`: `walk` to the rim → **`dance`** (a slow circling sway around the rim, NOT frantic) as the bowl rings (SFX #1) + the rim-light traces the ripples → settles into a `petted`-style contentment posture → `idle`. Calm-baseline = ripples shimmer very slowly (faint cream highlight crawling the crests), silent. Peak = the long blooming bowl-ring + magenta rim-light + drone octave-lift; the slowest, most enveloping peak. *The meditative pleasure of making a held tone bloom — the whole hollow rings.* **ANIM REQUEST: `circle-sway`** (optional; `dance` + procedural slow-orbit is the stated fallback that "reads well").
  2. *(Deliberately only one interactable — declared.)* Sims-density met by inhabitants + background life + the bowl + 5–7 parallax layers; a second would crowd the hush the room is *for*. The restraint is the design (§1 declared-stillness exception).
- *Cosmo (dweller):* dwells lower and slower than anywhere — long settled `idle` near the bowl, occasional `stretch` as if waking from a doze, a slow `look` up at the narrow sky and its first star; if left very long, one unbidden slow circle of the bowl-rim (autonomous delight), then settles. At rest here.
- *Substrate:* `id:"the-windless-hollow"`, anchor `{0,-2,0}`, cameraBounds `{1.2,0.45}` (tight, cupped — the inverse of Room A's vista, mirroring forest's clearing→hollow tightening), `biomeKey:"dusk-hollow"` **(see §7)**, exits → `long-dune` (climb-windward, 10).

**Dunes intra-traversal:** `long-dune ⇄ the-windless-hollow`, one Area → biome-blend, 2.6s, `pathExperience.kind:"drift"`, ambient `#E8C4B8`. As Cosmo crosses the crest into the lee the mood lerps continuously: the wide saffron band narrows/warms into faded-rose pooled light; wind-texture fades out (the hollow-hush SFX fires at the threshold); the drone closes in (open-reverb → room-resonance, same harmonic DNA so it's one tone tightening, never a cut). Cosmo lands at t=0.5 already in the destination mood. **Review note:** this universe overrides its *only* path (1-of-1 = 100%) — defensible at two rooms, but as the universe grows, do not keep overriding every edge.

---

## 4. SENSORY MAP (the breadth at a glance)

| Universe | Room | Ambient bed (file) | Signature event sound | Dominant palette | Pop-accent (≤5%, peak-only) |
|---|---|---|---|---|---|
| Forest | The Clearing | `slow-bloom-loop.mp3` — warm felt-mallet drone | trampoline *boing* + saffron-shimmer tail | mushroom-cream / moss-sage / saffron-glow | **pop-magenta** (nectar glint + star rim) |
| Forest | Deep Grove | `deep-grove-loop.mp3` — low cool bowed-bass drone | glow-cap glassy *bloom-hum* | moss-sage glow / ink-aubergine shadow | **pop-cyan** (glow-cap core + portal glint) |
| Ink-Ocean | The Light-Shafts | `ink-ocean-shafts.mp3` — low-pass whale-throat drone | kelp-organ underwater pipe-swell | sky-wash / ink-aubergine / saffron shafts | **pop-cyan** (drifting jellyfish) |
| Ink-Ocean | The Trench | `ink-ocean-trench.mp3` — deep-abyss sub + sonar-ping | updraft-ride rising water-whoosh | ink-aubergine → near-black abyss | **pop-cyan** (lure-orb, seen-not-used) |
| Singing Dunes | The Long Dune | `dune-drone-open.mp3` — dry desert drone + grain-wind | sand-slide cello-of-sand boom | saffron-glow / ink-aubergine / faded-rose | **pop-magenta** (desert-glass beads) |
| Singing Dunes | The Windless Hollow | `dune-drone-hollow.mp3` — close cradling drone, no wind | singing-bowl crystalline-sand ring | faded-rose pooled / saffron-glow floor | **pop-magenta** (rim-light, peak-only; zero at baseline) |
| Hub | The Spore-Chart | `spore-chart-void.mp3` — beatless cosmic-void drone | portal-open ceremonial chord-bloom | ink-aubergine void / faded-rose + sky-wash nebula | per-bloom signature (Ink-Ocean's orbiting cyan mote) |

*Breadth felt: warm-acoustic → cool-submerged → deep-abyss → dry-vast → close-hush → between-worlds-void. No bed has a tappable beat; every event sound is organic/painterly; no arcade-blip anywhere.*

---

## 5. INTERACTABLE CATALOG + ANIMATION REQUESTS

**Every interactable (object → Cosmo clip(s) → feel):**

| # | Universe / Room | Object | onUse clip(s) | Feel |
|---|---|---|---|---|
| 1 | Forest / Clearing | Trampoline *(LIVE)* | `walk`→`bounce`(+trick-spins)→`idle`(+`wink`) | energetic delight, "I made him do that" |
| 2 | Forest / Clearing | Sunbeam Patch *(NEW)* | `walk`→`stretch`→`idle`; re-use→`look` | tenderness, a slower second loop |
| 3 | Forest / Deep Grove | Echo-Cap cluster *(NEW)* | `walk`→`duck`→`look` | contemplative magic, "the forest answered" |
| 4 | Forest / Deep Grove | Breathing Portal *(promoted)* | `walk`→`wave` | "the world noticed me back" (greeting, not a door) |
| 5 | Ink-Ocean / Light-Shafts | Kelp-Organ | `drift-swim`→`stretch`→`wink` | "I touched the world and it answered with a chord" |
| 6 | Ink-Ocean / Light-Shafts | Float-Tap | `petted` (+ buoyant drift-impulse) | he's buoyant; same clip reads new |
| 7 | Ink-Ocean / The Trench | Updraft-Current | `drift-swim`→`jump`+buoyant-arc→`fall` | weightless joy, the trampoline's floaty counterpoint |
| 8 | Ink-Ocean / The Trench | Deep-Glow Lure *(inhabitant)* | `look`, rarely `duck` | tolerable uncanny, the *strange* texture |
| 9 | Dunes / Long Dune | Slide-Crest | `walk`→`look`→`fall`+lateral-glide→`stretch` | whump-and-hum sand-slide, horizontal meditative joy |
| 10 | Dunes / Long Dune | Bead-Bloom | `walk`→`duck`→`wink` | private delight of a near-hidden secret |
| 11 | Dunes / Windless Hollow | Singing Bowl | `walk`→`dance`→`petted`-posture→`idle` | making a held tone bloom; the slowest peak |
| 12 | Hub | Spore-bloom (per universe) | (UI focus/select → portal) — *see note* | the soft ceremony of choosing a world |
| 13 | Hub | Becoming-bloom ("your world here") | (invitation card — *not* a Cosmo clip) | the door left open; *what would I make?* |

*Hub note (review-resolved §4.2 exception):* the spore-bloom **portal-open** is a Universe-scale ceremony, and the becoming-bloom **onUse is a participation-UI card, not a Cosmo behavior** — both are justified exceptions to "every interactable drives a named clip," stated here so they aren't read as missed patterns. On the chart Cosmo himself drifts and autonomously `look`s/`wave`s at blooms (his dweller life), which *does* use clips.

**Cross-builder animation requests (new painted-frame clips — 8×8 atlas, count 61, cell 256, fps 12; same envelope as the shipped 12):**

| Clip | Universe | Brief | Fallback (ships without it) | Dependency weight |
|---|---|---|---|---|
| **`drift-swim`** | Ink-Ocean | Slow weightless underwater locomotion loop — lazy paddle-strokes, body bobs on the vertical, no foot-contact; replaces `walk` underwater | `walk` (admitted to "read slightly wrong underwater") | **HARD prerequisite** — the universe's soul is weightlessness; alternatively design hover-drift as a *procedural transform over `idle`* (no atlas clip) so a brand-true path never blocks on the new clip |
| **`slide`** | Dunes (Room A) | One-shot ~1.6s — Cosmo sledding down a slope on his backside, arms out for balance, body angled downslope, antenna streaming back, calm not frantic, slight grin, suction-cups trailing | `fall` + procedural lateral-glide + `stretch` (doc-rated only "acceptable") | **Track as real dependency** — it's Room A's headline joy; the composite is the floor, not the target |
| **`circle-sway`** | Dunes (Room B) | 2s loop — slow trance-like circular sway, leaning into the turn, eyes half-lidded, suction-cups trailing | `dance` + procedural slow-orbit ("reads well") | Nice-to-have; fallback is strong |

*Every clip brief preserves Cosmo character-DNA: antenna-bulb, suction-cup hands, no tail, slightly-uncute proportions.*

---

## 6. THE OPEN MAP + BUILD INVITATION

**The Spore-Chart** — a hand-inked celestial atlas, NOT a menu/level-select/progress-grid (those would reintroduce the retired score/lean-in shape). It is itself a *room you can dwell in* that passes the Dweller Lens, and it happens to be the room the others are reached from. A slow-drifting ink-aubergine cosmic void washed with faded-rose + sky-wash nebula; three (today) **spore-blooms**, each painted in *its own universe's signature palette* so you read what a place *is* before going (warm Forest, cool Ink-Ocean, dusk Dunes); a faint dotted ink **spore-trail** between them (a drift-path, not a road); ink-line annotations in **Cormorant Italic** (the universe's `displayNameEn` + first sentence of `summaryEn`). Cosmo drifts near his most-recently-visited bloom (from traversal-history), `look`ing and `wave`ing at the others — *he wants to go whether or not you do.* Visible brush-grain + paper-tooth wash = a traveler's notebook page, not a UI.

**Reaching it:** the **"Look up" way-mote** — a single faint top-of-frame spore of light in every room (Forest's floating-star / Ink-Ocean's rising bubble / Dunes' first star). Tap it (or upward swipe / `M` key) → Cosmo plays `look` up → the room dissolves upward into the chart via the ceremonial portal. English hover microcopy: *"Look up."* **(Open item — see §7: the way-mote must be a substrate-provided default overlay so no universe can trap a player without a return path.)**

**Traveling:** tapping a bloom = the Universe↔Universe portal. The bloom irises outward tinted by that universe's `arrival` hue (Forest 0.62 / Ink-Ocean 0.55 / Dunes saffron-warm); resolves into that universe's `entryRoom`; state persists via `localStorage["cosmos.state.v1"]`. **The map drives the existing grammar** — tapping a bloom is sugar over writing `?substrate=v2&universe=<u>&area=<defaultArea>&room=<entryRoom>` and letting `SubstrateLoader.boot()` resolve it (left-to-right fallback + `history.replaceState` self-heal already in `ResolveURL.ts`). A share-link to a bloom IS a share-link to that universe's entry triple — the map and a deep-link are the same thing seen two ways. No parallel router invented.

**The build invitation (the becoming-places):** around the lit blooms, the void holds **2–3 un-opened blooms** — faint dotted ink-circles, drawn but uncolored (a watercolor wash withheld), faintly pulsing, each labelled in Cormorant Italic: ***"your world here."*** A ghost spore-trail already reaches toward each — *the path is drawn to your door; the world just isn't painted yet.* They are invitations-as-potential, never greyed-out "locked levels." Tapping one opens a quiet painted **invitation card** (Cormorant Italic poetic line + Inter practical line), verbatim English copy:

> *This place is waiting to be drawn.*
>
> Cosmos is an open world built by people who pair with Claude. Bring your own Universe — your room, your sound, your vibe — and your Cosmo can visit mine while mine visits yours.
>
> **Start here:** open Claude Code in any folder and paste the three-line prompt. It reads the charter, meets you where you are, and — if the time's right — builds a Universe with you.
>
> [ Copy the prompt ]   ·   [ Read how it works → ]

- **[ Copy the prompt ]** copies the README quickstart block verbatim (Clone → read NORTH-STAR/UNIVERSE-AUTHORING/CONTRIBUTING → honest fitness-check → "shall we build a Universe together?"). Lowest-friction on-ramp; the fitness-check is *inside* the prompt, so the invite is never gatekeepy.
- **[ Read how it works → ]** opens the repo / `CONTRIBUTING.md` honest-paths table (fix a bug, improve a script, study `universes/forest/` as a reference) — serves the curious-but-not-ready without turning them away.
- **Tone gate (locked English):** warm, oblique, never "SIGN UP / CREATE ACCOUNT / JOIN NOW" (there are no accounts). A door left open, not a funnel.

**The participation mechanic (zero-cost, discovered):** the chart renders **one bloom per discovered `universes/*/manifest.json`** via `import.meta.glob` (the seam `discoverUniverses()` already names: *"Wave 22+ will use `import.meta.glob`"*; the `behavior.ts` glob is the live precedent). **Author a conformant universe folder → you appear on the chart automatically** — no `map.json`, no opt-in flag, no registry PR, no gatekeeper. The map reads only fields that already exist: `displayNameEn` (label), `summaryEn` (annotation), `post.preset`+`intensityCurve`+optional area `moodOverrides.primary` (bloom palette), `defaultArea`+`entryRoom` (portal target), `behavior.arrival().hue` (portal hue), `brandDeviation` (null = composes cleanly; non-null = a small honest ink-margin note "a deviation, documented"). The breadth on the chart is therefore *always current* — it can never lie about what exists. This is "visiting seeds building" made literal: the empty bloom sits in the *same frame* as the worlds you just visited.

---

## 7. CONFORMANCE — decision-tree checklist + every BLOCK/FLAG carried

| Gate (design-bible) | Forest | Ink-Ocean | Dunes | Open Map |
|---|---|---|---|---|
| No score / win / beat | ✅ | ✅ | ✅ | ✅ |
| Answers ≥2 four-questions | ✅ (B = calm-contrast, declared) | ✅ | ✅ | ✅ (3 of 4) |
| Pocket-escape / calm baseline | ✅ | ✅ (verify raised floor — see O5) | ✅ | ✅ |
| Drift-in not lean-in | ✅ | ✅ | ✅ | ✅ |
| Seeds building | ✅ | ✅ (biomeKey:null demo) | ✅ | ✅ (strongest surface) |
| ≥1 trampoline-analog | ✅ ×2 | ✅ ×2 | ✅ ×2 | ✅ (bloom-focus) |
| Sims-density (or declared still) | ✅ | ✅ | ✅ (B declared) | ✅ (declared-quiet) |
| Substrate field-shape mirror | ✅ exact | ⚠️ asset-path (O1) | ⚠️ biomeKey + paths (O3) | ✅ exact |
| Brand / palette / pop ≤5% | ✅ | ⚠️ verify at composition (O6) | ✅ best-in-set | ✅ |
| Language English-only | ✅ | ✅ | ✅ | ✅ |

**OPEN ITEMS (resolve or consciously accept before build):**

- **O1 — Ink-Ocean asset paths (BLOCKER).** Manifest mixes `assets/backgrounds/...` (universe-relative) for images and `../../public/assets/audio/...` for audio. Forest uses `../../public/assets/...` for *everything*. **Resolution: mirror forest verbatim** for all entries (move images to `../../public/assets/backgrounds/ink-water-*.png`), OR confirm with the substrate owner that universe-local `assets/` is supported and move ALL assets (incl. audio) under `universes/ink-ocean/assets/`. **Do not author Ink-Ocean files until O1 is decided** (see Build-Sequence Phase 2 gate).
- **O2 — `drift-swim` is a hard prerequisite for Ink-Ocean, not a soft request.** Either land the clip before Ink-Ocean ships, OR build hover-drift as a procedural transform over `idle` (no atlas clip) so a brand-true weightless path never blocks on a new clip. The `walk` fallback "reads slightly wrong underwater" and undercuts the headline promise.
- **O3 — Dunes `biomeKey` ambiguity.** `dusk-dune`/`dusk-hollow` are almost certainly NOT in the `BIOMES` registry (forest only ships `slow-bloom`); a non-null unknown key routes through `BiomeManager` and may not cleanly fall back. **Resolution: set `biomeKey:null` + ship per-room `composition-spec.json`** (mirroring Ink-Ocean's custom-background seam), OR formally register the two biomes. Decide before authoring Dunes.
- **O4 — Forest per-room audio bed-swap is a BUILD TASK, not config.** `ForestAudio.enter/exit` are comment-only stubs and `DefaultAudio` only loops the *first* `preload:true` audio (the Clearing bed). Swapping to `deep-grove-loop` on room-enter requires actually wiring `AudioFFTBridge.setMusicTrack` + crossfade in the audio handle. **Floor behavior if not built this wave: Deep Grove inherits the Clearing bed and the §5 Deep-Grove sound-design is aspirational.** State this explicitly in the wave plan.
- **O5 — Ink-Ocean raised post-baseline.** `fluid:1.15` / `bloom:1.1` sit above the forest floor (0.9 / 1.0). Justified (water IS fluid; shafts glow) and inside `calm-baseline`, but the updraft "fluid nudge" stacks on an already-raised floor — **post-FX owner must confirm the baseline still "breathes, does not shake."** Also: the `moodOverrides.post` re-declares the identical manifest curve — per "override only what differs," **set `moodOverrides.post` to null/omit it** and keep only `ambient`/`primary`.
- **O6 — Ink-Ocean pop-cyan budget verified at composition, not by assertion.** The jellyfish is tracked (moving) and the lure-orb pulses (draws the eye) — perceived saturation can exceed measured area, especially under the lure-pulse + `post.bloom 1.1` nudge. **Instruct the background/inhabitant author to cap cyan luminance/bloom contribution** so the single accent never reads as >5% of attention.
- **O7 — Forest spore-mote overlay is a Wave-22 TODO** (blocked on post-FX composer render-order). Either commit motes as in-scope this wave (with the render-order note) or accept the **no-mote fallback** (the mushroom-path is a plain biome-blend). Don't oversell §3's path flavor.
- **O8 — Forest Breathing-Portal double-registration contract.** The portal stays a LIVE inhabitant (owns THREE.Group + scale-pulse) AND is promoted to a greeting-interactable (owns only anchor/range/`onUse`). The interactable **must read the inhabitant's pulse, NOT construct a second plane** (v2.2.4 double-tick scar). Confirm in implementation.
- **O9 — Open-Map phantom becoming-blooms (FLAG).** Lit blooms are discovered via `import.meta.glob`; becoming-blooms have no folder so they **cannot be discovered**. **Resolution: a substrate-level `_chart` config constant** (e.g. "render N becoming-blooms in the negative space") — the doc must stop claiming "everything is discovered" while silently needing hardcoded phantoms.
- **O10 — Open-Map `_chart` self-exclusion rule (FLAG).** Pick one and state it: **leading-underscore folders are skipped by `discoverUniverses()`** (cleanest; also hides future reserved folders) OR a manifest flag. Without it the chart enumerates itself as a bloom.
- **O11 — Way-mote return-affordance must be a CONTRACT (FLAG).** "Return to chart = portal in reverse" needs a top-of-frame way-mote in *every* room of *every* universe, or a builder's universe with none traps the player. **Resolution (preferred): a substrate-provided default overlay-mote every universe gets for free** (preserves zero-authoring-cost), with the per-universe art as an optional override. Else document it as a required inhabitant in ROOM-AUTHORING.
- **O12 — Sibling entryRoom forward-references unverified.** The hub asserts Ink-Ocean `entryRoom='light-shafts'` and Dunes `entryRoom='long-dune'` as fact, but only `universes/forest/` exists today. **Mark these "to be confirmed once Ink-Ocean / Dunes rooms.json ship"** so the hub doesn't bake in names that may drift.

---

## 8. BUILD SEQUENCE (smallest-piece-that-compounds)

Each phase ships something fully alive before the next starts ("one biome fully alive beats three half-alive").

**Phase 0 — Substrate seams (compounds into everything).**
- Cash in `discoverUniverses()` → `import.meta.glob('/universes/*/manifest.json')` with the **leading-underscore skip rule** (resolves O10). Resolver + map share this one source of truth.
- Add the **substrate-provided default "Look up" way-mote overlay** + the portal-in-reverse return (resolves O11). *Needs: `SubstrateLoader`, the portal transition, `ResolveURL.ts`.*
- Wire `AudioHandle` room-keyed bed-swap (`AudioFFTBridge.setMusicTrack` + crossfade) so per-room beds work everywhere (resolves O4 for all universes at once). *Needs: the audio handle + `AudioFFTBridge`.*

**Phase 1 — Deepen the LIVE Forest (lowest risk, highest continuity).**
- Update `forest/{manifest,areas,rooms}.json` to the §3 proposals (drop retired `mouth-pillar-sheet.png`; add sunbeam + glow-cap assets + two beds; declared-quiet `the-hollow`).
- Build **Sunbeam Patch** (Clearing) + **Echo-Cap** & **Breathing-Portal greeting** (Deep Grove) as `InteractableHandle`s; honor the O8 read-don't-reconstruct contract.
- Deep Grove underglow via **Option A** (content layer, no new biome).
- Decide O7 (spore-motes in or fallback). *Needs: substrate data files, the painted-frames clips (`stretch`/`look`/`duck`/`wave` — all shipped), the builder-interactable contract. No new clips required.*

**Phase 2 — Open-Map shell (makes the breadth visible — Richard's mandate).**
- Build `universes/_chart/` as a reserved pseudo-universe (bed + drifting Cosmo + bloom inhabitants), self-excluded (O10). With one Forest universe live it already shows one lit bloom + the becoming-blooms (O9 config constant).
- Becoming-bloom invitation card + [Copy the prompt] / [Read how it works] (verbatim English copy from §6). *Needs: the discovery seam (Phase 0), the portal transition, `localStorage` state. Mark O12 entryRoom names provisional until Phase 3/4.*

**Phase 3 — Ink-Ocean (the contract-proof universe).**
- **Gate: resolve O1 (asset paths) and O2 (`drift-swim` vs procedural hover) BEFORE authoring.**
- Author `ink-ocean/{manifest,areas,rooms}.json` + `behavior.ts` with the required custom `background(ctx)` (single shared `ctx.parallax`, never a 2nd ParallaxScene). Apply O5 (omit redundant `moodOverrides.post`; post-FX owner confirms baseline) + O6 (cap cyan budget). Two rooms, the descent, the cool portal. *Needs: Phase 0 audio + map seams; the `background(ctx)` override seam; `drift-swim` (or its procedural substitute).*

**Phase 4 — Singing Dunes (the maximally-distinct third).**
- **Gate: resolve O3 (`biomeKey:null`+composition-spec vs register biomes) BEFORE authoring.**
- Author `dunes/{manifest,areas,rooms}.json` + `behavior.ts`; two rooms (vista + hollow), the slide/bowl loops, the dusk-mirage portal. Track the `slide` clip request as a real dependency (fallback ships but is only "acceptable"). *Needs: Phase 0 seams; composition-spec parallax; the `slide`/`circle-sway` requests (fallbacks ship without them).*

**Phase 5 — Confirm + tighten.**
- Resolve O12 (the hub's entryRoom names now verifiable against shipped rooms.json). Real UAT per the project deploy/UAT discipline (bundle reference, reachability, logic-marker, CF purge). Update HUD-pill version + CHANGELOG + memory.

---

## 9. OPEN QUESTIONS FOR RICHARD (the genuine forks)

> **RESOLVED 2026-05-31 (Richard):** Fork 1 = (a) mirror forest asset-paths verbatim. Fork 2 = (b) ship Ink-Ocean on procedural hover-drift, `drift-swim` clip as fast-follow. Fork 3 = (a) Dunes `biomeKey:null` + composition-spec. **Fork 4 = (a) breadth-first** (Phases 0→1→2→3→4). Fork 5 = "offer all freedom with a simple quickstart" → Claude's call: **3 becoming-blooms**, and **[Copy the prompt] = the README quickstart block verbatim** (single source, never out of sync). Building from Phase 0.


1. **Asset-path convention (O1) — needs your call once, applies to all future universes.**
   (a) Mirror forest verbatim: every asset under `../../public/assets/...` (loader behaves identically today).
   (b) Move to universe-local `universes/<u>/assets/...` for *all* asset types (cleaner per-universe encapsulation, but a substrate change).
   *Recommendation: (a) for Wave 24, revisit (b) as a substrate cleanup later.*

2. **`drift-swim` (O2) — clip vs procedural.**
   (a) Generate the `drift-swim` painted clip now (brand-true, but a pipeline dependency before Ink-Ocean ships).
   (b) Ship Ink-Ocean on a procedural hover-drift over `idle` (no new clip, never blocks), add the clip later.
   *Recommendation: (b) to unblock, (a) as a fast-follow.*

3. **Dunes biome (O3).**
   (a) `biomeKey:null` + per-room `composition-spec.json` (matches Ink-Ocean's proven seam).
   (b) Formally register `dusk-dune`/`dusk-hollow` in `BIOMES`.
   *Recommendation: (a) — consistent with the contract-proof path, no registry coupling.*

4. **Build breadth-first or depth-first?**
   (a) Phases 1→2→3→4 as written (Forest fully alive + map shell first, then expand) — shows the breadth + invitation early.
   (b) Forest-only this wave (Phases 0–1), defer map + new universes — maximizes polish on the home universe.
   *Recommendation: (a) — the map + one new universe is what makes "the breadth + how to take part" visible, which is your stated near-term mandate.*

5. **Becoming-blooms (O9) — how many, and is the [Copy the prompt] payload the README block verbatim, or a tightened bespoke three-liner?** (Affects the invitation-card copy + the `_chart` config constant.)

---

*Held to NORTH-STAR. The world breathes; it does not shake. No score, no win, no beat. Visiting and building are one loop. All in-game text English. No emoji, no placeholder, no stock.*
