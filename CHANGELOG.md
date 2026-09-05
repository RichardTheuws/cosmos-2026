# Changelog — Cosmos Cosmic Adventure 2026

Alle wijzigingen volgen [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) en [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

De `/updates/` pagina wordt automatisch uit dit bestand gegenereerd via `npm run updates:build`.

## [2.7.0] — 2026-09-05 — Wave 28 · system 1: the world answers in layers

Richard's verdict on v2.6.0 from the phone: *"een world switcher zonder stickyness, amazement en return-factor."* Wave 28 answers those three words with three systems (PRD: `.claude/brainstorm/wave28/`). This is the first: **amazement** — the room itself answers what Cosmo does, and it escalates.

### Added
- **`ClearingResponse`** — a room-level inhabitant the forest authors. Interactables report each use; it decides the tier (`src/substrate/escalation.ts`, pure + unit-tested) and changes the *room*, not Cosmo. Post-FX is written as base + offset every frame, so every tier decays back to the calm baseline (NORTH-STAR §3: the world breathes).
- **Trampoline** — 3rd visit: the canopy lights up (a warm glow across the top of the room, 8 s) with a kaleido swell. Every 5th visit: a star shower drifts down over the room for 10 s, full kaleido, a hallucination bed under the music.
- **Spore-puddle** — 2nd visit: the spores linger, a saffron haze hangs in the room for a minute and lifts the bloom. 3rd visit: the haze stays for the session and tints the light.
- **Sunbeam** — 3rd visit: the beam widens to ×1.6 for 20 s, a dust column rises inside it, Cosmo winks.
- **Nap-cap** — every rest dusks the room: a veil darkens the world, tiny stars come out, bloom drops; it lifts over four seconds when he wakes. From the 2nd rest on he dreams: deeper dusk, a star field, a hallucination bed, a longer rest.

### Notes
- Counts are per session for now; system 3 (the clearing's clock + persistence) makes them survive a return. System 2 (Cosmo's inner life) is next.

## [2.6.1] — 2026-09-05 — The bed comes back after an interruption

### Fixed
- **Music stopped for good after any iOS interruption (AirPods out/in, screen lock, a notification, Siri) while SFX kept playing.** iOS reports the AudioContext as `interrupted`, not `suspended`; the bridge's gesture-resume only handled `suspended`, so no tap could bring the bed back. Howler (SFX) checks both states, which is why effects survived. `ensureRunning` now resumes on either, and the page also tries to resume on `visibilitychange` / `pageshow` / `focus`. (Richard, phone UAT of v2.6.0.)

## [2.6.0] — 2026-09-05 — Chapter 1: the clearing comes alive

The first room that keeps the dweller promise. You visit, and there are things here — for Cosmo, and so for you.

### Added
- **The interaction loop, closed (shared-substrate S3 + S5).** `src/substrate/InteractionDirector.ts`: a tap on an interactable walks Cosmo there and calls its `onUse` — the hook the Wave-21 contract declared, the forest authored, and nothing ever called. Picking is screen-space (`pickOnScreen`, pure + unit-tested) so items without a pickable mesh work too. The legacy trampoline raycast yields when the director takes the tap, so one tap never fires two walks.
- **`UseApi` on the contract.** `onUse(cosmo, api)` — `api.playClip(name, { loop, holdS })` drives one of the twelve painted clips while Cosmo stays put (new `using` state), then he walks home; `api.sfx(name)` fires a one-shot from the shared bus. Two lines are a complete interaction. `arrival: 'bounce'` keeps the trampoline's combo path.
- **Curiosity.** After ~14 s without input Cosmo picks something in the room himself and goes to use it (never the same thing twice in a row). Cosmo lives whether or not you watch (NORTH-STAR §1). Replaces the trampoline-only "show, don't tell" loop on the substrate path.
- **Two new clearing interactables.** The **spore-puddle** (Cosmo steps in and dances; spores lift with him) and the **nap-cap** (he ducks under and rests, curled, while the underglow warms — the slowest thing in the room). Assets: fal Ultra + BiRefNet, house watercolor. The clearing now holds four things, from wild to slow: trampoline · spore-puddle · sunbeam · nap-cap.

### Changed
- **Forest interactables are real now.** Sunbeam → `stretch`, then `look` on re-use, with a coo; echo-cap → `duck` + `cling` + the cascade; portal-greeting → `wave` + coo; trampoline → walk + bounce-combo + `jump`. The old `root.position.y += 0.05` bridges are gone.
- `ROOM-AUTHORING.md` / `UNIVERSE-AUTHORING.md` carry the `UseApi` and the two ways Cosmo reaches an interactable.

### Fixed
- **Deep-grove interactables were off-screen.** They added `room.anchor` (x = −12) to their positions while inhabitants use absolute stage space, so the echo-cap and the portal-greeting rendered at x ≈ −13. All anchors are absolute now; the substrate parks Cosmo at the stage origin per room (`setHome`).
- The forest's trampoline handle built a second trampoline mesh on top of the one main.ts already renders. It owns no mesh now.

## [2.5.1] — 2026-06-15 — Cutover follow-up: the trampoline hint stops leaking

### Fixed
- **The "tap the trampoline" hint no longer shows in the default dweller experience.** An inline guard in `play/index.html` early-returned only when `?substrate=v2` was present — but post-cutover substrate is the default (no param), so the legacy forest-runner's trampoline hint leaked into every bare `/play/` visit (dunes, ink-ocean, chart — worlds with no trampoline). The guard now keys off `?legacy=1`, so the hint runs only in the legacy path. (Live-verified the cutover itself works: the app chunk gates on `?legacy=1`, bare `/play/` boots substrate.)
- **`package.json` version synced to 2.5.1** (was stuck at 2.4.10 while `VERSION` advanced; lockfile updated too). Post-release housekeeping, 2026-09-05.

## [2.5.0] — 2026-06-15 — The cutover: the daydream is the default now

For the first time, `/play/` *is* the substrate. No flag, no hidden path — you arrive in the world.

### Changed
- **Substrate is now the default `/play/` experience (the Wave 22 cutover).** `useSubstrate` flips: the Universe→Area→Room contract boots unless `?legacy=1` is explicitly present. A bare `/play/` now lands in the forest daydream — Cosmo, the breathing world, the "follow Cosmo" travel layer, the "Look up." way home to the chart. Browser-UAT'd: bare `/play/` boots substrate (forest) and writes a clean `?universe=…&area=…&room=…` URL; `?legacy=1` still reaches the old beat-game as a transitional rollback hatch. The substrate-boot-failure → legacy recovery path stays as a safety net.
- **URLs are clean.** `syncURL` no longer writes `?substrate=v2` — in-app navigation and shared links read `/play/?universe=dunes&area=…&room=…`.

### Removed
- **57MB of unreferenced case-study `.glb` models** (the abandoned 3D-puppet exploration — `cosmo-meshy`, `cosmo-3d-v16b/attempts`, the rigged backup). No page or code serves them; the direction was pivoted away from (painted-frames won). They remain in git history if ever needed. `dist` ~454MB. The legacy `assets/3d/cosmo.glb` is kept (the `?legacy=1` path may load it).

### Note
- "No hidden updates" by design (Richard): there's no participation in the Cosmo universe yet, so there's no reason to gate the new experience — it's simply the default. Full legacy demolition ("slopen") — removing the `?legacy=1` branch and the old Phaser beat-game entirely — is the next focused wave.

## [2.4.22] — 2026-06-14 — Wave 26 (cont.): the case-study gallery goes WebP

The last big dir. The `/updates/` case-study — the open record of how Cosmo was built with Claude — was 279MB, most of it never even shown.

### Changed
- **All 230 case-study PNGs → WebP** (191MB → 24MB, ~8×). The full making-of archive is preserved (nothing deleted), just light. The 21 images actually surfaced in the `/updates/` grids had their `CHANGELOG.md` refs rewritten to `.webp`; verified one renders crisp at native 1024² (the Moebius redesign — halftone dots and linework intact). The other ~209 are shipped-but-unshown archive — kept, now ~8× smaller.
- **`dist` 473MB** — down from ~734MB at the start of Wave 26 (~260MB shed across the whole sweep). The remaining bulk is 57MB of case-study `.glb` 3D models (not compressible to WebP) plus the substrate worlds themselves.

### Note
- ~209 case-study images are shipped but referenced nowhere — candidates to exclude from the deploy entirely (a further ~20MB + the 57MB of GLBs) if the full archive doesn't need to be public. Left in for now; that's an archive-policy call, not a code one.

## [2.4.21] — 2026-06-14 — Wave 26 (cont.): the parallax layer-stacks go WebP

The last substrate-path heavy assets: the multi-layer parallax stacks that give the forest and dunes their depth.

### Changed
- **Forest + dunes parallax layer-stacks → WebP** (46MB → 7MB, ~7×): `biome-slow-bloom/` (7 layers — the towering mushroom), `biome-dusk-dune/` (6) and `biome-dusk-hollow/` (5 — the two dune rooms). Each layer's `composition-spec.json` `file:` entry rewritten to `.webp`. Browser-UAT'd against the built bundle: forest mushroom and the golden dusk dunes both paint identically, every layer present, no banding.
- **Fixed a latent fallback bug**: the dunes `bgUrl` fallback built its filename as `…'biome-dusk-dune-4k'}.png` — the `.png` sat outside the template expression, so v2.4.19's rename missed it and it pointed at a since-deleted PNG (harmless while `loadBiome` wins, but a landmine). Now `.webp`.
- Legacy-only layer dirs (`biome-boss`, `biome-cathedral`, `biome-inkpool`, the `slow-bloom*` variants) left as PNG — demolished at the cutover. The full WebP sweep of the substrate-path is now complete; `dist` is down from ~734MB to ~660MB (the remaining bulk is the `case-study` gallery, a separate optimization).

## [2.4.20] — 2026-06-14 — Wave 26 (cont.): Cosmo himself + the inhabitants go WebP

The sweep continues onto the substrate's living things — Cosmo's frames, the world-dwellers, and the canonical hero painting.

### Changed
- **Cosmo's 12 frame atlases → lossless WebP** (28MB → 19MB). Lossless, not lossy: the player samples sub-cells with mipmaps off, so lossy macroblocks would bleed across frame cells on the hero himself — not acceptable on Cosmo. Browser-UAT'd in the forest: every pose crisp, no cell-bleed, no edge halos.
- **The 21 world-inhabitants → WebP** (9MB → 2MB, ~6×): eyeball-sentry, mouth-pillar, kelp-organ, jellyfish, wind-bowl, spore-blooms, sunbeam, the trampoline, and the rest. Cut-outs converted with `-exact` so transparent-edge RGB is preserved — no halos around the alpha.
- **The canonical hero `cosmo-hero-lora.png` → WebP** (5MB → 340KB, 14×). It backs Cosmo's plane *and* every page's favicon/splash — all entry HTMLs (root, `/play/`, `/lore/`) updated, favicon `type` corrected to `image/webp`.
- Only substrate-path assets touched. Legacy-only art (the `biome-boss`/`cathedral` layer stacks, the old pose sprites, the `cosmoV2` decal/3D set) is left as PNG — it's slated for demolition at the substrate cutover, so WebP'ing it would be wasted work.

## [2.4.19] — 2026-06-14 — Wave 26: the heavy heroes go WebP (first-arrival weight)

A daydream you slip into on a phone in a waiting room can't open with a 17MB sky. The seven 4K painterly backgrounds the substrate worlds load on arrival are now WebP — visually identical, a fraction of the weight.

### Changed
- **Substrate background heroes converted PNG → WebP.** The seven 4K backgrounds the dweller worlds preload on arrival (forest's slow-bloom, both dune backdrops, both ink-ocean depths, the chart void + nebula-wash) are now WebP. Together **74MB → 9MB (8× smaller)** with no visible loss — opaque art at q86, the soft nebula veil at q92 with full alpha so its watercolour gradient doesn't band (browser-UAT'd: chart + dunes render identical). The flat masters stay recoverable in git history and are regenerable via the fal pipeline. New reusable tool: `scripts/wave26/webp_optimize.py` (alpha-aware, per-type quality).
- Legacy mini-game backgrounds (`biome-inkpool/cathedral/boss`, the layered biome dirs) are untouched — still PNG, still on the default `/play/` until the substrate cutover. WebP'ing those + the sprite/`case-study` galleries is the next pass.

## [2.4.18] — 2026-06-07 — Wave 25.5: worlds keep their music + you can wander deeper

Two things from the phone-UAT: the music going silent in travelled-to worlds, and the missing depth layer.

### Fixed
- **Worlds reached by travelling now keep their music (iOS).** `AudioFFTBridge.setMusicTrack` now REUSES one persistent, gesture-"blessed" `<audio>` element (swapping only its `.src`) instead of creating a fresh element per swap. A fresh element's `play()` fires async (after the travel veil), outside the wake gesture, so iOS autoplay-policy silenced it — every travelled-to world went quiet. The blessed element re-plays programmatically, so the bed sounds the moment you arrive. (Verified: chart→dune and room→room both swap beds on the same reused element.)

### Added
- **The room-to-room layer — "Cosmo neemt je mee" (depth within a world).** `RoomOnwardOverlay`: when a room declares an exit, a soft breathing Cormorant pill near Cosmo reads "follow Cosmo · <the next room> ↪"; tapping it travels you deeper (same calm dissolve as the chart). The engine already had universe → area → room + the in-app switch + room exits in `rooms.json` — this surfaces the affordance. Each room keeps its own backdrop + bed = its own beleving (e.g. dunes: the open *Long Dune* ⇄ the rippled sand-bowl of *The Windless Hollow*, each with its own drone). The "Look up." mote still leads up to the chart; this leads onward within the world.

## [2.4.17] — 2026-06-07 — Wave 25.5: the way-mote stops yanking you out

### Fixed
- **The "swipe up" return is no longer hair-trigger.** It fired on any casual upward drag (`dy > 90`), so a dweller wandering kept getting pulled out of rooms back to the chart. Now it needs a DELIBERATE upward flick — ~40% of the screen height, near-vertical, in under ~450ms. Tapping the "Look up." mote (always there) remains the easy intentional way home.

### Next (a focused pass)
- **Audio on travel**: worlds reached by travelling go silent on iOS — `setMusicTrack` makes a fresh `<audio>` element each swap, and its `play()` fires async (after the travel veil), outside the wake gesture, so iOS autoplay-policy blocks it. Fix: reuse one "blessed" audio element (change its `.src`) so the bed plays immediately on arrival. (Doing this carefully, not rushed.)
- **The room layer**: surface room-to-room traversal *within* a universe (the engine already has universe → area → room with the in-app switch wired — it just needs an affordance), so each world is a small place to wander, each room its own beleving.

## [2.4.16] — 2026-06-07 — Wave 25.5 soul pass (2/2): the rooms breathe

The second half of the kader: rooms shouldn't demand interaction — they should **breathe** (Richard's "rijkere ambiance"). And the dune's "rare misser" is gone.

### Added
- **`AmbientField`** (`src/substrate/drivers/AmbientField.ts`) — a reusable drifting-mote field (THREE.Points) with slow drift + per-particle sway + a slow opacity breath (calm baseline, never a flicker). Tuned per world:
  - **Dunes** → warm-gold sand-glints on a slow lateral wind.
  - **Ink-Ocean** → cool-cyan plankton rising through the shafts.
  - **Spore-Chart** → faint star-drift through the void (depth behind the blooms).

### Removed
- **The dune "rare misser" + "useless item" are gone.** The decal-plane interactables (`SlideCrest` — whose `slide-crest.png` is a full landscape image that rendered as a floating rectangle; `BeadBloom` — the stray pop-magenta blob; `SingingBowl`) are deleted. Per the kader, dweller-rooms breathe via ambient life, not clumsy thing-interaction; a properly-arted interaction layer (e.g. a touchable jellyfish) is a later wave. `dunes` no longer exports `interactables` (substrate default applies).

### Known (deferred)
- The chart nebula still reads a touch pale (synthetic-alpha wash); WebP/downscale of the 4K heroes for a lighter phone payload — both next.

## [2.4.15] — 2026-06-07 — Wave 25.5 soul pass (1/2): dignity + a guided hub

After the phone-UAT ("a lot of improvement needed — messy hub, no leiding, a Dutch start-message, stray trampoline text"), Richard set the kaders and this is the first half: kill the jarring bugs and give the hub a tidy, guided feel. Thesis: **"You've slipped into someone's daydream."**

### Removed / Fixed
- **The Dutch beat-message is gone for good.** The legacy `touchOverlay` ("Tik Cosmo aan op het beat / Hou ingedrukt voor de schokgolf") is retired entirely — it described beat-game mechanics the dweller doesn't have and was the stray start-message on the chart.
- **No more "tap the trampoline" in dweller-worlds.** That hint (`play/index.html`) is gated to the legacy forest-runner; it leaked into dunes/ink-ocean/chart where there is no trampoline.
- *(The dark shapes flanking Cosmo are his painted suction-cup hand-discs — 1992 DNA, not a bug.)*

### Hub — "Cosmo neemt je mee"
- **Tidy constellation.** Bloom labels are now the world's NAME only (e.g. "The Mushroom Forest", "The Singing Dunes", "Ink-Ocean") — the long "— Cosmo's entry Universe" descriptors and poetic summaries that overlapped near centre are gone (full names/summaries still drive the aria-labels). The poetry lives inside each world, not stacked on the map.
- **A soft first read.** On first wake at the chart, one Cormorant line fades in then dissolves into silence: *"You've slipped into someone's daydream. Touch a world — stay as long as you like."* (once per session, on the wake transition, with an ink-aubergine backing so it reads on any sky).

### Next (soul pass 2/2)
- Rooms breathe (drifting ambient life per world), replace the dune's clumsy decals (the landscape-rectangle + magenta "useless item"), deepen the pale nebula, WebP the 4K heroes, then one redeploy.

## [2.4.14] — 2026-06-07 — Wave 25: dweller-universes lose the forest-runner rings

### Fixed
- **No more leaked NebulaPortal rings in dweller-universes.** The onboarding's `openPortal` is the forest-runner wake flourish; in a non-forest boot the state-machine never runs the walk/obstacle flow that closes it, so the rings opened and lingered — and leaked across travels via the long-lived `CosmoScene`. Now gated on forest gameplay (`trampolineSpots.count() > 0`), like the swipe-hint. Arrival into dweller-universes is the `TravelVeil`'s job. Live-UAT: chart boot shows 1 Phaser Graphics (the VibeMeter), zero portal rings.

### Known (hub polish — next)
- Chart world-bloom labels track their blooms correctly but the long poetic subtitles overlap near centre on a 16:9 viewport — a legibility tune (shorten / hover-reveal / wider bloom spread), to judge in the "go feel it" pass. The chart nebula reads pale (synthetic-alpha wash). Audio still hard-swaps behind the veil (crossfade = Phase 4).

## [2.4.13] — 2026-06-07 — Wave 25: fluid travel, Phase 2 (the journey loop + travel ceremony)

The journey is whole now: wander the Spore-Chart, tap a world-bloom, and **dissolve into that world** — then "Look up." to dissolve back — all without a single page reload. The 3-beat travel (depart → the between-breath → arrive) is real.

### Added
- **`TravelVeil`** (`src/substrate/drivers/TravelVeil.ts`) — the "between" beat. A full-screen DOM veil (saffron-glow core over an ink-aubergine void) that fades in to hide the swap, holds a breath, then fades out onto the destination. DOM (not Phaser/Three) so it composites above both renderers on mobile and blocks input mid-flight. A soft dissolve, never a cut.
- **`cosmos-navigate` event** — the single in-app navigation channel. The way-mote return and the chart's world-blooms both dispatch it; `main.ts` runs the ceremony (`veil.fadeIn → loader.switchTo → veil.hold → veil.fadeOut`) with a re-entrancy latch so taps can't stack the veil.

### Changed
- **Chart world-blooms travel in-app** — `navigateToUniverse()` dispatches `cosmos-navigate` instead of `location.search=` (no reload). Tapping a bloom is still its entry-triple share-link, now reached as a dissolve.
- **Way-mote return goes through the same ceremony** (replaces the Phase-1 direct callback). Legacy reload path retired.

### Verified (live UAT — the full loop)
- Spore-Chart → tap "The Singing Dunes" bloom → veil dissolve → land in dunes (bed `dune-drone-open` playing, way-mote back); → "Look up." (M) → veil dissolve → back on the chart (bed `spore-chart-void`). A window marker survived the **entire** chart→dunes→chart round-trip — zero reloads. tsc + 41 tests green.

### Next
- Phase 3 (Cosmo travel-clip), Phase 4 (audio crossfade so beds morph not snap), gate the forest-onboarding out of dweller-universes (the leaked portal-rings), WebP the 4K heroes for mobile payload, then deploy for the phone.

## [2.4.12] — 2026-06-07 — Wave 25: fluid travel, Phase 1 (the navigator — no more reload)

The first step toward making the dweller's journey BETWEEN worlds feel like travel instead of a page reload. Four parallel code explorations found the substrate is ~90% built for in-app travel — Cosmo, the renderer, the parallax scene and the audio bridge all survive a switch — but the orchestration layer that drives it was missing, and universe switches reloaded the whole page. Decided direction (with Richard): a 3-beat *depart → between → arrive* travel, Cosmo the constant companion threaded through, universal frame first and per-world signatures layered in incrementally. See `.claude/brainstorm/wave25/01-fluid-travel-architecture.md`.

### Added
- **`SubstrateLoader.switchTo(universe, area?, room?)`** — disposes the current host hierarchy and reconstructs it for a new universe/area/room **in place, with no page reload**. Boot and switch now share one `enterUniverse()` path. URL updates via `history.pushState` so the browser Back button returns to the prior world.
- **In-app "Look up." return.** `WayMoteOverlay` gained an `onReturn` callback; the loader wires it to `switchTo`, so returning to the Spore-Chart is now a live transition. Legacy `location.search=` reload kept as a fallback.

### Verified (live UAT)
- dunes → "Look up." → chart with **no page reload** (a window marker survived the switch), Cosmo alive across the swap, the chart's `spore-chart-void` bed swapped in and playing, the way-mote correctly absent on the chart, and the chart rendering cleanly (nebula-wash + orbit rings + bloom-planets) with no dune residue.

### Next (Wave 25 phases 2–5)
- Phase 2: run the (currently never-invoked) transition + `arrival` drivers inside `switchTo` — the 3-beat ceremony. Phase 3: Cosmo travel-clip continuity (`scheduleTransitionClip` + `slide`). Phase 4: audio crossfade + SFX-emit hook. Phase 5: per-world travel signatures.

## [2.4.11] — 2026-06-07 — Wave 24: the worlds find their voice (room beds actually play)

The one where every universe finally plays its own music. Live UAT (real browser, all four universes) caught what header-grep never would: **every substrate universe was playing `title-theme.mp3`** instead of its authored per-room bed. Root cause was a no-op `audio` driver — born in the forest reference and copied into dunes + ink-ocean — built on the false belief that registering an `AudioHandle` *delegates* to `DefaultAudio`. It doesn't: per the §1.4 detection rule, exporting `audio` **replaces** `DefaultAudio`, so the no-op silently killed every room bed swap. Plus an `AudioFFTBridge` gap: a bed requested before the first user-gesture (the substrate selects its room bed at boot) was dropped, then `init()` fell back to the hardcoded title theme.

### Fixed
- **Per-room ambient beds now play in every universe** (live-UAT verified): forest → `clearing-bloom-loop`, dunes → `dune-drone-open`, ink-ocean → `ink-ocean-shafts`, chart → `spore-chart-void`. Removed the no-op `audio` drivers from forest, dunes, and ink-ocean so they inherit `DefaultAudio`'s room-keyed bed swap (chart already did).
- **`AudioFFTBridge` remembers a pre-gesture track request.** `setMusicTrack()` now stores a `pendingTrackUrl` even before the audio graph exists, and `init()` honors it over the default `MUSIC_TRACK`. Without it the substrate's boot-time bed selection was lost to the title theme.
- **"swipe up" hint no longer leaks onto Cosmo's face** in dweller-universes. The forest-runner swipe glyph is now gated on trampoline presence (`trampolineSpots.count() > 0`), so it never renders in dunes/ink-ocean/chart.

### Docs
- `UNIVERSE-AUTHORING.md`: added a warning that a driver **replaces** the default (never augments) — omit the key to inherit; don't ship no-op drivers "to show the registration shape". Corrected the forest reference's audio comment to teach the same.

### Known (next — polish loop)
- Forest-onboarding still partly leaks into dweller-universes: NebulaPortal concentric rings + the obstacle/swipe cadence. Correct fix is to gate the whole `OnboardingDirector` gameplay layer to forest while keeping the universal "Cosmo awakening" wake.
- Dunes interactables render with bad materials (translucent box + pale blob); additive jellyfish black-box; nebula/dune synthetic-alpha — all pending the polish pass.

## [2.4.10] — 2026-05-31 — Wave 24: the worlds render (parallax render-ownership fix)

The one that brings the new universes to life. In substrate mode only `DefaultBackground.update()` rendered the shared ParallaxScene; a universe with a custom `behavior.background()` (chart, ink-ocean, dunes) added its planes to `parallax.scene` but **nothing ever painted it** — so the worlds showed only the renderer's clear colour. Centralised the per-frame parallax render in `RoomHost.tick` so it runs for EVERY background; `DefaultBackground.update()` is now a no-op (its render moved up).

### Fixed
- **Custom-background universes now render full-screen.** Live-UAT verified: **Ink-Ocean** paints its full underwater world (sunlit surface, ink-aubergine depths, god-ray light-shafts, water-motes, glowing jellyfish — black-box gone); **the Spore-Chart** paints its nebula-wash constellation with all blooms + becoming-blooms; **Dunes** renders via its `loadBiome` composition. No mushroom-bleed, no trampoline leak.

## [2.4.9] — 2026-05-31 — Wave 24: chart background → full-screen scene

### Fixed
- **Chart background painted into the foreground** — `chartBackground()` added the void + nebula planes to `ctx.scene` (the perspective CosmoStage → a small floating panel) on the mistaken assumption it was the parallax scene. Now targets `ctx.parallax.scene` (the full-screen ortho backdrop). Removes the misplaced panel.

### Known (next session — one focused render pass)
- Behavior-added planes still don't render *visibly* in `ctx.parallax.scene` (void loads but the backdrop reads flat; ink-ocean paints procedural solid-colour planes there too and reads flat) — a render-order / material / z investigation, common to chart + ink-ocean. Also: ink-ocean ignores its painted `ink-water-surface` 4K asset (paints procedural colour instead); additive inhabitants (jellyfish) show a black box; the "tap the trampoline" HUD hint shows in universes with no trampoline.

## [2.4.8] — 2026-05-31 — Wave 24: substrate-render fixes (live UAT)

Drove all four universes in a real browser (the first true /play/ UAT of the four-universe set) and fixed the systemic render bugs it surfaced. Assets confirmed loading + on-brand; S1 way-mote + `_chart` resolver exemption confirmed working live.

### Fixed
- **Chart boot crash** (`universes/_chart/behavior.ts`) — `BloomBase`'s constructor called the overridden `coreMaterial()`/`haloMaterial()` during `super()`, before `LitBloom.this.uni` was assigned (`Cannot read properties of undefined (reading 'palette')`), crashing the whole chart into the legacy fallback. Refactored the radii + materials to pass IN via `super()` (computed from `uni` where it is in scope) instead of virtual calls during base construction. The chart now boots and renders its per-universe blooms + 3 becoming-blooms.
- **`slow-bloom` bleed-through** — `main.ts` preloads the forest `slow-bloom` biome before substrate boot; universes whose `behavior.background()` paints custom content (not `loadBiome`) let it show through (the mushroom on every world). Added `ParallaxScene.unloadBiome()` and call it on substrate boot so each universe starts from a clean parallax.
- **Trampoline leak** — the forest trampoline + its "show, don't tell" demo loop attached globally regardless of universe. Now `dispose()`d in substrate mode for any non-forest universe (`setSpots([])` didn't work — `buildSpots()` ignores its argument and always rebuilds one). `SubstrateLoader` exposes `resolvedUniverse` for the gate.
- **WayMoteOverlay** — optional-chain the touch `changedTouches` guard.

### Known (next increment)
- Custom backgrounds (chart void/nebula, ink-ocean water) still paint into the foreground `ctx.scene` (render as a small panel) instead of the full-screen `ctx.parallax.scene` — worlds show ambient + a small panel, not a full painted backdrop. Additive inhabitants (jellyfish) render with a black box (additive blend not applied). The "tap the trampoline" HUD hint shows even where there is no trampoline.

## [2.4.7] — 2026-05-31 — Wave 24: 21 painted assets land — the worlds can render

The four-universe skeleton gets its skin. All 21 Wave-24 PNGs were generated best-method (fal Flux Pro v1.1-ultra + Recraft V3, never the cheap path), human-curated on an interactive contact sheet, and promoted to final paths (BiRefNet/luminance/gradient mattes for transparency, ESRGAN ×4 upscales to 4K, exact-dim crops). Ink-Ocean, Singing Dunes and the Spore-Chart now have backgrounds, parallax layers and objects — they render, pending live UAT.

### Added
- **21 painted assets** in `public/assets/{backgrounds,objects}/` — Ink-Ocean (surface/abyss + kelp-organ, updraft, jellyfish, lure, light-shaft, water-motes), Singing Dunes (dusk-dune/hollow 4K + 11 parallax layers + slide-crest, glass-bead, wind-bowl), Spore-Chart (void + nebula-wash + bloom-core/becoming), Forest (sunbeam-patch, glow-cap-cluster). Hayao×Moebius watercolour, locked palette, pop-accents ≤5%.
- **Asset pipeline** (`scripts/wave24/`): `genbest.py` (best-tier generator), interactive `contact_sheet.py` (click-to-pick → picks.json), `promote.py` (matte + ESRGAN + exact-crop from curated picks).

### Notes
- Transparency by the right method per asset: BiRefNet for isolated subjects, **luminance-key** for glow-on-black veils (nebula-wash), **vertical gradient** for parallax landscape bands (dune walls) — BiRefNet blanks those, so it is not used there.
- _Follow-up before public deploy: optimise the opaque 4K PNG heroes to WebP (~10× smaller). Not deployed yet — per-universe live UAT next._

## [2.4.6] — 2026-05-31 — Wave 24 S1: the "Look up." return path + Ink-Ocean beds

Bringing the four-universe skeleton toward life. The first shared-substrate wiring lands — the free return-home affordance so no Universe can ever trap a player — and the Ink-Ocean ambient beds are replaced with real long-form loops.

### Added
- **The "Look up." way-mote** (`src/substrate/drivers/WayMoteOverlay.ts`) — a faint painted mote pinned top-center with the microcopy "Look up." (Cormorant Italic, breathing not pulsing). Tap it, swipe up, or press `M` to return to the Spore-Chart. Mounted free by the substrate in every non-reserved universe; never authored per-universe. The chart itself omits it (you are already home).
- **Reserved-universe resolver exemption** (`src/substrate/ResolveURL.ts`) — `_`-prefixed folders like `_chart` are excluded from enumeration (the chart never lists itself as a destination) yet remain loadable when requested explicitly, so the return resolves to the chart instead of bouncing to the forest. Covered by two new resolver tests.

### Changed
- **Ink-Ocean beds regenerated** — `ink-ocean-shafts.mp3` (168s) and `ink-ocean-trench.mp3` (154s) replace the 19.8s stubs with real long-form loops (Suno, transcoded 128k). Ink-Ocean Phase 3 audio unblocked.

_The portal-in-reverse ceremony and the pre-return Cosmo `look` clip (S2/S3) are not yet wired — the return is currently an honest reload into the chart, which plays its own calm arrival. Not deployed._

## [2.4.5] — 2026-05-31 — Wave 24: four-universe substrate skeleton (world-builder team)

A parallel world-builder team (multi-agent workflow, each builder holding the brand contract + dweller lens, each writing only its own disjoint folder) authored the buildable substrate for the full first setup. Hard gate: **tsc PASS, build PASS, zero compile errors.** Skeletons-to-UAT — they compile and the data is contract-conformant, but the worlds don't render until their assets are generated (next step). Full integration runbook: `.claude/brainstorm/wave24/01-BUILD-STATUS.md`.

### Added
- **Ink-Ocean** (`universes/ink-ocean/`) — new Universe, `biomeKey:null` + custom `background()` on the shared scene (proves the contract isn't forest-hardcoded). 2 rooms (Light-Shafts, The Trench); weightless Cosmo = procedural hover-drift over `idle`; cool portal (hue 0.55).
- **Singing Dunes** (`universes/dunes/`) — new Universe, `biomeKey:null` + per-room composition-spec. 2 rooms (Long Dune vista, Windless Hollow); dusk-mirage portal; the Hollow declares deliberate stillness in its README.
- **The Spore-Chart** (`universes/_chart/`) — the open-map hub (reserved `_`-prefix, auto-skipped by discovery). Renders one bloom per discovered universe + 3 "your world here" becoming-blooms; tapping a bloom drives the existing URL grammar; [Copy the prompt] = README quickstart verbatim.
- **READMEs** for the 3 new universes; per-world asset runbooks under `.claude/brainstorm/wave24/`.

### Changed
- **Forest deepened** (`universes/forest/behavior.ts`) — added 3 interactables (Sunbeam Patch; Echo-Cap glow-cluster; Breathing-Portal greeting that reads the live inhabitant's pulse, no second plane — v2.2.4 scar honored), spawn-gated per room. All existing inhabitants/trampoline/background preserved. Deep Grove underglow via content layer (no new biome).
- **CHANGELOG emojis removed** — they leaked into the player-visible `/updates/` page (the build regenerates it from this file). No emoji in any in-game string or behavior.ts (verified).

_Not yet alive: needs 21 PNGs + audio (2 regen + 1 new) + 3 Cosmo clips + ~21 SFX, plus the shared-substrate wiring (way-mote, portal both ways, named-clip scheduler, SFX hook). Per-universe live UAT pending. Not deployed._

## [2.4.4] — 2026-05-31 — Wave 24 Phase 1a: Forest ambient beds (Suno)

The first content on the per-room audio seam. Richard generated the beds in Suno from the canvas §3 specs (`scripts/wave24/gen_forest_beds.py` holds the prompts; manual gen — Suno credits were low).

### Added
- **7 ambient beds** (Suno, transcoded 128k) in `public/assets/audio/music/`: `clearing-bloom-loop`, `deep-grove-loop` (Forest, used now); `ink-ocean-shafts`, `ink-ocean-trench`, `dune-drone-open`, `dune-drone-hollow`, `spore-chart-void` (staged for Phases 2–4).
- **Forest per-room beds wired**: `clearing.audioBed` → clearing-bloom-loop (warm felt-mallet drone, 138s), `deep-grove.audioBed` → deep-grove-loop (cool bowed-bass underglow, 185s). DefaultAudio swaps between them on room-enter.

### Known
- **Known issue:** `ink-ocean-shafts` + `ink-ocean-trench` came back only **19.8s** (Suno returned short variants) — too short to loop well; flagged for regen before Ink-Ocean (Phase 3). Not used yet.

_Live audio UAT pending (bed plays on wake; swaps on clearing↔deep-grove). Not yet deployed._

## [2.4.3] — 2026-05-31 — Wave 24 Phase 0b: per-room audio bed-swap

Second substrate seam (resolves canvas O4). Makes per-room ambient beds work everywhere at once.

### Added
- **`RoomSpec.audioBed`** — optional per-room ambient music bed (a universe-relative asset path), in the rooms.json schema + validator. Omit → inherits the manifest's first `preload:true` audio (legacy behavior).

### Changed
- **`DefaultAudio` wired** — was a stub (resolved a bed but never played it). `enter()` now swaps to the room's bed via `AudioFFTBridge.setMusicTrack`. Gesture-gating handled by the bridge (source created paused pre-unlock; the wake-tap's `ensureRunning()` plays it — the Sprint 11D retry path). A source-swap like the legacy `onTrackSwap`; true gain-crossfade is a future bridge enhancement. `RoomHost` now passes the room to `defaultAudio`.

_Internal seam; not deployed. Phase 1 (deepen Forest: interactables + the two beds + underglow) is next._

## [2.4.2] — 2026-05-31 — Wave 24 Phase 0a: universe auto-discovery

First substrate seam of the Wave-24 first-setup build (design canvas: `.claude/brainstorm/wave24/00-FIRST-SETUP.md`). Breadth-first per Richard.

### Changed
- **`SubstrateLoader.discoverUniverses()` now globs `universes/*/manifest.json`** (`import.meta.glob`, same mechanism as the behavior.ts loader) instead of a hard-coded list. Author a conformant universe folder → it's discovered automatically, no registry/opt-in/gatekeeper. This is the single source of truth the open-map (Spore-Chart) will share. Folders whose id starts with `_` are reserved and skipped (so the future `_chart` pseudo-universe never enumerates itself); the default universe is always included as a safety net. Resolves canvas open-items O10 (self-exclusion rule); no behavior change today (forest is still the only universe).

_Internal substrate seam; not deployed. Way-mote (O11) re-sequenced to Phase 2 (it needs the chart as a destination); per-room audio bed-swap (O4) is the next foundational seam._

## [2.4.1] — 2026-05-31 — hide the vibe ring (beat-mechanic retirement begins)

Live phone UAT of v2.4.0 — painted Cosmo/world/trampoline confirmed "te gek". Richard flagged the on-screen "timer-circle" as distracting and questioned the (unnoticeable) music interaction. NORTH-STAR §6 pivot logged: the gamified beat/combo-score model is retired in favour of free movement + builder-authored interactables + world expansion.

### Changed
- **VibeMeter ring no longer drawn** — the saffron/rose ring around Cosmo (avatar of the combo-score loop) is hidden. Level logic is left intact for now (DeepTripMode still reads `fullEdge`); the full score-logic teardown follows in the pivot cleanup. Dead ring constants + `lerpColor` removed.

_NORTH-STAR §6 (2026-05-31) records the larger direction: drop "do-something-on-a-beat", let Cosmo move freely everywhere, let builders author their own interactables + request Cosmo-clip contributions, and focus next on world expansion (transitions + traversal). Calm-baseline ambient audio cosmetics stay._

## [2.4.0] — 2026-05-31 — Wave 23: full painted-frames clip set (12)

Proof slice confirmed by Richard ("ja, dit bewijst het"). Completes the painted-frames Cosmo to the full 12-clip state set on Kling v2 master.

### Added
- **8 more clips** generated + shipped (`public/assets/cosmo-frames/`): duck, dance, wave, wink, stretch, fall, petted, look — joining idle/walk/bounce/jump. All 12 are alpha-cut watercolor atlases (8×8, 61 frames, 12fps) with consistent 1992-DNA.

### Changed
- **3 states wired to clips** — `forceFall` → `fall`, pet → `petted` (loop), petal-spew look-up → `look`. The other clips (duck/dance/wave/wink/stretch) were already called via `playClip`. Now the whole state machine drives painted frames.

_Full set — live UAT pending across all states. fps tunable per clip in manifest.json (data-only). Not yet deployed._

## [2.3.0] — 2026-05-31 — Wave 23: painted-frames Cosmo (proof slice)

The pivot that came out of "ik heb er geen gevoel bij dat we progressie maken" (NORTH-STAR §6, 2026-05-31): a flat billboard that sways/bobs is still a sticker. After spiking painted-frames vs a 2.5D puppet side-by-side, Richard chose **painted frames** ("die zijn geweldig, die wil ik"). This ships the proof slice — 4 core clips wired live — before the full 12-clip batch.

### Added
- **`CosmoFramePlayer`** (`src/three/cosmoFramePlayer.ts`) — plays per-state frame-atlas clips on the billboard material. Loop clips ping-pong (the i2v clips aren't designed seamless loops); one-shots clamp then auto-return to `idle`. Graceful degrade: if the manifest fails to load, the static hero stays.
- **Generation pipeline** (`scripts/wave23/`): `gen_clips.py` (fal.ai Kling-v2-master image-to-video from the LoRA hero, config-driven via `clips.json`), `alpha_cut.py` (per-frame BiRefNet → clean RGBA, dark eyes preserved), `pack_clips.py` (ffmpeg extract + tile → one atlas PNG + manifest per clip).
- **4 core clips** generated + shipped (`public/assets/cosmo-frames/`): idle, walk, bounce, jump. Real expressive watercolor motion — breath, blink, weight-shift — with the 1992-DNA consistent across frames.

### Changed
- **`playClip()` revived** — it drove a dead `AnimationMixer` (null since the 21.2 billboard pivot); it now drives the frame-player. The state machine was already calling it at the right moments. The `walkTo` clip gate now consults the frame-player too.
- **Anim director steps aside** — when frames own motion, the director only billboards the plane toward the camera (the frames carry breath/walk/squash). The v2.2.11 rollZ/pitchX layer is reserved for trampoline trick-spins.

_Proof slice — live UAT pending (walk/bounce may need regen; full 12-clip batch follows on Richard's go). Not yet deployed; verify at `/play/?substrate=v2`._

## [2.2.11] — 2026-05-31 — Wave 22: Cosmo actually walks (billboard anim layer)

Richard's UAT of v2.2.10 confirmed. Strategic call before chasing trampoline tricks: first make Cosmo *read as walking*. Root cause found — the walk-sway was silently dead since the Wave 21.2 billboard pivot: the director wrote `plane.rotation.z`, then `rig.update()` ran `plane.lookAt(camera)` at the end of the same tick and overwrote the plane's entire orientation. Facing (`root.scale.x`) and squash (`root.scale.y`) survived only because they live on the root, which lookAt doesn't touch. Per NORTH-STAR §4 (don't patch a broken system) the fix is the foundation both walking AND tricks need.

### Added
- **Post-lookAt billboard anim layer** — `CosmoV2Rig` gains `rollZ` / `pitchX` / `bobY` offset fields. `rig.update()` now applies the billboard lookAt **first**, then re-layers `rotateZ(rollZ)` (view-axis roll — shoulder-tilt / cartwheel) and `rotateX(pitchX)` (horizontal-axis pitch — somersault) on top, so anim transforms survive the per-frame re-orientation. `bobY` rides the plane's local Y (not root) so it never fights CosmoAgent's ownership of `root.position`. This same layer is what trampoline spins/flips will write to next.
- **Walk step-bob** — `rig.bobY` hops on each half-stride (~2.5% body height): the single most legible gait cue for a flat billboard.

### Changed
- **Walk-sway revived** — director now drives `rig.rollZ` instead of the dead `plane.rotation.z`. Amplitude bumped 0.03→0.05 rad (~2.9°) now that it's actually visible. Calm per §3 (breathes, doesn't shake).

_Walk legibility needs live human UAT — does Cosmo read as walking with weight, not sliding?_

## [2.2.10] — 2026-05-30 — Wave 22: "show, don't tell" onboarding

Live UAT of v2.2.9 (Richard): trampoline good, but the controls were undiscoverable on laptop ("ik snap niet hoe ik iets moet doen"), and we need an "uitleg" that also inspires contributor-devs to build their own Universe + Cosmo + interactables (§3b). Chosen direction (AskUserQuestion): "show, don't tell".

### Added
- **Autonomous trampoline demo** — Cosmo walks to the trampoline and goes wild on his own ~3s after the visitor wakes him, then every ~16s while idle. So a new visitor immediately SEES the delight loop instead of guessing the controls. Safe by construction: `CosmoAgent.applyAI` yields position during `walking-to`/`bouncing` (`ownedByOtherSprint`), so the demo never fights companion-mode. New `CosmoAgent.isBusy` getter guards against interrupting an active state.
- **Fading hint** — an on-brand Cormorant-italic line "tap the trampoline — watch him go" fades in a beat after wake (as Cosmo demos), dismissed by the next tap or after 9s. No nagging.
- **Dev-invite link** — "built openly — make your own world →" in the hover-reveal hud (top-left), linking the public repo. Carries the §3b open-substrate pitch quietly, for the contributor-dev audience.

_All visual/timing behavior needs live human UAT — code cannot self-verify._

## [2.2.9] — 2026-05-30 — Wave 22: one hero trampoline + classic colors

Live UAT of v2.2.8 (Richard): trampoline looks good, but there were 4 of them and the colors were too muted. Quick fixes; the controls/onboarding ("uitleg") is the next, larger piece — it also has to inspire contributor-devs to build their own Universe + Cosmo + interactables (the trampoline is example #1).

### Changed
- **One hero trampoline** — `TrampolineSpots` now builds exactly one, centred at `(0,0,-2.4)`, ignoring the biome `composition-spec.json` multi-spot cluster (slow-bloom declared 3). NORTH-STAR §3: one fully-alive delight loop beats three half-alive.
- **Classic trampoline colors** — vivid cobalt-blue safety-pad rim (low metalness + slight emissive so the blue stays saturated) + bright white mat (small emissive lift so it reads bright, not grey-lit). The classic blue-and-white combo.

## [2.2.8] — 2026-05-30 — Wave 22: the real trampoline + bounce juice

Live UAT of v2.2.7 (Richard, 2026-05-30): the substrate path looked ~identical to legacy (correct — D4 was plumbing; the visible difference is a per-room inhabitant, proving substrate is on), but Cosmo had no smooth movement and there was no real trampoline. This ships the heart of the delight loop (NORTH-STAR §3). Shows on BOTH paths (shared Cosmo stack).

### Added
- **`Trampoline3D`** (`src/three/trampoline3D.ts`) — a real trampoline built from primitives: steel frame + blue rim (torus, metallic) + four splayed legs + a **white flexible mat** (subdivided disc) that dips on impact and springs back via a damped spring. A deliberate ≤5% pop-object, shaded soft to sit in the watercolor world. Replaces the retired `organic-flesh-trampoline.png` billboard.
- **Rebounce combo** — arriving on the trampoline triggers 4 bounces (1 + 3 auto-rebounces), so Cosmo "gaat los" instead of a single hop. Mat flexes + kaleido spikes on each.

### Changed
- **`TrampolineSpots`** rebuilt to render `Trampoline3D` (one hero trampoline by default) — same public API (attach / update / pickAtNDC / positions / positionOf), tap→walk→bounce wiring unchanged; new `impactNearest()` flexes the mat under Cosmo (wired from `onBounce` in main.ts).
- **Bounce now has squash-stretch juice** — `CosmoAnimDirector` runs its 0.8s squash→stretch→settle arc on the `bouncing` state too (it already matched `BOUNCE_DURATION_S`); previously only the bare `worldY` arc played (no squash), which read as flat.
- **Idle-breath** raised ±2% → ±3.5% (the old amplitude read as static on the billboard).

### Next (after this UAT confirms the base)
- Procedural **tricks** — spins/flips applied *after* the billboard `lookAt` (which currently clobbers `plane.rotation`), escalating per rebounce. Held back deliberately so the billboard-rotation approach is validated against the working base first. _All visual behavior here needs live human UAT — code cannot self-verify pixels._

## [2.2.7] — 2026-05-30 — Wave 22 D4+D5: substrate single-tick + first test suite

7-team strategic vision-fit audit (overall 5.5/10) found the single largest execution-vs-vision divergence: the entire Room→Area→Universe model (§3) and open-substrate pitch (§3b) are fully coded but **dead in production** — `/play/` never sets `?substrate=v2` (`src/main.ts:51-53`). Wave 22 executes the deferred Wave-21 hard cutover, ships a second Universe (Ink-Ocean) to prove pluggability, and stands up the first real test+UAT gate. This release ships the first two foundations (D4 + D5); both flag-gated/internal — default `/play/` is unchanged (legacy path). The hard cutover (substrate becomes default) lands later in the sequence as a minor bump, gated by live visual UAT.

### Added
- NORTH-STAR §6 Pivot Ledger entry (2026-05-30 — Wave 22): hard cutover (delete legacy after parity), second Universe in-wave (Ink-Ocean), test+UAT gate parallel.
- `.claude/brainstorm/wave22/` — synthesis plan (`00`) + four concern docs: cutover & legacy-migration (`01`), traversal & second-universe (`02`), delight-loop unification (`03`), test & UAT gate (`04`).
- **D5 — first automated test suite**: Vitest on the pure-logic substrate resolvers + schema validators (`ResolveURL`, `ResolveMood`, `Manifest/Areas/Rooms` schemas). 39 tests, runs <0.2s. `npm test` now actually runs (was an `echo` stub); `predeploy` gains `test` before `build`. Test files excluded from the build's `tsc --noEmit`.

### Changed
- **D4 — substrate owns its background (the linchpin)**: `SubstrateCtx` now exposes the single shared `parallax` instance (the contract extension v2.2.4 deferred). The forest drops its no-op `background` override and inherits `DefaultBackground`, which drives the shared parallax per-room from `room.biomeKey`. `main.ts` ticks parallax **only on the legacy/recovery path**; on the substrate path the per-room background driver is the sole ticker — exactly one tick per frame, making the v2.2.4 double-paint structurally impossible. Still gated behind `?substrate=v2`. _Pixel behavior (parallax pan, per-room biome paint, no flash/stack) requires live human visual UAT._

## [2.2.6] — 2026-05-05 — Wave 21.2.4: mouth-pillar retired, the-hollow goes quiet

Self-UAT of v2.2.5 the-hollow showed the mouth-pillar still flickered as 4-5 cycling rectangles — even with clean alpha. Diagnosis: Sprint 15C built `mouth-pillar-sheet.png` as 4 *separately-painted* frames composited horizontally (per `weirdo_objects_v15c.md`: "diffusion can not render sequential-states in one image"). The frames are four different illustrations, not animation-coherent poses of one character. Cycling them creates a stack of non-coherent shapes regardless of how clean the alpha is.

Per NORTH-STAR §4 brave-reconsideration: three patches on the asset (alpha-cut, alphaTest tuning, render-order) didn't fix the underlying construction. Retire. The-hollow becomes intentionally quiet — Cosmo + parallax forest.

### Removed
- `mouth-pillar` entry from `FOREST_INHABITANTS` in `universes/forest/behavior.ts`. The PNG stays on disk for a future single-pose remake.

## [2.2.5] — 2026-05-05 — Wave 21.2.3: Dutch strings retired + mouth-pillar alpha-cut

Self-UAT of v2.2.4 the-hollow room showed three remaining issues: mouth-pillar inhabitant rendered with a grey rectangle bg (Sprint 15C asset never had clean BiRefNet alpha), and two Dutch strings still appeared on screen — the HintGlyph "veeg omhoog" and the dailyStreak pill "Dag X in de trip". `/play/` is English-canonical per the v2.2.1 chrome-strip; these were oversights.

### Fixed
- **mouth-pillar-sheet.png** alpha-cut via fal-ai/birefnet (General Use Heavy, 1024×1024). 752 KB → 470 KB, clean transparency, four pillar-with-mouth frames now read against any bg without the grey halo.
- **HintGlyph default text**: `'veeg omhoog'` → `'swipe up'`. Same change at the CosmoScene callsite.
- **dailyStreak pill**: `Dag X in de trip` → `Day X in the trip` in `src/share/dailyStreak.ts`.

## [2.2.4] — 2026-05-05 — Wave 21.2.2: dual-ParallaxScene removed + self-UAT pipeline

Live UAT after v2.2.3 (this time done by me with Playwright, not surfaced to Richard) showed the substrate path STILL had rectangle artifacts even with per-room filter + renderOrder + alphaTest fixes applied. Diagnosis: `universes/forest/behavior.ts::background` constructed a *second* ParallaxScene against the same canvas main.ts already painted to. Two parallax instances rendering decoration spots over each other produced the visible rectangle stack.

### Fixed
- `ForestBackground` is now a documented no-op. The substrate `behavior.background` does NOT construct its own ParallaxScene; main.ts's existing instance paints the world for both the legacy and substrate paths. The contract extension where SubstrateCtx exposes the single shared parallax (so universes can hook into rather than duplicate it) is deferred to Wave 22.
- Self-UAT pipeline: Playwright script at `/tmp/uat-cosmos.mjs` (using reign-of-brabant's existing playwright install + cached browsers) loads each URL, taps to skip the OnboardingDirector boot-overlay, waits 6s for arrival animation, screenshots. Memory written: `feedback_visual_uat_required.md` — programmatic UAT proves bytes arrived, never proves bytes paint correctly. Take the screenshot myself before claiming ship.

## [2.2.3] — 2026-05-05 — Wave 21.2 finish: per-room inhabitants + render-order

Live UAT of v2.2.2 showed legacy `/play/` rendering Cosmo correctly (the canonical 1992-DNA hero painting), but `/play/?substrate=v2` showed a stack of mushroom-rectangles obscuring Cosmo entirely. Two compounding bugs in `universes/forest/behavior.ts` and `cosmoV2.ts`:

### Fixed
- **Per-room inhabitant filter**: `forestInhabitants(ctx)` previously spawned all 4 inhabitants (eyeball-sentry, floating-star, breathing-portal, mouth-pillar) regardless of which room was active. Their fixed anchors stacked them all in front of the camera. Added `room: 'clearing' | 'deep-grove' | 'the-hollow'` to `InhabitantSpec`, filter on `ctx.room.id` before instantiating. Now only the inhabitants belonging to the active room render.
- **Cosmo render-order**: with `depthWrite: false` on Cosmo's billboard plane AND on inhabitant planes, draw-order won over Z. Inhabitants drew after Cosmo and painted over him. Set `cosmo.plane.renderOrder = 100` so Cosmo always draws last, on top of everything.
- **Inhabitant alphaTest 0.05 → 0.5**: Sprint 15C weirdo-object PNGs have soft-edge dark borders that registered as visible-but-translucent rectangles instead of being culled. Tighter alphaTest cleans the silhouettes.

## [2.2.2] — 2026-05-05 — Wave 21.2: skeleton-rig retired, Cosmo becomes a hero-PNG billboard

**Live UAT of v2.2.1 showed the third decal-attempt also failed.** The regenerated decals were rendered as full-frame paintings with the mushroom-scene baked in, then stacked as rectangles + black ovoids on the capsule. Three attempts did not converge: PIL crops, fal.ai LoRA regen, alpha-isolation tuning — all defeated by the diffusion-model bias toward painting-the-context. NORTH-STAR §4: stop patching, reconsider the system.

The system is the **decal-on-capsule paradigm**. It's retired. The canonical `cosmo-hero-lora.png` (Sprint 16A, 10/10 DNA, already shipped) becomes Cosmo's geometry directly — a single textured plane that billboards toward camera with Y-axis locked vertical.

### Changed
- **`src/three/cosmoV2.ts`**: 374 → 133 LOC (−64%). Capsule body, sphere head, headBone, 4 disc-arms, 6 v2-final decal-planes, FaceState compositing — all retired. Replaced with one `THREE.Mesh + PlaneGeometry(1.2, 1.8)` carrying `assets/sprites/cosmo-hero-lora.png` as `MeshBasicMaterial({ map, transparent: true, alphaTest: 0.1, depthWrite: false, side: DoubleSide })`. Plane offset y=0.9 (matches old eye-line). New `rig.update(camera)` does Y-locked lookAt: `plane.lookAt(camera.x, plane.y+root.y, camera.z)` — billboards toward camera in XZ, never rolls.
- **`src/three/cosmoAnimDirector.ts`**: 446 → 224 LOC (−50%). Retired blink, head-track, antenna-bob (all needed bones). Surviving anims: idle-breath (root.scale.y pulse 0.4 Hz ±2%), walk-sway (plane.rotation.z ±0.03 rad — replaces disc oscillation), jump-arc (3-phase root.position.y + scale.y squash-stretch), climb (root.rotation.z = π/2). `AnimCtx` gains `camera: THREE.Camera` so the director can call `rig.update(camera)` at end of each tick.
- **`src/phaser/entities/CosmoAgent.ts`**: bone fields nulled, `FaceState` import + setFaceState removed, `tickAnimDirector(dt, motion)` → `tickAnimDirector(dt, motion, camera)`. Pet-affect kept as graceful event-hook no-op (host-side particle spew via onPet still works).
- **`src/main.ts`**: tickAnimDirector call (line ~373) now passes `cosmoStage.camera`. Cosmo-finisher's call placement preserved.

### Notes
- **The hero PNG is the canonical Cosmo.** It already exists, is already shipped, is already 10/10 DNA. We were trying to *recreate* it as 6 fragments instead of just *using* it. Brave reconsideration: sometimes the answer was already there.
- The 6 v2-final decals stay on disk at `public/assets/cosmo/decals/v2-final/` for rollback safety; no longer loaded by the rig. Cleanup is a Wave 22 hygiene step.
- **Lost capabilities**: head-track-toward-mouse, antenna-bob spring, blink. These needed bones we no longer have. Recovery options for future waves: (a) UV-parallax for a faint "Cosmo-looks-at-you" effect, (b) eyelid-overlay-plane that fades for blink, (c) pure 3D rebuild via Meshy v6 with proper UV-mapping for texture projection. None of these blocks shipping today.
- **CosmoAI's head-yaw / spine-bend directives** are accepted by `applyAI()` but no longer rendered (no surface). The API stays compatible; the visual effect is a future wave's job.
- **Substrate `behavior.ts` contracts**: `CosmoV2Rig` shape is mostly additive (root preserved); third-party authors who referenced dropped fields like `cosmo.head` need a CONTRIBUTING sweep eventually. Not blocking — substrate boots fine.

## [2.2.1] — 2026-05-05 — Wave 21.1: real Cosmo decals + /play/ chrome stripped

**Live UAT of v2.2.0 surfaced two failures programmatic UAT can't see.** The on-screen Cosmo was a green pill — the deterministic PIL-crop decal-pivot from Wave 21 (a budget-saver that took $0.30 instead of $8-15) produced flat-color regions, not painted decals. And `/play/` still wore Dutch marketing-chrome (Home / Het Verhaal / Updates) plus a version-pill plus a `0m` altitude counter, with the canvas pinched into a center column with black bars on the sides. NORTH-STAR §3 says the world breathes; chrome was breathing around it. Wave 21.1 retires both.

### Changed
- **All 6 Cosmo decals regenerated** via fal.ai Flux Pro + RTcosmo LoRA (Sprint 16A trained) at scale 0.45-0.65, with anatomical-study-sheet framing and 6-fold negative-prompt suppression to defeat the LoRA's whole-character bleed. Per-decal scores: eyes-l 9.7 / eyes-r 9.7 (PIL mirror) / mouth-neutral 9.5 / body-skin 9.5 / disc-suction 9.5 / antenna-flower 9.5. Total cost $5.11. **The DNA-spec was wrong about saffron-yellow antenna** — actual hero pixel is rose-pink #bc665c; the regen color-anchored from the hero, not the spec, and the antenna now reads rose-pink as in the canonical 1992-DNA painting.
- **`/play/` chrome fully stripped** — `<nav class="hud-nav">` deleted (Dutch nav was an artifact of the marketing era), `<span class="hud-version">` deleted, `lang="nl"` → `lang="en"`, title rewrite to `Cosmo's Universe — play`, all Dutch UI copy translated, ~50 LOC of `.hud-nav` / `.hud-version` CSS removed including responsive breakpoints. Defensive `width: 100vw; height: 100vh` on play-shell + canvases to eliminate the black-bar pinch.
- **JS-injected chrome killed at source** — `CosmoScene.buildHUD()` retired (it injected the `0m` altitude counter and a 4-second cosmos-version-pill flash on boot via direct DOM `appendChild`). Both gone. The play surface is now full-viewport game; close the tab to leave.

### Notes
- **Crop-shortcut retired** per NORTH-STAR §6 pivot ledger 2026-05-05. Sunk cost is not an argument; the LoRA whole-character bleed is solvable, not avoidable. Strategy stack documented in `cosmo_decals_wave21_1.md` for future LoRA-organ-decal sprints.
- **The visual-UAT gap** — Wave 21 shipped programmatic-UAT-green and was visually wrong. Programmatic UAT proves bytes arrived; it cannot prove bytes paint correctly. Future visible deliverables end on real visual UAT.
- Substrate behind `?substrate=v2` flag still — cutover to default deferred until visual UAT of v2.2.1 confirms the painted Cosmo + clean canvas land.

## [2.2.0] — 2026-05-04 — Substrate v2: Universe→Area→Room running infrastructure

**Wave 21 — the substrate is alive.** What was a Universe→Room contract sketch is now a running Universe→Area→Room runtime. The forest is fully implemented as the canonical reference. Cosmo is on his finished decals (DNA-locked from the Sprint 16A canonical hero) with a 7-anim procedural director (idle-breath / blink / head-track / antenna-bob / walk / jump-arc / climb).

The substrate ships **behind a feature-flag** (`?substrate=v2`) so this release is non-breaking — `/play/` continues serving the legacy path verbatim. Cutover to substrate-as-default is reserved for a follow-up release after live UAT.

### Added
- **`src/substrate/`** (1,895 LOC, 21 files) — `SubstrateLoader` → `UniverseHost` → `AreaHost` → `RoomHost` runtime per the brainstorm `wave21/01-substrate-architecture.md` design. Three transition tiers: Room↔Room biome-blend (reuses BiomeManager via new `startMoodCrossfade()` API), Area↔Area gradient-cut shader, Universe↔Universe portal (reuses NebulaPortal). Five default drivers (Background/Arrival/Inhabitants/Interactables/Audio) so a JSON-only Universe ships a working experience without writing `behavior.ts`. Hand-rolled validators with dev=lenient / prod=strict split.
- **`AREA-AUTHORING.md`** + **`ROOM-AUTHORING.md`** — new authoring docs alongside the rewritten `UNIVERSE-AUTHORING.md`. Each tier ships with a paste-in-Claude-Code quickstart appendix.
- **`universes/forest/areas.json`** + **`behavior.ts`** (590 LOC) — the forest goes from skeleton to fully working reference. All five optional `UniverseBehavior` exports implemented: `background` (extracts ParallaxScene), `arrival` (saffron portal, hue 0.62), `inhabitants` (eyeball-sentry, mouth-pillar, breathing-portal, floating-star), `interactables` (the trampoline, in clearing only, primary delight loop), `transitions.roomToRoom` (mushroom-path).
- **`src/three/cosmoAnimDirector.ts`** (446 LOC, 7 procedural anims) — wired through `CosmoAgent.tickAnimDirector()` and called per-frame in `main.ts`. Layers on top of state-machine + `applyAI` output. Runs in both legacy and substrate paths so Cosmo behaves identically regardless of which boot fired.
- **`public/assets/cosmo/decals/v2-final/`** — six finished Cosmo decals (eyes-l, eyes-r, mouth-neutral, body-skin, disc-suction, antenna-flower). DNA-locked via deterministic PIL crop from the Sprint 16A canonical hero (`cosmo-hero-lora.png`, 10/10 DNA). Eye-region smear from v1.5.2-era is gone. Total fal.ai cost for the decal sprint: $0.30.
- **`NORTH-STAR.md` §6 pivot ledger** entry 2026-05-04 documenting the Area-layer surfacing, hybrid contract, layered transitions, and feature-flag rollout decisions.

### Changed
- **`UNIVERSE-AUTHORING.md`** — rewritten for hybrid contract (JSON spine + optional `behavior.ts`) and Area layer. Backwards-compatible: existing universes load (missing `area` field on rooms falls back to `manifest.defaultArea`).
- **`universes/forest/manifest.json`** v1.0 → v1.1 — adds `behaviorModule: true`, `defaultArea: "the-mushroom-stand"`, `post.preset` + `intensityCurve`. Asset paths kept as `../../public/...` via PreloadManager allowlist (migration to `universes/forest/assets/` is Wave 22).
- **`universes/forest/rooms.json`** v1.0 → v1.1 — adds `area` field per room, `cameraBounds`, `biomeKey: "slow-bloom"`.
- **`src/three/biomeManager.ts`** — additive: `startMoodCrossfade(from, to, durationS): Promise<void>` API for substrate-driven crossfades that don't need to be in the BIOMES registry. Existing API untouched.
- **`src/three/parallaxScene.ts`** — adds `destroy()` for substrate-tier disposal.
- **`src/three/cosmoV2.ts`** — split decal planes (eyeDecalL/R + mouthDecal independent for blink animations), new `v2-final` decal paths. Re-exports `CosmoState` for substrate import-path normalisation.
- **`src/main.ts`** — `?substrate=v2` URL flag branches into `SubstrateLoader.boot()`. Default branch (no flag) keeps the existing ParallaxScene-direct boot verbatim, including `cosmoAgent.tickAnimDirector(dt, motion)` in the per-frame loop.

### Notes
- **Visual UAT pending**: programmatic UAT (TSC clean, `npm run build` clean, dev-server curl smoke tests on all three manifest endpoints, bundle marker inspection) all green. Browser-based visual verification is on the live `/play/?substrate=v2` URL after this deploy lands.
- **Cutover deferred**: legacy `/play/` and substrate `/play/?substrate=v2` coexist. Cutover (delete legacy branch, substrate becomes default) lands in a follow-up release once live UAT confirms parity.
- **Wave 22** scope: first non-forest Universe to prove the substrate from outside, plus optional polish (spore-mote transition overlay, asset-path migration to per-universe `assets/` dirs, `InhabitantHandle.anchor` field for proximity-AI).

## [2.1.1] — 2026-05-03 — Remove the support route

This isn't about money. The /support/ page existed when this was a game-marketing project. Now that it's an open-substrate, asking for money on the homepage signals the wrong thing — it puts a transaction-frame on something that's about co-authorship, not patronage.

### Removed
- **`/support/` page**: replaced contents with a noindex meta-refresh redirect to `/`. Same pattern as the `/press/` retirement in Wave 19a.
- **"Support" / "Steun" nav-links** stripped from all 4 portal pages (root index, /lore/, /thanks/, /play/ HUD-nav).
- **GitHub Sponsors slot** mentioned in 2.1.0 — never lived; the substrate doesn't take money.

Contributions happen via GitHub PRs, not patronage. INTEGRATIONS.md already documents the actual paid-service costs ($10-15 lifetime, modest) for full transparency. If a contributor wants to mirror integrations / scripts in their own fork, they can. We're not a marketplace.

## [2.1.0] — 2026-05-03 — Portal redesign: substrate-positioning, English-first

**The live portal at theuws.com/games/cosmos-2026/ is now 100% aligned with the GitHub README framing.** Visitors landing from LinkedIn/Bluesky/X — including any Claude-paired developers whose agents read the page — meet a substrate, not a Dutch game-pitch.

### Changed
- **`/index.html`** — full rewrite per `.claude/brainstorm/wave20b/01-portal-redesign.md`. English-first. Hero with `hero-cosmo-in-forest.jpg` background + tagline + two CTAs (Play live / View on GitHub). Quickstart panel with copy-button code-block (vanilla JS clipboard write, no deps) — the literal paste-into-Claude-Code prompt as page's centerpiece. Three-card "What this is" grid. 3-image visual gallery. Three-path "How to join" matrix. Brand contract section with palette swatch. Footer with 11 documented-doc links. Updated JSON-LD to substrate positioning (`audience: Claude-paired developers`, `inLanguage: en`, MIT license). ~824 words body copy. Mobile-first.
- **`public/lore/index.html`** — Added English `<aside lang="en">` summary block above the Dutch poem (50-70 words, italic-prose, frames the page as a watercolor of a 1992 memory). Dutch poem kept verbatim. Nav aligned to portal (Home / Story / Updates / Support / GitHub).
- **`public/support/index.html`** — Added English intro framing "open-source MIT, support the substrate". Added GitHub Sponsors slot (`aria-disabled` placeholder until set up). Renamed `Episode Patron` → `Universe Patron` with ROOM/AREA/UNIVERSE vocabulary from NORTH-STAR §3. FAQ first answer rewritten to substrate framing.
- **`public/thanks/index.html`** — Added top English line "Thank you. Cosmo wandered a little farther because of you." Aligned nav.

### Removed
- `index.html` world-grid (3 biomes), numbers-grid (10/12/1/8), about-strip, `/prd/` link, Dutch hreflang, "Een aquarel-trip..." tagline (migrated to footer easter-egg).

### Added
- `public/showcase/` directory with 5 README-aligned images (Implementer-A's unilateral call: copies of `docs/showcase/*.jpg` placed in Vite's public root so they ship to dist).

## [2.0.1] — 2026-05-03 — CosmoV2 proportion fix (away from green-pill)

### Fixed
- **CosmoV2 proportions**: live UAT showed Cosmo as a tall green capsule pill with disproportionately small head and discs floating behind the body. Tuned `cosmoV2.ts` geometry constants — body capsule 0.45/0.9 → 0.30/0.45 (shorter + thinner), head sphere 0.5 → 0.55 with Y-squash 0.92 → 0.85 (more pearl-drop), head.position.y 1.15 → 1.05 (overlaps body-top to hide collar seam), antenna shaft thicker (0.022 → 0.025) + longer (0.25 → 0.28), antenna bulb 0.07 → 0.10 with smoother segs + brighter emissive, discs 0.18 → 0.22 repositioned to (-0.55, 0.55, 0.35) and (0.55, 0.55, 0.35) so they read as hand-tip pads in front of the body silhouette, face decal 0.85×0.55 → 0.95×0.65 + slight z-bump to fit larger head. Pure parameter tuning — no architectural change.

## [2.0.0] — 2026-05-03 — Wave 20a: Cosmo v2 hybrid rebuild + open substrate

**Major milestone**: the project pivots from "a game" to **a substrate** that any Claude-paired developer can plug a Universe into. *Your Cosmo can visit my forest. My Cosmo can visit your world.* See `NORTH-STAR.md` for the full charter.

### Added
- **`src/three/cosmoV2.ts`** — primitive-skeleton rig (capsule body + sphere head + antenna + face-decal + free-floating discs) replacing the broken Meshy-imported GLB. 360° rotation, scale, jump-arc, climb all wired. ~270 LOC.
- **`NORTH-STAR.md`** — project charter (vision, brave-reconsideration principle, pivot ledger, working method). Living document; read first.
- **`UNIVERSE-AUTHORING.md`** — technical contract for external Universe authors (4 required artifacts: background renderer, room-list+traversal graph, asset manifest, Cosmo-arrival hook).
- **`CONTRIBUTING.md`** — fitness-check + 4 honest entry-paths for new contributors.
- **`INTEGRATIONS.md`** — full transparency on every paid service, current pricing, per-sprint costs, reusable scripts.
- **`LICENSE`** — MIT.
- **`README.md`** — rewritten in English with paste-in-Claude-Code quickstart, multilingual welcome, three contribution paths.
- **Cosmo v2 decal asset set** in `public/assets/3d/v2/` — 4 painted face decals (`cosmo-face-neutral.png`, `cosmo-face-coo.png`, `cosmo-face-blink.png`, `cosmo-face-wave.png`, all 512×512 RGBA), 1 tile-friendly body skin (`cosmo-body-skin.png` 512×512 RGB, mirror-blended from `cosmo-hero-lora.png` torso), 1 suction-cup disc (`cosmo-disc-suction.png` 256×256 RGBA). Faces generated via Flux Dev + LoRA `rtcosmo` + BiRefNet remove-bg pass; disc via Recraft V3 + BiRefNet; body-skin and blink-eyelids via deterministic Pillow paint (LoRA's bulging-eye DNA refused to close eyes across 3 retry seeds). Total $0.265 of $1.00 budget. Generation pipeline lives in `scripts/wave20a/`. Report: `.claude/brainstorm/wave20/02-decal-gen-report.md`.

### Changed
- **`src/phaser/entities/CosmoAgent.ts`** — `kickOffGLBLoad()` → synchronous `buildCosmoV2()` build in constructor. `headBone`/`antennaBone`/`spineBone` now point directly at v2Rig nodes (no traversal). Cutover hard.
- **`package.json`** — `private: false`, `license: MIT`, repository + homepage fields added.

### Removed
- **`fixSkinWeights()`**, **`makeFallbackRoot()`**, **`disposeFallback()`**, **`resolveHeadBone()`**, **`resolveAntennaBone()`**, **`cacheBodyMaterials()`**, **`resolveSpineBone()`**, **`debugRigYawSweep()`** — all GLB-rig-specific helpers retired with the cutover. ~250 LOC removed.
- **`THREE.AnimationMixer` + GLB clip wiring** — `playClip()` calls remain but are no-ops until Wave 20b's `CosmoAnimDirector` lands.
- **GLTFLoader import + `assetPath` import** — no longer needed in CosmoAgent.

### Known limitations (Wave 20b will fix)
- No procedural idle-breath / blink / walk yet — Cosmo is a still being who turns his head.
- Pet-affect saffron-blush tint disabled (was tied to traversed body materials; v2's shared `skinMaterial` needs a different approach).
- Trampoline jump-arc, climb-state, lip-sync via face-state swap are scaffolded in cosmoV2.ts but not yet wired through CosmoAgent.

## [1.5.2] — 2026-05-03 — Wave 19a hotfix #2: invert weight-redistribution

### Fixed
- **Cosmo's gezicht/ogen verdween na v1.5.0/v1.5.1**: het oorspronkelijke `fixSkinWeights()` zero'de de `bone_head`-slot weight en gaf alle weight aan `bone_eye_l/_r` — maar die eye-bones zitten op armature origin (0,0,0), NIET op gezichtshoogte. Resultaat: face-shell verts werden naar origin getrokken, zwart gat in gezicht + zwarte discs op kin/grond-niveau (zichtbaar in user-screenshot v1.5.1). **Inversie**: zero NU de eye-bone slots, redirect alle eye-weight naar `bone_head` (die wél op gezichtshoogte zit). Face-shell volgt rigide het hoofd. Eye-bones zijn na deze redirect decoratief (geen weight meer op enige vert). `eyeFrameCopyEnabled` flag uitgezet (overbodig). Verwacht ~1621 verts gemodificeerd (1519 bleed + 102 clean eye-shell).

## [1.5.1] — 2026-05-03 — Wave 19a hotfix: rig-fallback (frame-copy quaternion)

### Fixed
- **Eye-spheres geplaatst op chin-level na reparent**: live UAT v1.5.0 toonde dat `bone_head.attach(eye_l/_r)` de eye-bones fysiek verplaatste naar verkeerde positie omdat de inverse-bind matrices tegen `cosmo_armature` waren gebakken (open Q #2 uit `01-rig-diagnosis.md` bevestigd). Resultaat: zwarte druppels onder gezicht. **Fix**: `USE_REPARENT = false` in `CosmoAgent.fixSkinWeights()` activeert de frame-copy fallback — eye-bones blijven op armature-space rest-pose, hun quaternion wordt elke frame gekopieerd van `bone_head` in `applyAIBoneHints()`. Weight-bleed (1519 verts → head-slot zeroed) blijft actief.

## [1.5.0] — 2026-05-03 — Wave 19a: rig fix + lore-pivot (no more Apogee-spoof)

### Fixed
- **Cosmo's "melting alien eyes" tijdens head-pan**: weight-bleed tussen `bone_head` en `bone_eye_l/_r` op **1 519 face/eye verts** (near-50/50 split, gediagnosticeerd in `.claude/brainstorm/wave19/01-rig-diagnosis.md`) zorgde voor face-shell shearing wanneer `applyMotion` + `applyAIBoneHints` de head-bone yaw'den. De eye-bones zaten bovendien als siblings van `bone_root` direct onder `cosmo_armature`, dus head-rotatie propageerde niet naar de ogen. **Fix in `CosmoAgent.fixSkinWeights()`** (post-load helper, GLB asset NIET aangepast): walks `geometry.attributes.skinWeight` + `skinIndex`, zero't de `bone_head`-slot weight op alle bleed-verts (`headW > 0.1 && eyeLW + eyeRW > 0.3`), renormaliseert de overgebleven 3 weights naar sum=1, en reparent `bone_eye_l/_r` onder `bone_head` via `bone_head.attach()`. Frame-copy quaternion fallback (`USE_REPARENT = false`) ligt klaar voor het geval IBM's tegen `cosmo_armature` zijn gebakken (open Q #2 uit diagnosis). Debug yaw-sweep beschikbaar via `window.__debugRigYawSweep()` in devtools voor visuele QA. (`src/phaser/entities/CosmoAgent.ts`)

### Changed (lore)
- **Marketing-pages herframed** rond Wave 19 Life System + companion-realiteit. Hero-tagline → "Een aquarel-trip die zichzelf voortzet als jij stilzit." Pitch-paragraaf vervangen door "Hij ademt. Hij wandelt. Als jij niets doet, blijft hij niet stilstaan."
- **`index.html`**: JSON-LD `description` + `alternateName` opgeschoond. Meta-pills "10 Levels — MVP" en "Three.js + Phaser 4" → "Life System (Wave 19)" en "Motion-controlled". World-grid `L1-L10` tags weg. Footer Apogee-credit en "Phaser 4" weg (Three.js-only).
- **`public/lore/index.html`**: Funplex / Zonk / komeet / motorklep-plot vervangen door 146-woorden backstory snippet (Cormorant-italic). Biome-secties stripped van level-tags en Apogee-mechanics (Hint Globes, scooter, cheeseburger, blob-fight). Cast-grid (Brumberry/Hopper/Eye Plant/Blob) vervangen door Companion-grid (Cosmo / hallucination-particles / trampolines).
- **`public/press/index.html`**: complete press-kit vervangen door noindex meta-refresh redirect → `/lore/`.
- **`public/support/index.html`**: tier "Hint Globe Sponsor" → "Vibe Sponsor" (Suno-track of biome-particle-set sponsor). Tier "Bonus Room Builder" → "Hallucination Patron" (seasonal hallucination-event-pack). FAQ-item Apogee/3D Realms → "Is dit een drugsspel?" met eerlijk antwoord. ElevenLabs-where regel "Hint Globe voices" → "Companion-voices".
- **`public/thanks/index.html`**: "uit de grond van Zonk's mushroom-cream stronken" → "uit de aquarel-grond zelf". Tier-namen in bevestigings-tekst aangepast.
- **Logo/favicon swap**: alle pagina's wijzen nu naar `/assets/sprites/cosmo-hero-lora.png` (Sprint 16A canonical, post-LoRA DNA-correct) i.p.v. `cosmo-hero-cleaned.png`.

## [1.4.0] — 2026-05-02 — Sprint 18: smoothness + calm-baseline pass

**4-agent parallel pass** op user-feedback "interactie voelt nog niet smooth, Cosmo vervormt de hele tijd terwijl je een raar fluitje hoort". Audio + post-FX + gameplay + visual-coherence parallel gediagnosticeerd en gefixt.

### Changed
- **Post-FX calm-pass**: baseline gedempt — bloom 0.8→0.45, fluid amp 0.022→0.01, kaleido ambient 0.16→0, chroma offset gehalveerd, noise opacity 0.32→0.18. Bloom + chroma breathing sines gedecoupled zodat ze niet meer in lockstep pulsen. World ademt nu zacht, weirdness komt op event-pieken.
- **TrippyEventDirector** cadence 8-15s → 18-30s, cooldown 4s → 12s. Events voelen nu als verrassingen i.p.v. constante achtergrondruis.

### Fixed
- **Audio**: `audioFFTBridge` placeholder synth (triangle/saw + LFO + filter sweep) verwijderd — was hoorbaar als "raar fluitje" wanneer de Suno-track niet startte. Vervangen door een stille buffer-source die de FFT-floor op 0 houdt zonder geluid te produceren.
- **Gameplay smoothness (17G)**: Gyro raw-input deadband — sub-deadband phone-on-table noise schrijft niet meer naar `rawPanX/Y`. In plaats daarvan decayen de raw waarden 8% per event richting 0. Elimineert zichtbare camera-jitter wanneer de telefoon stilligt zonder companion-drift te raken. (`src/core/motionController.ts`)
- **Gameplay smoothness (17G)**: `CosmoAI.paused` flag + onboarding-lockstep. OnboardingDirector hooks (`showAwaitTouchUI`, `pauseObstacleSpawn`, `resumeObstacleSpawn`, `startCosmoWalk`, `spawnCosmoSkipPortal`) flippen nu zowel `cosmoAgent.paused` als `cosmoAgent.ai.paused`. Voorkomt dat de 8s companion-mode-timer al loopt vóór de eerste gesture en dat AI random-events / sleep-progressie tijdens portaal-opening doortikken. (`src/phaser/entities/CosmoAI.ts`, `src/phaser/scenes/CosmoScene.ts`)
- **Gameplay smoothness (17G)**: `mixer.timeScale` clobber-bug. CosmoAI's slow-breath sleep-state (target 0.4×) werd elke frame overschreven door `CosmoAgent.update`'s FFT-driven `mixer.timeScale = 1 + air * 0.1`. `applyAI` schrijft nu naar een nieuw `aiTimeScaleBase` veld dat `update()` vermenigvuldigt met de FFT-factor. Sleep is nu daadwerkelijk slow-breath; non-sleep states keren netjes terug naar 1.0× via een 5% lerp. (`src/phaser/entities/CosmoAgent.ts`)

### Documentation
- **`cosmoStage.ts`**: complete render-pipeline trace + invariant comment toegevoegd zodat toekomstige agents niet per ongeluk Cosmo door de post-FX composer pipen (DNA-lock breekt anders). Defensieve `setRenderTarget(null)` in `render()` toegevoegd; verifieerd dat post-FX (fluid/kaleido/chroma/bloom) Cosmo niet raakt — perceptie van "Cosmo vervormt" komt van chroma fringe + bloom halo van parallax-pixels rondom hem (post-fx baseline al gekalmeerd).

## [1.3.0] — 2026-05-02 — Sprint 17: motion-controlled world explorer + companion-mode

**Gameplay-shift**: weg van runner ("ren naar rechts"), naar **motion-controlled world explorer + stoned-watching companion**. Cosmo blijft center, wereld scrollt NIET. Camera pant binnen biome-scene op gyro/mouse. Trampolines op fixed posities zijn enige interactie. 8s no-input → companion-AI neemt over, Cosmo wandelt zelf rond, kijkt, zit, slaapt na 90s met hallucination-particles. Embrace the weirdness.

### Added (17A — Cosmo handmade-rig)

GLB rig (10 bones, 4 anim clips, 22k tris, 10MB):
- `bone_root/spine/head/eye_l/eye_r/antenne/arm_l/arm_r/disc_l/disc_r`
- Distance-based weight-painting met head-zone-lock + arm-zone-lock
- 4 NLA clips → glTF: idle (4s loop, breath-pulse + blink), wave (1.5s arm-raise + slow eye-lock), stretch (2s arms overhead + spine arch), sit (6s squat + sniff-twitch)
- Mesh hergebruikt van Sprint 16B (geen nieuwe Meshy run, voorkomt LoRA-tail-drift in 3D)

**Caveat**: 4 LoRA-pose-PNGs gegenereerd MAAR DNA-drift terug naar gecko-archetype met tail+fingers (LoRA training-dataset bevatte tail-references). Skip de 2D-PNGs als asset, gebruik alleen GLB met embedded animation clips. Sprint 18 ticket: retrain LoRA op disc-only/no-tail dataset. Cost $1.08.

### Added (17B — DeviceOrientation motion-control)

`MotionController` met 4-source priority (companion-drift > gyro > pointer > none):
- iOS 13+ `requestPermission()` op first-touch (eenmalig)
- gyro mapping: gamma → panX (-1..1, /45°), beta → panY (-1..1, neutral 45°)
- Magnitude < 0.04 = phone-op-tafel-noise-gate
- Desktop pointermove fallback always-on
- **Companion-drift**: na 8s no-input → `panX=sin(t·0.21)·0.6`, `panY=sin(t·0.18)·0.4` (non-rationele freqs, geen sync-loop)

`CosmoStage.followCamera` (runner-volgende-camera) → `panCamera(motion, dt)` (camera pant binnen biome-bounds ±1.6 X / ±0.6 Y). Cosmo.worldX locked op 0 (geen scroll meer). Head-track via bone-search "head"/Mixamo: `restQuat · yaw(Y, ±0.4) · pitch(X, ±0.2)` na mixer.update().

### Added (17C — Composed worlds, 25 layered PNGs)

Per biome 5-7 transparante PNG-layers via Flux Pro Ultra (1024×1536), BiRefNet HEAVY 17/17 clean cutout via `BG_BLACK_FOR_BIREFNET` rider:
- **slow-bloom** (7 layers): twilight forest met giant pink mushroom + jellyfish creature. Weirdo 9/10
- **inkpool** (6): bioluminescent cave met crystal-spires. Weirdo 8/10
- **cathedral** (6): bloom-pierced temple met body-horror multi-wing angels. Weirdo 9/10
- **boss** (6): saffron-magenta storm met disembodied gaping mouths + uncanny eyes. **Weirdo 10/10**

`composition-spec.json` per biome met `parallaxMultiplier`, `xOffset`, `yOffset`, `scale`, `zPosition`, `blendMode`, `opacity`, `role`. First-pass 24/25 (96%). Cost $1.90.

### Added (17D — Trampolines + pet-Cosmo)

`TrampolineSpots`: per biome 3-5 fixed posities uit `composition-spec.interactionSpots.trampolines`. Hover-bob met phase-offset (geen sync-loop). THREE.Raycaster pick op tap-NDC.

`CosmoAgent.walkTo(x, z, 'bounce')`: 1.5s ease-in-out cubic naar trampoline → `bounce()` → playClip('stretch') + sin-arc 0→0.6→0 over 0.8s. On bounce: kaleidoTrigger += 0.6 + 30% kans `audioBridge.startHallucination(HALLUCINATION_PEAKS)`.

`petAffect()` long-hold-Cosmo (500ms threshold, raycaster check op Cosmo bounds): 0.8s window met blush (saffron emissive lerp) + antenne-bone tilt ±0.35rad over 2 sine cycles. Op release → wave-clip.

VibeMeter triggers: 5 bounces in 30s OR ≥2s cumulative pet → DeepTripMode auto-engage.

`ObstacleManager` als compat-shim (alle public API behouden, update() no-op). Runner-spawn-pool definitief weg.

### Added (17E — Companion-AI passive vibe)

`CosmoAI` 7-state machine: `idle | roam | curious | sit | look-around | sniff | sleep`.

Triggers:
- 8s no-input → companion-mode (kaleido bloom-pulse 0.18)
- 90s no-input → sleep latch (pulse 0.45)

Transitions weighted: roam 35% / curious 18% / sit 17% / look-around 18% / sniff 12%. Sub-phases voor curious (approach→inspect→wave→leave) en sniff (approach→dip→leave).

Sleep-state hallucination-particles: lazily-built `THREE.Points` 24 particles, radial-falloff canvas-drawn texture (geen asset), pop-magenta+saffron, AdditiveBlending, drift+recycle.

Mixer-coupling: per frame `playClip(d.clip, loop)` met 180ms crossfade. `mixer.timeScale` lerp naar 0.4 (sleep) of 1.0. Position-chase met biome-bounds clamp X±1.6 / Z-4..0.

Soft-coupling met 17D's `trampolineSpots.positions()` als interaction-targets-provider voor curious-state.

### Added (17F — Multi-layer parallax-scene + decoration placement)

`parallaxScene.loadBiome(biome)` refactored van single-4K-plane naar N-layer composition consumer:
- Per layer: `mesh.position.x = baseX + motion.getPanX() * parallaxMultiplier * 1.6`
- BlendMode mapping: additive / multiply / normal
- Texture cache prevents re-fetch on biome-cycle

Per biome 3 environmental decoration objects geplaatst (uit Sprint 15C library):
- **slow-bloom**: upside-down-tree + eyeball-sentry deep right + floating-star
- **inkpool**: breathing-portal + melting-clock-bubble drift + eyeball-sentry
- **cathedral**: breathing-portal skybox + upside-down-tree top-hang + floating-star
- **boss**: secret-crystal hidden + mouth-pillar + eyeball-sentry

mouth-pillar pingpong-frame (Sprint 16C compat) + secret-crystal hidden tot kaleidoTrigger > 0.8 (Sprint 16E compat) behouden.

### Pre-deploy live-test (17G)

Combined `tsc --noEmit` exit 0. Build 521 files in /tmp staging. Vite preview boot test alle 6 critical assets 200 OK (HTML, GLB, composition-spec, layer-PNG, music, cosmo-coo). 0 TODO/FIXME in alle 10 src-files. Code-review groen.

### Cost Sprint 17

~$3 totaal (17A: $1.08 LoRA-poses + Blender-rig + ESRGAN, 17C: $1.90 25 layered PNGs + BiRefNet).

### Open voor Sprint 18

- LoRA retrain op disc-only/no-tail dataset (huidige LoRA reactiveert tail-bias bij pose-variation)
- DRACOLoader integratie → GLB 10MB → 752KB
- Biome-cycling auto elke 90s via crossfade (deels ge-implementeerd, full DeepTripMode auto needs CosmoScene exposure)
- ElevenLabs custom voice library uitbreiden (meer cosmo-coo + biome-specific stingers)

## [1.2.0] — 2026-05-02 — Sprint 16: DNA-correcte Cosmo via LoRA + 6 polish-fixes

v1.1.0's live demo was niet speelbaar: PIL-painted 2D-eyes werden 3D-blobs op de mesh, NL voice-over uit Hint-Globe-archief brak de vibe, mouth-pillar toonde 4 frames tegelijk, secret-crystal default zichtbaar, music stopte na track-end, onboarding skipte voor return-users. Sprint 16 fixt alles met **harde quality-gate**: orchestrator draait nu zelf pre-deploy live-test (browser-MCP playwright iPhone-emulation indien Docker UP, anders curl + tsc + GLTF-headless validate) — geen "live verify door user" meer als enige check.

### Fixed (16A — Cosmo-LoRA fine-tune, eindelijk DNA 10/10)

**6-sprint-blokker eindelijk opgelost.** Flux LoRA training op 10 hand-curated DNA-correct images:
- Endpoint: `fal-ai/flux-lora-fast-training`, 2000 steps, trigger word `rtcosmo`
- Re-usable LoRA URL bewaard in memory voor toekomstig hergebruik
- Hero gen via `fal-ai/flux-lora` met LoRA + ESRGAN 4× → `cosmo-hero-lora.png` 4096² RGBA
- DNA-checklist **10/10**: pearl-drop [x], chameleon bulging eyes [x], geen blozende wangen [x], single antenne+flower [x], **two clean black flat suction-cup discs** [x] (organisch, geen PIL-paint workaround), faded-rose spots [x], no tail [x], no vinger-handen [x], watercolor + paper-grain [x], slight uncute [x]
- Halo fringe 14.3px (Sprint 14A was 24px — verbeterd)
- Cost ~$3-5 (training + 10 generation attempts + ESRGAN). Recoupt na ~10 toekomstige Cosmo-renders ($0.05 via LoRA vs $0.45 via PIL-painting)

**Memory-leering**: canonical-v2's kawaii-eye-bias propageerde door 5B/6A/7A/11A/13D/14A. LoRA bakt DNA in model-weights → permanente fix. PIL-paint workarounds zijn nu deprecated.

### Fixed (16B — Cosmo 3D rebuild met clean LoRA-input)

Sprint 15A's `cosmo.glb` (image-to-3D vanaf canonical-v2 met PIL-painted eyes) renderde off-brand in 3D — de 2D-paint werd 3D-blobs op de mesh-surface. Hypothese in screenshot bevestigd via side-by-side compare.

Nieuwe pipeline met 16A LoRA-Cosmo als input:
- Meshy v6 image-to-3D, 2 art_style attempts (realistic vs sculpture)
- Winner 16B-A realistic: 22k tris, 15137 verts, 10.08MB raw GLB
- **3D bulging eye-spheres als geometrie** (NIET 2D-blob)
- Suction-cup discs als floating disc-meshes
- DNA 7/8 (alle behalve "watercolor texture" — Meshy PBR is mild plastic, acceptabel)
- Cost $0.60

Draco-compressed 752KB versie ALSO geleverd in case-study, maar engine heeft geen DRACOLoader → ship raw 10MB voor compat. **Toekomstig ticket Sprint 17**: voeg DRACOLoader toe → 13× kleiner zonder visual diff.

Pre-deploy live-test via `p8_live_test.mjs` (headless GLTFLoader): mesh.geometry intact, polycount binnen tolerance, verts=15137, tris=21978 → SHIP.

### Fixed (16C — Mouth-pillar single-frame ping-pong)

Live screenshot toonde 4 monden tegelijk. Fix: per-spawn-geklonen texture met `repeat.set(0.25, 1) + offset.x = frame * 0.25`. Ping-pong cycle `0,1,2,3,2,1` over 4s @ 92BPM = closed → quarter → half → open → half → closed. Alle live mouths breathing in lock-step via `audioBridge.musicCurrentTime()` (drift-vrij). Geen custom shader nodig.

### Fixed (16D — ElevenLabs gibberish-coo + audio-loop hardened)

NL voice-over uit Hint-Globe brak de vibe. Vervangen door 3 ElevenLabs Sound-Generation varianten:
- `cosmo-coo-1.mp3` (3-syllable nonsense babble)
- `cosmo-coo-2.mp3` (4-syllable melodic)
- `cosmo-coo-3.mp3` (ascending 3-tone gurgle)
- 0.9-1.2s elk, 128kbps stereo
- `COSMO_COO_POOL` random-pick in `CosmoScene.playGibberishCoo`

Audio-loop bug: `audioFFTBridge.createStreamedTrack` had al `audioEl.loop = true` (Sprint 9-fix). Defensief in `BiomeManager.notifyTrackEnded()` no-op'd met expliciete jsdoc dat het NOOIT advance() mag triggeren. Cycle nu enkel via `requestPlayerSwitch()` (long-hold-3s).

Cost: $0.20 ElevenLabs.

### Fixed (16E — Spawn-balance + secret-crystal hidden)

Live screenshot toonde te dichte spawns + crystal default-zichtbaar:

| Param | Was | Nu |
|---|---|---|
| Fallback spacing | 1.6-2.4s | 2.4-3.8s |
| Beat-loose period | 4 beats | 6 beats (~4.2s) |
| Tall cooldown | — | 8.0s |
| Max same-id run | — | 2 (re-pick op 3e) |
| Crystal threshold | — | kaleidoTrigger > 0.8 |
| Trampoline weight (low) | 50% | 40% (60% star) |

`pickWeighted()` cumulative selection. Gap-pool dynamisch: crystal append (weight 30) alleen als post-FX peak. Statistische sim: 18 spawns/60s, 44.5% trampoline-aandeel, crystal 8% bij k=0.9, max-same-id-run 2 ✓.

### Fixed (16F — Onboarding force-show + version-reset)

Sprint 15D's localStorage flag blokkeerde portal-arrival voor return-users. Fix:
- Nieuwe state `MINI_FLASH` (0.6s) tussen AWAIT_TOUCH en WALKING_FIRST_HINT
- Priority: `?onboard=1` URL > `opts.skipPortal` > LS read
- LS upgrade naar JSON `{version, completedAt}`. Legacy `"true"` string treated as old-version → reset
- `ONBOARDING_VERSION = 'v1.2'` bump invalideert alle stored completions
- 35/35 deterministic state-machine tests pass

### Added (16G — Pre-deploy live-test protocol)

`.planning/v1.2-pre-deploy-checklist.md` met **STOP-conditions**: DNA-incorrect Cosmo / NL voice / music drop-out / 4-monden / crystal default / console errors / FPS<30 → geen deploy. Orchestrator draait test ZELF, niet via user.

### Cost Sprint 16

~$4 totaal (16A: $3-5 LoRA training + gen + ESRGAN, 16B: $0.60 Meshy x2, 16D: $0.20 ElevenLabs).

### Open voor Sprint 17

- DRACOLoader integratie → swap raw GLB naar 752KB Draco asset (13× kleiner)
- Per-biome obstacle-pool variations (boss-biome krijgt eigen weirdo-set)
- Cosmo-LoRA pose-variation: 6 walk/jump/cling frames via LoRA + procedural skeletons
- ElevenLabs custom voice library: meer cosmo-coo + biome-specific stingers

## [1.1.0] — 2026-05-02 — Sprint 15: 3D Cosmo + weirdo auto-runner

GROND-UP gameplay-rebuild #2. Pivot van rhythm-trip naar **weird auto-runner met agency** — Cosmo loopt door een 3D-scene op de muziek, speler begeleidt met swipes/taps, Cosmo heeft eigen agenda (negeert input 20% v/d tijd, knipoogt zomaar, loopt achteruit). Geen game-over. WEIRDO-energy expliciet ingebakken: niet een speelervaring waarin de speler de baas is over een schattig wezen, maar één waarin een eigenaardig wezen JOU laat meelopen in zijn dag.

### Added (15A — Meshy 3D Cosmo)

- `public/assets/3d/cosmo.glb` — image-to-3D vanaf Sprint 14A canonical-v2 (de PIL-painted-eyes versie). 9/10 DNA-correct: pearl-drop ✓, chameleon-eyes met saffron crescent ✓, antenne+rose-flower ✓, faded-rose spots ✓, no tail ✓, uncanny-vibe ✓. Suction-cups partial (residual claws boven discs).
- 22.5k verts, 8MB raw GLB, 3 PBR maps embedded (baseColor + normal + ORM).
- Cost $0.20 (van $3-5 budget).
- **Memory-leering**: Meshy auto-rig faalt deterministisch op alien anatomy (HTTP 422 op 4 parameter-varianten + 2 source-tasks). Pose-estimator is humanoid-trained. Workaround: procedural anim direct vanuit `cosmo-animation-spec.json` (idle-breath/walk/jump-up/jump-fall/cling/wave-uncanny). Skip AnimationMixer voor cleaner FFT-control.

### Added (15B — Weirdo gameplay-stack)

8 nieuwe files vervangen het rhythm-tap-systeem:
- `CosmoStage` (Three.js sub-renderer met PerspectiveCamera + lights + camera-follow met deadzone, rendered ON TOP van parallax via `autoClear=false + clearDepth`)
- `CosmoAgent` (GLB wrapper + state-machine + agency-RNG; 2D billboard fallback met `cosmo-hero-4k.png` tot GLB async loadt)
- `ObstacleManager` (pool 12, kinds low/tall/gap, beat-loose timing op `audioBridge.musicCurrentTime()` met 1.6-2.4s drift-fallback, `setObstacleFactory()` exposed)
- `InteractionManager` (gestures → CosmoAgent decisions + transient platform-meshes — trampoline torus + mushroom)
- `VibeMeter` (Phaser Graphics ring rond geprojecteerde screen-pos, 5%/s decay, full → DeepTripMode)
- `DeepTripMode` (5s post-FX peak + hallucination-track + dance)
- `CosmoScene` (Phaser is HUD-only nu)

**Agency-RNG tuning** (de WEIRDO-touch):
- 0.5%/frame @ 60fps = ~3.3s avg random event, 4.5s cooldown
- Distributie: 25% knipoog · 30% walk-backward · 30% eigen-jump · 15% petal-spew
- Action-commit: 80% op swipe, **50/50** op tap-jump-of-duck
- Decision-delay 120-280ms random
- **Geen "voorspelbare modus" toggle** — per brief verboden
- Failure (tall-obstacle collision tijdens niet-jumping) → forceFall 1.2s opacity-fade → respawn 1.5s 2-4 worldX vooruit, vibe -10%. Geen game-over.

### Added (15C — 8 weirdo objects)

Alle 8 fal.ai-generated, $1.85, geen code aangeraakt:

- **eyeball-sentry** 9/10 (chameleon-iris die volgt) — first-pass STANDOUT via Flux Pro Ultra
- **breathing-portal** 8/10 (adem-cycle saffron→magenta→cyan) — first-pass STANDOUT
- **organic-flesh-trampoline** 8/10 (ademende membraan, body-horror)
- **mouth-pillar-sheet** 8/10 (4-frame PIL-composite — single-image sheet bias unbreakable)
- **upside-down-tree** 7/10 (V4 success na 3 fails — drop noun, gebruik 3-zone shape-prompt)
- **melting-clock-bubble** 7/10 (Dali via "watercolor painting" lead-prefix)
- **secret-crystal** 7/10 (hidden tot post-FX kaleido > 0.8)
- **floating-star** 5/10 (collectable +5 vibe-meter)

**Memory-leerings**:
- Sprite-sheet symmetry-bias unbreakable: diffusion kan GEEN sequential-animation-states in één image renderen → 4 separate calls + PIL composite is werkende patroon
- Sample-bias rond bekende nouns: drop het noun, beschrijf 3 SHAPE-zones — transferable
- Flux Pro Ultra forceert photo-aesthetic op organische subjects; Flux Dev pliabler voor stylized watercolor + body-horror

### Added (15D — Onboarding magic-moment)

3-second hook met WEIRDO-energy:
- `OnboardingDirector` state-machine: AWAIT_TOUCH → PORTAL_OPENING (1.5s) → COSMO_ARRIVING (1.5s) → BONDING (1.0s) → WALKING_FIRST_HINT → COMPLETE
- `NebulaPortal` (Phaser canvas-drawn, 6 concentric rings, ease-out-cubic radial expand, palette saffron→faded-rose→ink-aubergine, per-ring breath + lichte rotation-eccentriciteit)
- `HintGlyph` chevron-arrow + Cormorant-Garamond italic "veeg omhoog", anchored aan closest live obstacle, 1.6Hz bob → 3Hz intensify-pulse na 5s no-input
- **Wave-uncanny** clip: te-traag, te-lang, te-gelocked. Eyes-locked-on-camera. "Alsof Cosmo JOU ontdekt"
- Audio-stinger: bestaande `globe-l1-1.mp3` (3-syllable Hint Globe voice — kid-alien babble)
- localStorage `cosmosOnboardingComplete` skip portal+arrival voor return-users
- Geen text-instruction in stappen 0-2.5s

### Added (15E — Wiring + deploy)

- `weirdoObstacleFactory.ts` — vervangt canvas-primitive defaults door 15C's 8 objects als billboarded planes met THREE.TextureLoader + cache. Per kind random pool-pick zodat playthrough nooit repetitief voelt.
- 3 ObstacleKinds → pools: low (trampoline + star), tall (sentry + tree + mouth-pillar), gap (portal + crystal + clock-bubble)
- Pre-warm bij boot zodat eerste spawn niet pop't

### Cost Sprint 15

$2.05 totaal (15A: $0.20 + 15C: $1.85 + 15B/D/E: $0).

### Open voor Sprint 16

- **Cosmo-LoRA fine-tune** ($10-15) voor permanente DNA-fix in 4K renders + procedural-anim variants
- Draco compress cosmo.glb (8MB → 2MB) in build-pipeline
- 2 extra weirdo objects: levitating-tongue-bridge + antenna-flower-rain
- Per-biome obstacle-pool variations
- ElevenLabs custom Cosmo gibberish-voice library (3 varianten)

## [1.0.1] — 2026-05-02 — Sprint 14: complete-experience polish

v1.0.0's eerste live demo had drie zichtbare gebreken: kawaii Cosmo, dubbele blended backgrounds, en HUD-clutter. Sprint 14 fixt alle drie + voegt drift-loose default mode toe (geen rhythm-druk, hypnose first).

### Fixed (14A — Cosmo vol-DNA via PIL deterministic paint)

Sprint 13D's hero was kawaii-drift. Flux text-only failde 8/8 op chameleon-eye criterion (kawaii bias unbreakable in training data). Doorbraak via PIL deterministic paint van zwarte spheres + saffron crescent + white catchlight direct over kawaii eyes. Tail alpha-erase (Sprint 6A pattern). ESRGAN 4× RGB-only + Lanczos alpha + threshold-tighten halo. Final 4096² RGBA: chameleon eyes ✓, no tail ✓, suction-cups ✓, antenne+flower ✓, faded-rose spots ✓. Cost $0.45.

**KRITIEKE memory-leering**: canonical-v2 zelf is DNA-incorrect op eye-criterion (Sprint 6A had al kawaii pink eyes — bias propageerde 5B/7A/11A/13D). Voor permanente fix: Cosmo-LoRA fine-tune $10-15 (Sprint 15+).

### Fixed (14B — Background dedup, single 4K plane per biome)

`BiomeLayer` interface + `baseLayers()` factory verwijderd. `Biome` heeft nu `bgUrl: string` direct naar `biome-{slow-bloom,inkpool,cathedral,boss}-4k.png`. `parallaxScene.loadBiome()` rendert één opaque plane (transparent: false), overscan 1.15. `main.ts` wired `biomeMgr.onChange(biome → parallax.loadBiome(biome))` — parallax swapt na crossfade-end.

### Added (14C — Drift-loose mode default, beat-lock opt-in)

Mode-toggle ladder: URL `?mode=beat` > `B`-key > `localStorage.cosmosBeatLockMode` > **default drift-loose**. Beat-lock lazy-loadt `title-theme.json` (Sprint 13B beatmap), `BeatmapScheduler` synced op `audioBridge.musicCurrentTime()`. JSON-fail = silent fallback. Saffron-ring rond Cosmo (FFT band-0 pulsed) als visuele cue beat-mode. FFT → post-FX onaangeroerd in beide modes.

### Added (14D — HUD invisible-by-default)

Combo: 0 → tap 240ms fade-in / 0.6s hold / 1.2s fade-out. Version-pill: 4s intro → fade-out, pinch-zoom-out reveal 4s. Top-nav: opacity 0.25 scale 0.92 default, hover/focus reveal 1/1. AutoVJ engaged: alles forced 0. Mobile reveal: 80px `.hud-reveal-zone` hot-strip, touchstart/mousedown → 3s reveal-window.

### Cost

Sprint 14: $0.45 (alleen 14A asset-gen). 14B/C/D = code-only.

### Open voor Sprint 15+

- Cosmo-LoRA fine-tune ($10-15, permanente DNA-fix)
- Alpha-lerp crossfade tussen biomes (visuele transitie ipv hard-swap)
- Asset-cleanup: legacy slow-bloom-v2/, tile/enemy assets uit dist
- Bubble-textures + hallucination-particles wiren in BeatTarget/TrippyEventDirector

## [1.0.0] — 2026-05-02 — Cosmos rhythm-trip rebuild (D + C-vibe pivot)

GROND-UP REBUILD. Pivot van platformer-experiment naar mobile-first hypnotische rhythm-trip. *"Geen game. Geen score. De track is de game."*

5 sprints (13A-13E) parallel: foundation strip + BeatScene + CosmoRig 8-band FFT-rig + AutoVJ + 5 mobile gestures (13A); JSON-DSL beatmap-loader + onset-detector Python + 4 base-track beatmaps (13B); BiomeManager 4-state crossfade + share-stack 60s clip + screenshot peak-detector + daily-streak + friend-seed (13C); premium $1.75/$10 asset-gen — Cosmo 4K hero, 4 biome-4K backgrounds (inkpool + boss 10/10 first-pass), 8 cosmic-bubbles, 6 hallucination-particles, splash-hero (13D); deploy v1.0.0 (13E).

Verwijderd: alle platformer-entities (L1Scene, Cosmo, Bomb, BreakableWall, HintGlobe, Star, Trampoline, alle enemies, HudOverlay, levelL1, oude biomes). Herzien: InputController gesture-bus, TouchOverlay simplified, audioFFTBridge.musicCurrentTime + setMusicTrack getters.

## [0.9.0] — 2026-05-01 — Sprint 13C: biome-cycling + share-mechanismen

Tweede helft van de v2.0-rebuild. Sprint 13C bouwt het post-FX-cycling-systeem
en de virale haakjes uit PRD §5/§7 — biome-state-machine met crossfade,
synesthesia-piek-detector, 1080×1920 share-card capture, 60s clip-recorder met
audio-tap, glassmorph-overlay en daily-streak counter.

### Added

- **`src/three/biomeManager.ts`** — 4-biome state-machine (slow-bloom →
  inkpool → cathedral → boss). 4s linear crossfade van `biomeIntensity`
  uniforms; track-end auto-cycle; long-hold-3s player-trigger via
  `requestPlayerSwitch()`. Hooks voor track-swap zodat de AudioFFTBridge
  de eigenaar blijft van `<audio>`-elementen.
- **`src/share/peakDetector.ts`** — vuurt op (`lows > 0.7` 0.5s sustained)
  AND (combo > 5 OR boss-biome). 30s cooldown zodat de auto-screenshot
  zeldzaam voelt. Callback-based — geen extra deps.
- **`src/share/captureScreen.ts`** — composiet 1080×1920 portret van de
  Three+Phaser canvases met glassmorph card (track-naam, biome, combo,
  taps, watermerk + URL) en optionele Cosmo-cirkel.
- **`src/share/captureClip.ts`** — `ClipRecorder` met `MediaRecorder`
  (vp9/opus → mp4/avc1 fallback), eigen rAF tikt offscreen-canvas op
  30fps, audio-tap via `AudioFFTBridge.captureStream()`. 60s default,
  manual stop ondersteund.
- **`src/share/shareCardOverlay.ts`** — DOM-modal met preview, "Save to
  Photos", "Copy share link", auto-dismiss na 8s. Plus `showStreakPill()`
  voor de "Dag X in de trip"-toast.
- **`src/share/dailyStreak.ts`** — localStorage streak counter
  (`cosmosLastVisit`, `cosmosStreak`, `cosmosLongest`), milestones day-7
  / day-30. Local-date YYYYMMDD, idempotent intra-session.
- **`src/share/urlSeed.ts`** — `?seed=YYYYMMDD&combo=NN` URL-helpers met
  FNV-1a + xorshift hash voor deterministische beatmap-shuffle.
- **`AudioFFTBridge.captureStream()`** — `MediaStreamAudioDestinationNode`
  tap zodat clip-recorder analyser-output kan opnemen zonder live
  playback te verstoren.
- **`globalUniforms.biomeIntensity`** — bloom/kaleido/fluid/chroma/parallax
  multipliers; `postFX.ts` schaalt zijn base targets ermee.
- **Biome-presets** uitgebreid van 1 → 4 biomes met `bpm`, `trackUrl`,
  `chroma` en `BIOME_CYCLE_ORDER`.

### Notes

- BeatScene-integratie en deploy zijn voor Sprint 13D/13E.
- iPhone Safari MediaRecorder ondersteunt mp4/avc1 vanaf iOS 14.3 — webm
  faalt daar bewust soft (geen exception, alleen `onError`-callback).

## [0.8.0] — 2026-05-01 — Sprint 11: visual + audio overhaul

Op live playtest van v0.7.3 viel direct op dat de online versie er als 1992 uit zag — Cosmo was een stick-puppet, HUD was clipart, tiles waren patroon-tegels, en muziek speelde **helemaal niet**. Sprint 11 pakt alles in één klap aan: 4 parallelle teams (Cosmo HD-rerender, HUD volledige redesign, tile-set redesign, audio-debug) en deploy.

### Fixed (11D — audio bug)

**Root cause**: `audioEl.play()` werd in `init()` aangeroepen vóór gesture; browser blokkeerde met `NotAllowedError` die `.catch()` stilletjes wegslokte. `ensureRunning()` deed alleen `ctx.resume()` op gesture, **retried play() niet**. AudioContext en HTMLAudioElement hebben gescheiden autoplay-locks — context werd unsuspended, audio-element bleef paused, MediaElementSource pompte stilte.

**Fix**: `MusicSource` interface kreeg `audioEl?: HTMLAudioElement`, `createStreamedTrack()` exposeert het, `ensureRunning()` retry'd play() bij paused. Idempotent op subsequent gestures. Bonus: error-listener logt nu `audio.error.code/message`. Headless Chromium grant autoplay automatisch — daarom miste eerdere oppervlakkige tests dit (memory-gotcha gedocumenteerd).

### Added (11A — Cosmo poses HD-rerender)

6 pose-frames (walk-1, walk-2, jump-up, jump-fall, cling-right, hurt) re-rendered met **img2img + ControlNet/canny** (canonical-v2 als image_url strength 0.45–0.65, control_lora 1.20–1.25, seed 7777 voor face-consistency). **Body-mass volledig gerestaureerd** — Hayao×Moebius watercolor textuur, chameleon eyes, suction-cup discs, faded-rose spots. Stick-puppet-bug **gefixt**.

**Bekend architectural ceiling**: 13 strength-combinaties getest, in alle gevallen wint canonical noise-init van canny-conditioning → poses lijken statisch. Pose-distinction vereist Cosmo-LoRA fine-tune of Meshy 3D rig (Sprint 12+). Cost: $1.92 (van $5–8 budget).

**In-engine compensatie** (Sprint 11E inline): `Cosmo.updateAnim()` past nu scale + rotation per state toe zodat elke frame visueel onderscheidbaar is op 120px:
- jump-up: scale(0.94, 1.08) + 6° tilt opposite-facing (anticipation squash)
- jump-fall: scale(1.0) + 8° forward-tilt (T-pose-falling)
- run: Y-bob `sin(walkPhase × π) × 0.03` (gait pulse)
- idle: subtle breathing pulse `sin(animPhase × 1.6) × 0.02`
- cling: neutral (setFlipX al voldoende)
- damage/death: rotation-tween al in `takeDamage` (Sprint 8D)

### Added (11B — HUD/UI volledige redesign)

Cosmic Cathedral pill-architectuur, glassmorph + Hayao×Moebius elegance:

- **Top-left game-info pill**: backdrop-blur(20px) saturate(140%), `rgba(20,16,26,0.55)` background, 1px stroke `#F4A261` 0.3 alpha, border-radius 18px. Cormorant-Garamond italic 18px voor "Cosmos · L1 First Steps", JetBrains-Mono 14px voor metrics. Hartjes als canvas-drawn watercolor heart-primitives (filled = saffron-glow + faded-rose halo, outline = ink-aubergine 1.5px stroke). Bomb + star als canvas-primitives.
- **Top-right nav pill**: synchroon met game-info, version-pill als ink-aubergine sub-bouwsteen met monospace tekst. Hover: saffron-glow background-overgang met `ease-out-expo 220ms`.
- **Bottom-center controls-hint pill**: auto-hide na 8s, fade-in 600ms easeOutExpo, re-fade-in 4s op keypress.
- `src/phaser/hud/HudOverlay.ts` (18KB) — class met canvas-rendering + tween-management, attach/detach lifecycle hooks via Phaser scene events.
- `'♥'.repeat()` glyphs **definitief weg**.
- Mobile responsive: pills compact op <600px, controls-hint hidden (touch-overlay heeft eigen guidance).

### Added (11C — Tile-set redesign)

10 nieuwe painted-watercolor assets in `public/assets/tiles/` (v3-suffix), Hayao×Moebius style coherent met Cosmo + enemies, locked palette respected:

- ground / dirt / wall / wall-cracked / mushroom / spike (per-tile fallback) / trampoline (8 squares, 256² seamless)
- spike-strip (1024×128 continue strip — niet wired, future per-row refactor)
- ladder (256×1024 vertical organic vine — preloaded, future L-grid char)
- bg-grass-strip (1024×128 painted bottom-band — preloaded)

**Cost**: $0.68 (van $4–6 budget). Quality > quantity: 10 first-pass + 5 retries.

**Belangrijke nieuwe leringen** (memory):
- **Flux Pro "macro close-up" border-bias**: interpreteert prompt als professional product-photography met ring-around-empty-center. Fix: front-rider `"SEAMLESS UNIFORM TEXTURE filling 100 percent" + "NO empty center NO border-only NO subject-at-edges"`.
- **Stylized illustration tiles → Flux Dev** ipv Flux Pro. Trampoline 3× retry in Pro, 1-shot in Dev met "illustration of plump mushroom-cap dome from 3/4 angle".
- **Strip aspect-ratios werken first-try** (8:1 horizontal + 1:4 vertical) — composition-bias trad NIET op.

### Sprint 11 architectuur-leringen

- **Vite's MediaElementSource gesture-protocol**: AudioContext en HTMLAudioElement hebben gescheiden autoplay-locks. Resume context is niet genoeg — moet OOK audio.play() retry op gesture.
- **img2img+ControlNet pipeline ceiling voor pose-variation**: canonical noise-init wint van canny-conditioning ongeacht 13 strength-combinaties. Voor onderscheidbare poses: LoRA fine-tune of 3D rig. Tussenoplossing: in-engine scale/rotation tweens.
- **Glassmorph + canvas-primitives** voor HUD geeft 2026-feel zonder bitmap-icons of glyph-fallbacks.
- **Per-asset model-pick** matters: Flux Pro voor textures, Flux Dev voor stylized illustrations.

### Cost

~$2.60 totaal Sprint 11 (11A: $1.92 + 11C: $0.68; 11B/D: code-only). Ruim binnen budget.

### Niet gedaan (Sprint 12+)

- Cosmo-LoRA fine-tune of Meshy 3D rig (echte pose-variation, niet via img2img)
- Walk-1/walk-2 eye-drift fix (per-frame seed-lock pass, $0.18)
- Spike-strip wiring (decodeLevel refactor om contiguous `^` runs te detecteren)
- Ladder + grass-strip in L-grid (nieuwe legend-char `L` voor klimroutes)
- Bonus damage-warp variant (1-line pool append)
- Per-biome music-switch
- Hallucination ducking music-gain

## [0.7.3] — 2026-05-01 — Sprint 10: insanity live — hallucinations + damage warps

Sprint 9 leverde één base-track per biome; v0.7.3 voegt **mesmerizing insanity overlays** toe — psychedelic peaks die random uit een pool crossfaden bovenop de base-music. Plus hot-fix voor een `String.repeat(-1)` crash in de HUD bij dubbele damage-hits.

### Added (Sprint 10 — insanity overlays)

- **3 nieuwe Suno tracks** in `public/assets/audio/music/`:
  - `hallucination-peak-1.mp3` (3:24, microtonal koto + reversed flute fragments)
  - `hallucination-peak-2.mp3` (3:24, alt variant — random-picker schakelt elke trigger tussen variant 1 en 2)
  - `damage-warp-1.mp3` (28s, sub-bass pulse + tape-warp glitch + reversed pluck)
  - Loudnorm-pass identiek aan Sprint 9 (−14 LUFS, 112kbps); originelen in `_originals/`.
- **Multi-source audio architectuur** in `audioFFTBridge.ts`:
  - Aparte `stingerGain` sub-bus naast `musicGain`; beide → analyser → masterGain. Post-FX shaders reageren dus ook op insanity-events (lows pulsen bloom, mids drijven kaleido, highs sturen fluid).
  - `playStinger(pool)` voor one-shots (auto-dispose op `ended`)
  - `startHallucination(pool)` voor sustained overlays (max 30s, 1s fade-in / 4s fade-out, één-tegelijk dedupe)
  - `pickFrom(pool)` random-picker pattern; pools (`HALLUCINATION_PEAKS`, `DAMAGE_WARPS`) zijn `readonly string[]` constants — pool-uitbreiding is een 1-line append zonder code-changes elders.
- **Trigger-wiring**:
  - `Cosmo.takeDamage` → `audioBridge.playStinger(DAMAGE_WARPS)` (3 sites: hazard-overlap, enemy-touch, projectile-overlap)
  - `TrippyEventDirector.fire` → 25% kans op `audioBridge.startHallucination(HALLUCINATION_PEAKS)` per kaleidoscope-spike. Bridge dedupe voorkomt overlapping hallucinations.
- **Pattern**: dezelfde event triggert random tracks → anti-fatigue. Bridge dedupe (één hallucination tegelijk) voorkomt soundscape-smear.

### Fixed (Sprint 10 — HUD crash)

- `L1Scene.updateHUD` crashte met `RangeError: Invalid count value: -1` op `'♥'.repeat(c.hp)` als `hp` onder 0 zakte (mogelijk bij gelijktijdige damage-hits voorbij death). Fix: clamp in HUD (`Math.max(0, Math.min(maxHp, hp))`) + clamp in `Cosmo.takeDamage` (`hp = Math.max(0, hp - 1)`). Defense-in-depth — beide paths beschermd.

### Architectuur-leringen Sprint 10

- **Random-picker pattern voor anti-fatigue**: zelfde event-trigger, telkens andere track. Pool-as-readonly-array maakt uitbreiding triviaal. Werkt ook voor SFX-variation (toekomst: 3 jump-sounds, 3 stomp-sounds).
- **Aparte stinger-bus die door analyser komt** = post-FX reageert ook op overlays. Goedkoop trippy: damage-warp pulse drijft vanzelf bloom + kaleido.
- **One-tegelijk dedupe** voor sustained tracks voorkomt cacophonie. Voor stingers (one-shot) is overlap juist gewenst.

### Open voor Sprint 11+

- 2e damage-warp variant (Suno regenerate, ~20s). Pool kan vandaag 1 track aan; uitbreiding is 1-line append in `DAMAGE_WARPS`.
- Per-biome music-switching (slow-bloom-loop voor L1, inkpool-loop voor L2). Vereist biome-event op level-load.
- Ducking: music gain dimmen tijdens hallucination zodat de overlay duidelijker uitkomt.

## [0.7.2] — 2026-05-01 — Sprint 9: music live — Suno × audio-FFT bridge

Sprint 8B leverde de bridge en de scaffold; nu hangt er **echte muziek** aan. 4 D-minor folktronica tracks gerenderd via Suno Pro (handmatig, copy-paste prompts), loudnorm-pass naar −14 LUFS browser-standaard, swap van placeholder-synth naar streamed `<audio>` source. De wereld ademt nu mee met de title-theme zodra je op het canvas klikt.

### Added (Sprint 9 — music)

- **`public/assets/audio/music/title-theme.mp3`** — 3:09, 92 BPM, D-minor. Slow build, wooden flute + koto + granular pads, brushed kick @ 1:00. 4-note motif D–A–F–D in koto, fluit antwoordt octaaf hoger. Suspended A-minor → D-minor loop point.
- **`public/assets/audio/music/slow-bloom-loop.mp3`** — 2:50, 86 BPM. Mystieke alien-mushroom forest. Geen percussie, alleen ademende flute + koto + crickets. Discovery-feeling voor L1.
- **`public/assets/audio/music/inkpool-loop.mp3`** — 3:18, 78 BPM. Reflective ink-aubergine cave. Ambient koto-drone, lange flute, reverse-reverb tape, 78-BPM hand-drum heartbeat.
- **`public/assets/audio/music/boss-stinger.mp3`** — 2:47 (langer dan PRD-doel 0:45 maar werkt als mini-loop). Ominous wooden flute drone + koto-tremolo build. Suspended D-minor finale.
- **Loudnorm pass**: ffmpeg `loudnorm=I=-14:TP=-1.5:LRA=11 -b:a 112k`. Spread −13.1 → −13.9 LUFS (binnen 0.8 LU); file-sizes ~halved (2.3–2.8 MB elk). Originelen in `_originals/` (gitignored).
- **`audioFFTBridge.ts` swap**: `MUSIC_TRACK = assetPath('assets/audio/music/title-theme.mp3')`. Placeholder-synth opzij; streamed `<audio>` element + MediaElementAudioSourceNode neemt over. AudioContext-resume wired aan eerste click/keydown/touchstart (browser autoplay-policy).

### Architectuur-notitie

- Suno's wrapper-services (sunoapi.org) gebruiken aparte credit-systemen los van suno.com Pro. gcui-art/suno-api wrapper vereist 2Captcha bovenop SUNO_COOKIE. **Conclusie**: voor MVP-aantal tracks (≤10) is handmatig genereren via suno.com + copy-paste prompts goedkoper en simpeler dan elke API-route.
- Memory bijgewerkt: `suno_api.md` documenteert sunoapi.org endpoints + scaffold (Sprint 8B `suno_client.py` blijft optioneel pad voor later batch-renders).

### Open voor Sprint 10

- 2 extra "mesmerizing insanity" companion-tracks (`hallucination-peak.mp3` voor kaleidoscope-pieken, `damage-warp-stinger.mp3` voor damage/death/portal). Prompt-bundle gedeeld; Richard rendert + plaatst in Downloads.
- Per-biome track-switching (TrippyEventDirector kan tussen slow-bloom-loop en hallucination-peak crossfaden bij intense events).
- L2 (`inkpool-hollow`) gebruikt `inkpool-loop.mp3` zodra er een biome-switch entity-flag is.

## [0.7.1] — 2026-05-01 — Sprint 8: hot-fix — asset paths, Cosmo polish, Suno-prep

Live playtest van v0.7.0 toonde alleen Phaser fallback-rectangles in plaats van sprites — alle 31 asset-loads gingen naar `theuws.com/assets/...` ipv `theuws.com/games/cosmos-2026/assets/...`. Sprint 8 patcht het, plus build-pipeline veiligheid, Cosmo state-machine polish, en Suno-API integratie (klaar voor music-swap zodra credits getopt zijn).

### Fixed (8A — Asset BASE_URL paths, KRITIEK)

- **`src/core/assetPath.ts`** (nieuw): single helper die `import.meta.env.BASE_URL` als prefix gebruikt voor runtime-strings. Vite herschrijft alleen HTML/import-paden, niet runtime-strings die naar Phaser's `this.load.image()` of Three's TextureLoader gaan.
- 31 hardcoded `/assets/...` paden gerouteerd via `assetPath()` in `L1Scene.ts` (25), `sfxBus.ts` (2), `parallaxScene.ts` (1).
- Productie-build-bundle bevat nu correct `"/games/cosmos-2026/"` prefix; preview-test 3/3 200 op alle paden.

### Fixed (8C — Build pipeline force-overwrite + sentinel)

- `scripts/postbuild-copy-public.mjs` herschreven van `--ignore-existing` (silent-skip) naar **byte-equal verify + force-overwrite**. Eliminates een hele klasse van silent-drift tussen `public/` en `dist/`.
- 4 SENTINEL_FILES (cosmo-cling-right, cosmo-hurt, bomb-throw, bomb-boom) die exit-1 forceren als ze na de copy ontbreken — voorkomt herhaling van Sprint 7E mysterie.
- Diagnose: pipeline was sinds commit `bca9cf0` al correct; Sprint 7E observatie kwam vermoedelijk van stale dist/ vóór die commit. Maar het silent-skip-risk was reëel — nu gehard.

### Changed (8D — Cosmo state-machine polish)

- `Cosmo.ts`: `bombCooldown` was hardcoded 0.4 — drift met `BOMB.COOLDOWN_S` (0.35). Single source of truth.
- Death-state krijgt **Z-rotation tween** (90° easeIn 600ms, sign volgt facing). Sprint 7A open issue closed.
- `setTimeout` voor damage→fall reset vervangen door `scene.time.delayedCall` (respecteert Phaser-pause).
- `bombTargets[]` unbounded growth gedocumenteerd als L2-pass cleanup; `dead`-guard voorkomt crash.

### Added (8B — Suno API integratie, scaffold + wiring)

- **`scripts/sprint8b/suno_client.py`** (nieuw): Python client met `credits`/`generate`/`wait_for_task`/`download`/`transcode_to_mp3`. CLI subcommands. Cosmos-style suffix + negative tags hardcoded (folktronica, koto, wooden flute, D minor, no blues rock).
- **`scripts/sprint8b/generate_mvp_tracks.py`** (nieuw): batch driver voor 4 MVP tracks (title-theme, slow-bloom-loop, inkpool-loop, boss-stinger). Pre-flight credit check, sequential 15s gap, .json sidecars.
- **`audioFFTBridge.ts`** voorbereid op 1-line swap (`MUSIC_TRACK = assetPath(...)`); `<audio>.error` listener toegevoegd voor swap-mistake debugging.
- **Memory** (`suno_api.md`): endpoint inventory, prompt-structuur, gotchas (callBackUrl required, 429-as-HTTP-200, 8 credits/V4_5 generate, soft rate-limit).
- **Status**: account heeft 2.0 credits, 32 nodig. **0 tracks gerenderd**. Top-up bij sunoapi.org Basic $5 → 1000 credits → 125 generations. Daarna `python3 scripts/sprint8b/generate_mvp_tracks.py` rendert ~12 min unattended.

### Architectuur-leringen Sprint 8

- **Vite's BASE_URL replace werkt alleen op HTML + import-paden**, NIET op runtime-string-literals naar engine-loaders. Single helper (`assetPath()`) is de duurzame fix; alternatieven (postbuild regex, build-time-codegen) zijn brittle.
- **Silent-skip semantics in build-pipeline = silent regression risk**. Force-overwrite + sentinel-guard maakt regressies hard-fail bij build-tijd ipv runtime in productie.
- **sunoapi.org returns code-in-body voor errors** (HTTP 200 + `code:429` voor insufficient credits). Always inspect body, never trust HTTP status alone.
- **`callBackUrl` is required field** in sunoapi.org generate endpoint, ook bij polling. Dummy `https://example.com/no-callback` voldoet.

### Cost

$0 (alleen code; Suno top-up door gebruiker, kosten daar bekend: $0.005-0.04 per track op Basic plan).

### Niet gedaan (Sprint 9+)

- 4 Suno tracks renderen (blocked op credit top-up — single python-script-run zodra opgelost)
- Walk-1/walk-2 eye-drift fix (per-frame seed-lock, $0.18) — TODO-comment in Cosmo.ts
- Bomb pickup → Cosmo invuln-frames bij death state (edge-case)
- L2/L3/L4 levels
- Save-state / progressie tracking

## [0.7.0] — 2026-05-01 — Sprint 7: parallel-team — anim, mobile, sprites, bundle

Vier agents tegelijk: multi-frame Cosmo anim (7A), mobile/touch-controls (7B), bundle-size optimalisatie (7C), enemy + bomb sprite-generation pass (7D). Resultaat: Cosmo loopt en springt nu echt anders, mobile is speelbaar, main bundle is van 2.2MB naar 48KB en alle 12 enemies + bomb-stack hebben definitieve assets.

### Added (7A — Multi-frame Cosmo anim)

- **6 pose-frames** in `public/assets/sprites/v3/`: cosmo-walk-1, cosmo-walk-2, cosmo-jump-up, cosmo-jump-fall, cosmo-cling-right, cosmo-hurt — alle BiRefNet'd transparant
- **Pipeline-doorbraak**: `fal-ai/flux-control-lora-canny` met **programmatische stick-figure skeletons** (PIL-rendered, geen handgetekende sketches nodig). Recipe: skeleton-only + control_lora_strength 1.2 + style-first prompt
- **Sprint 5B/6A failure-modes definitief opgelost**: image-to-image als pose-anchor (nee), text-only suction-cups (nee), inpaint-refinement (nee). ControlNet/canny met skeletons geeft hard pose-constraint.
- Cosmo state-machine: `playStateAnim()` vervangen door `updateAnim(dt)` texture-swap. Walk-cycle alterneert walk-1/walk-2 elke 133ms via `walkPhase` accumulator. Cling: `setFlipX(clingSide < 0)` voor left-wall mirror. Damage + death gebruiken cosmo-hurt.

[grid: /assets/case-study/cosmo-multi-frame/skeletons/skeleton-walk-1.webp /assets/sprites/v3/cosmo-walk-1.png /assets/case-study/cosmo-multi-frame/skeletons/skeleton-jump-fall.webp /assets/sprites/v3/cosmo-jump-fall.png "Skeleton walk-1 control-input · Walk-1 result · Skeleton jump-fall · Jump-fall result"]

[grid: /assets/sprites/v3/cosmo-walk-1.png /assets/sprites/v3/cosmo-walk-2.png /assets/sprites/v3/cosmo-jump-up.png /assets/sprites/v3/cosmo-jump-fall.png /assets/sprites/v3/cosmo-cling-right.png /assets/sprites/v3/cosmo-hurt.png "walk-1 · walk-2 · jump-up · jump-fall · cling-right · hurt"]

**Pose-fidelity**: 5/6 frames excellent (8-10/10), walk-1/walk-2 ship-quality op 120px in-game (style-thinness barely visible). Cost ~$0.88. Open issue: walk-1/walk-2 eye-drift (1 vs 2 oogvariant) — per-frame seed-lock fix is $0.09 elk indien storend in playtest.

### Added (7B — Mobile + touch-controls)

- **`src/ui/touchOverlay.ts`** (nieuw): 4 canvas-drawn knoppen (LEFT/RIGHT 80px d-pad bottom-left + BOMB 80px / JUMP 100px bottom-right). Canvas-glyphs (chevron-arrows + ink-aubergine bomb-disk + saffron pressed-state). **Geen emoji's, geen unicode-icons** — pure canvas-primitives volgens project-regel.
- **`src/core/deviceDetect.ts`** (nieuw): `isTouchDevice = (touch-capable) && (innerWidth < 1024)`. iPad Air landscape blijft desktop UX, iPad Mini portrait krijgt overlay, hybride laptops ≥1280 ook geen overlay.
- **`InputController.setVirtualInput()`**: rising-edge merge van virt + kb signals voor jump/bombJustPressed. Cosmo state-machine en fysica niet aangeraakt — alleen input-mapping.
- **Responsive HUD**: pills 16/14/12px (desktop / <1024 / <600), safe-area paddings rond HUD én overlay-root, viewport-fit=cover voor iPhone notch.
- **Cosmo display-size**: 120px desktop, 80px mobile via Phaser scale. Body geometry pixel-identiek (180×380 op 1024px source) → collision invariant.
- **"Best on desktop" disclaimer-pill** met 6s auto-dismiss + close-button.
- **Playwright-tests** op iPhone 14 Pro / iPad Mini / desktop allen groen.

### Added (7D — Sprite-generation pass)

12 nieuwe assets, $0.84 totaal, geen `spriteTodo: true` flags meer.

[grid: /assets/sprites/v4/enemy-parachute.png /assets/sprites/v4/enemy-pinkworm.png /assets/sprites/v4/enemy-ghost.png /assets/sprites/v4/enemy-spittingwall.png /assets/sprites/v4/enemy-dragonfly.png /assets/sprites/v4/enemy-flyingwisp.png "parachute · pinkworm · ghost · spittingwall · dragonfly · flyingwisp"]

[grid: /assets/sprites/v4/enemy-suctioncrawler.png /assets/sprites/v4/enemy-tuliplauncher.png /assets/sprites/v4/enemy-spark.png /assets/bombs/bomb.png /assets/bombs/bomb-pickup.png /assets/tiles/tile-wall-cracked-painted.png "suctioncrawler · tuliplauncher · spark · bomb · bomb-pickup · cracked-wall"]

- **9 enemy-sprites** in `public/assets/sprites/v4/` (8× one-shot, spark v2)
- **3 bomb-assets** in `public/assets/bombs/` + `public/assets/tiles/tile-wall-cracked-painted.png` (cracked-wall v3 — eerst 2× tile-trap)
- **2 SFX** via ElevenLabs: `bomb-throw.mp3` (9KB) + `bomb-boom.mp3` (15KB), wired in `sfxBus.ts` SFX_MANIFEST
- **EnemyTypes.ts**: 9 enemies → spriteTodo:false, dedicated keys, tint:0
- **Bomb.ts**: texture-key `'bomb'` met `'bomb-procedural'` als fallback
- **BreakableWall.ts**: Graphics ink-crack overlay verwijderd — cracks zitten nu baked in de texture

### Changed (7C — Bundle-size manualChunks)

- `vite.config.ts` — `build.rollupOptions.output.manualChunks` toegevoegd: `three-vendor` (three + postprocessing), `phaser-vendor` (phaser), `audio-vendor` (howler + tone)

| Chunk | Before | After |
|---|---:|---:|
| main-*.js | 2,228 kB (gz 510) | **48 kB (gz 15)** — −98% |
| three-vendor | — | 536 kB (gz 129) |
| phaser-vendor | — | 1,609 kB (gz 358) |
| audio-vendor | — | 36 kB (gz 10) |

Total gzip ~gelijk; winst zit in parallel-loading. Geen logic-changes, geen dynamic imports nodig.

### Sprint 7 architectuur-leringen

- **Programmatische stick-figure skeletons + Flux Control LoRA Canny** geeft hard pose-constraint. Skeleton-only (geen image_url als style-ref) op control_lora_strength 1.2 + style-first prompt is de werkende recipe. Geen handsketch nodig.
- **Suction-cup-pads werkten one-shot op 4-legged crawler** waar 12/12 op biped Cosmo faalden. Patroon: matching style-association + non-biped anatomy omzeilt training-bias. Toekomstige Cosmo-DNA NPCs kunnen hierop bouwen.
- **BiRefNet polling**: `response_url` is HTTP 400 tijdens IN_QUEUE — poll `status_url` tot COMPLETED, dan response_url fetchen. Algemene fal.ai gotcha — gefixed in Sprint 7D `generate.py`.
- **Tile-trap fix-recipe**: drop "psychedelic illustration" + "cosmic-adventure mood" termen (scene-magnets) en gebruik stripped close-up macro prompt + stacked anti-landscape negatives.
- **Spark-hazard fix**: lead met "ONE tiny X hazard, NOT a creature NOT a body NOT fur" upfront — voorkomt body-growth rond abstract concept.
- **Touch-overlay threshold (1024px) bewust over UA-sniffing gekozen** — touch+viewport heuristic is duurzamer en respecteert hybride devices.

### Cost

~$1.72 fal.ai + ElevenLabs (7A: $0.88 inpaint-pipeline + 7D: $0.84 sprite-gen). Sprint 7B/7C = $0 (alle code).

### Niet gedaan (Sprint 8)

- Walk-1/walk-2 eye-drift fix (per-frame seed-lock — $0.09 per frame indien storend in playtest)
- Suno-tracks genereren (handmatig via suno.com — niet binnen agent scope)
- L2/L3/L4 levels (alleen L1 First Steps speelbaar tot nu)
- Save-state / progressie tracking
- Settings-knop `?touch=1` override voor iPads ≥1024px die toch touch willen

## [0.6.0] — 2026-05-01 — Sprint 6: parallel-team — gameplay verticaal compleet

Vier agents tegelijk: Cosmo canonical inpaint-fix (6A), enemies + damage-systeem (6B), bombs + VFX + breekbare walls (6C), audio-FFT bridge (6D). Resultaat: L1 is van een speel-loop met items + parallax naar een **echte gameplay-sandbox** met vijanden, kills, bombs, walls, en muziek-reactieve post-FX.

### Added (6A — Cosmo canonical v2)

- **`cosmo-canonical-v2-cleaned.png`** wired in L1Scene (`src/phaser/scenes/L1Scene.ts:88`) — extended-arm geometry met zwarte disc-pads aan de tips, tail bijna volledig verwijderd
- **Pipeline-doorbraak**: Flux Fill (`fal-ai/flux-lora-fill`) bleek wél te werken voor *ADD-geometry* in lege bg-space (anders dan image-to-image die alleen noise-init was). Combineren met **PIL alpha-erase** voor *REMOVE-geometry* (tail) — deterministisch, $0.
- 15-image case-study series in `public/assets/case-study/cosmo-inpaint-process/` met manifest

[grid: /assets/case-study/cosmo-inpaint-process/01-source.webp /assets/case-study/cosmo-inpaint-process/08-mask-extended-arms.webp /assets/case-study/cosmo-inpaint-process/09-result-extended-arms.webp /assets/case-study/cosmo-inpaint-process/15-final-v4.webp "Bron canonical (v053) · Mask voor extended arms · Flux Fill output · Final v4 in-engine"]

> Wat NIET werkte: tail-inpaint met "no tail no lizard" prompt (Flux regenereerde identieke lizard-tail — sample-bias is anti-prompt-resistent), hand-inpaint op torso-edge (renderde als over-ear headphones door face-level Y-coord), refinement-pass op v3 (Flux voegde mini-extra-head toe aan disc).

> Wat WEL werkte: extended-arm-mask in PAPER bg-area (Flux Fill genereerde nieuwe arm-anatomie out of nothing) + alpha-erase post-BiRefNet voor cosmetische cleanup. Cost ~$0.25 binnen budget.

**Open**: disc-fuse niet 100% (claws zichtbaar rond pads, acceptabel op 120px display), mini tail-stub remnant (cosmetisch), multi-frame anim nog steeds onopgelost (ControlNet/sketch-to-img blijft Sprint 7).

### Added (6B — 12 enemies + damage-systeem)

- **12 enemy-kinds** in `src/phaser/entities/enemies/` (Enemy.ts + EnemyTypes.ts + EnemyProjectile.ts): brumberry, hopper, parachute, eyePlant, pinkWorm, ghost, spittingWall, dragonfly, flyingWisp, suctionCrawler, tulipLauncher, sparkHazard
- **11 gedragsknopen** wired: patrol (met edge-flip probe), hop (timed), drifter (post-stomp fall), wallTurret (aimed projectile), burrow (proximity-surface), proximityGhost (chase only-when-faced-away), homing (lerp), sinusoid + dive-alignment, wallCrawler (placeholder), tulipLauncher (friendly bounce), rail
- **Stomp-detectie**: `cosmo.vy > 60` AND `cosmo.bottom <= enemyTop + 35% * height + 8px` → kill + bounce-up. Side-touch → damage met invuln-frames.
- **Eye Plant + Spitting Wall** zijn `bombOnly` (skippen stomp-branch, alleen bom-kill). **Ghost + Spark** zijn `invincible`.
- **Hint Globe L1-1/2/3** voices wired aan trigger-zones (col 2/50/30)
- Legend uitgebreid met 12 lower-case enemy-chars (b/h/p/e/w/g/s/d/f/c/t/z) — geen botsing met bestaande tile-chars
- 3 echte sprites + 9 hergebruikt-met-tint (`spriteTodo: true` flag voor toekomstige asset-gen — geen canvas-primitives, geen emoji's)

### Added (6C — Bombs + explosion VFX + breekbare walls)

- **Bomb entity** (`src/phaser/entities/Bomb.ts`): throw-arc ±320X / -450Y, 1.5s fuse met red/cream blink-tween in laatste 0.6s, 64px explosion-radius, 0.4s throw-cooldown
- **Cosmo throw-action**: `bombJustPressed` AND `bombs > 0` → squash-tween + spawn (bestaande `bombs` counter wordt nu echt gebruikt)
- **BreakableWall entity** (`src/phaser/entities/BreakableWall.ts`): legend `B`, ink-crack overlay (Graphics, 3 lijnen + saffron tip-dot), 280ms scale/alpha tween-out bij explosion-overlap
- **Bomb-pickup** (legend `Q`): overlap-only sprite, `cosmo.pickupBomb(1)`, scale-up + fade-tween
- **BombTarget contract** afgestemd met 6B: enemies registreren in `bombTargets[]`, `vulnerableToBomb` flag wordt gerespecteerd
- **Explosion VFX**: kaleidoTrigger +0.9 (drives bloom +0.45 + chroma +0.004), damagePulse +0.6 (drives datamosh-tear ~0.3s), 3-laag canvas flash-circle (faded-rose halo / saffron core / cream center) r 8→74px alpha 1→0 over 400ms easeOut. NO emoji-fallback.

**Sprite-status**: Bomb + pickup zijn procedural (`bomb-procedural`, `bomb-pickup-procedural`) met TODO voor Asset Generator. Cracked-wall hergebruikt `tile-wall-painted` + Graphics-overlay.

### Added (6D — Audio-FFT bridge)

- **`src/audio/audioFFTBridge.ts`** (nieuw): AnalyserNode op een dedicated `musicGain` sub-bus (deelt Howler.ctx, geen extra AudioContext-leak), fftSize 256, smoothing 0.8
- **8-band log-aggregator**: edges `[2, 4, 8, 16, 32, 64, 96, 128]` — denser in lage frequenties (matcht palet kick/bass/koto-pluck). Per frame `getByteFrequencyData()` → 8-band → `mix(prev, new, 0.4)` lerp → `globalUniforms.audioFFT`
- **Shader-mapping**:
  - `bloom.intensity += lows*0.6` (avg band 0–1)
  - `kaleido.strength += mids*0.25`, `kaleido.angle += mids*0.6` (avg band 2–4)
  - `fluid.amplitude = 0.022 + highs*0.025` (avg band 5–7)
  - 1-line mapping-comment toegevoegd in `kaleidoscope.ts` en `fluidDisplacement.ts`. Bestaande uniforms hergebruikt — geen rename, geen sloop.
  - **Three Pass Rule** intact: FFT is geen extra convolution-pass.
- **Placeholder-synth** voor dev: triangle 110Hz + saw 55Hz door swept lowpass (LFO 0.07Hz) + tremolo 1.1Hz. Excitet alle 8 bands voor visuele verificatie. **Suno-swap = 1 line** (`MUSIC_TRACK = '/assets/audio/music/title-theme.mp3'` → `createStreamedTrack()` neemt over via `<audio>` + MediaElementAudioSourceNode).
- **UI**: `M` mute music (alleen sub-bus, SFX onaangetast), `F` FFT-snapshot in console. AudioContext-resume idempotent gewired aan click/keydown/touchstart.

### Changed

- `src/main.ts` — audioFFTBridge boot wiring + key-handlers M/F
- `src/three/postFX/postFX.ts` — audioFFT consumeert in update() (lows→bloom, mids→kaleido, highs→fluid)
- `src/data/levelL1.ts` — legend uitgebreid (12 enemy-chars, B breakable-wall, Q bomb-pickup) + sample placements row 18
- `src/phaser/scenes/L1Scene.ts` — enemiesGroup + enemyProjectilesGroup + bombTargets[] + 209 regels Sprint 6B/6C wiring
- `src/phaser/entities/Cosmo.ts` — `attachBombHooks({ throwBomb })` injection-pattern (avoid scene/entity import-cycle), squash-tween, `pickupBomb()` exposed

### Cost

~$0.25 fal.ai (6A inpaint pipeline). Sprint 6B/6C/6D = $0 (alle code, geen asset-gen calls).

### Sprint 6 architectuur-leringen

- **Flux Fill werkt voor ADD-geometry** in lege canvas-zones, **niet voor REMOVE met semantic anti-prompt** (sample-bias wint). Voor REMOVE: PIL alpha-erase deterministisch, $0.
- **Refinement-passes zijn risk-prone** (Flux interpreteerde gemaskeerde claw-zone als "small entity attached to disc" → mini-extra-head op v4). Stop bij eerste werkbare result.
- **Injection-pattern voor scene→entity hooks**: `cosmo.attachBombHooks({ throwBomb })` voorkomt circular import (Cosmo zou anders L1Scene moeten importeren).
- **BombTarget interface** als runtime-contract laat 6B en 6C parallel werken zonder file-conflicts. Pattern voor toekomstige cross-system features (e.g. damage-modifiers, status-effects).

### Niet gedaan (Sprint 7)

- Multi-frame Cosmo anim (ControlNet of sketch-to-img — image-to-image bewezen niet)
- Suno-tracks genereren (handmatig via suno.com — niet binnen agent scope)
- Mobile/touch-controls
- Bundle-size optimalisatie (`manualChunks` voor Three.js + Phaser zou de 2.2MB main chunk halveren)

## [0.5.2] — 2026-05-01 — Sprint 5: parallel-team — trampolines, polish, deploy

Vier agents tegelijk: trampolines (5A), Cosmo multi-frame anim test (5B), production deploy (5C), visual polish (5D). Resultaat: cosmos-2026 is **live**.

### 🚀 LIVE op productie
- **https://theuws.com/games/cosmos-2026/** — alle 7 routes HTTP 200
- 87 files / ~19MB FTP upload (~35s)
- Cosmos-card toegevoegd aan `theuws.com/games/` portfolio
- `INVENTORY.md` updated met Cosmos onder "Vlaggenschip Projecten"

### Added (5A trampolines)
- **Trampoline entity** (`src/phaser/entities/Trampoline.ts`) met beat-jump fysica (-820 Y velocity, ~1.8x normal jump), 0.3s cooldown, on-bounce squash-tween, kaleidoscope-spike trigger 1.0
- **Trampoline tile** in level grid: nieuwe `T` legend-character, 2 paren in L1 row 17
- `tile-trampoline.png` (full-scene Flux scene-bias workaround, bottom 25% via `setCrop`)
- `pickup-bounce-burst-cleaned.png` voor on-bounce particle VFX

### Added (5D polish)
- `tile-wall-v2.png` (eindelijk werkend — Flux landscape-bias gefixed met aspect 1024×512)
- `tile-mushroom-v2.png` (close-up mushroom-cap photoreal-then-tinted approach)
- `bg-near-v2.png` lichtere foreground frame voor gameplay-zicht

### Added (5C deploy infra)
- `scripts/postbuild-rewrite-paths.mjs` — herschrijft anchor hrefs en residuele absolute asset paths in `dist/*.html` naar productie-base. Zonder dit breken cross-page navigatie-links op subpath-deploy.

### Changed
- `vite.config.ts` is nu **command-aware** — dev-server blijft op `/`, production-build gaat naar `/games/cosmos-2026/`. Override met `VITE_BASE=/ npm run build` voor root-deploys.
- `package.json` build-script wired postbuild-rewriter aan `npm run build`
- L1Scene preload swap: `tile-wall-v2` + `tile-mushroom-v2` ipv v1
- Slow Bloom biome `bg-near` switcht naar `bg-near-v2.png` met scaleY 0.85

### Sprint 5B image-to-image learnings (productive failure)
- 12 image-to-image attempts (strength 0.55-0.82) → 0/6 pose-shift, 0/6 suction-cup hands
- Diagnose: fal.ai/flux/dev/image-to-image gebruikt input als noise-init, niet als skeletal anchor
- Suction-cup-hands fail is universeel (text-only én image-to-image)
- Workaround voor pose-set: ControlNet/openpose of sketch-to-img (Sprint 6+)
- Workaround voor suction-cups: canonical-fix via Photoshop of masked inpainting eerst
- Frames in `public/assets/sprites/v3/cosmo-walk-*.png` zijn archive-only, NIET wired

### Deploy notes
- Naam-mismatch: lokaal `cosmos-cosmic-adventure-2026`, server `cosmos-2026` (vergt handmatige FTP, `deploy-ftp.sh` gebruikt folder-naam = upload-path)

### Cost
~$0.51 fal.ai (5A: $0.076 + 5B: $0.36 mislukte attempts + 5D: $0.20)

## [0.5.1] — 2026-05-01 — Sprint 4.5 Fase C: Cosmo canonical case study

Cosmo's huidige verschijning was technisch bruikbaar maar miste karakter. De gebruiker speelde Cosmo's Cosmic Adventure in 1992 onder invloed van psychedelica — Cosmo werd onderdeel van die persoonlijke trip-herinnering. Cosmos 2026 is dus geen aesthetic homage maar een herontwerp van een eigen acid-droom. Cosmo moest TE GEK worden + prominenter.

> Die moet echt wel heel duidelijk de 2026 versie van de 'oude' zijn, dat was ook al zo'n trippy ventje met zuignaphanden — Richard, 2026-05-01

### Stap 1 — 6 redesign varianten

We genereerden 6 expliciete bridge-interpretaties van het 1992-DNA naar 2026 cosmic-Moebius. Elk met identieke standing-pose voor 1-op-1-vergelijking.

[grid: /assets/case-study/cosmo-redesigns/cosmo-v1-acid-tenniel.webp /assets/case-study/cosmo-redesigns/cosmo-v2-cosmic-hayao.webp /assets/case-study/cosmo-redesigns/cosmo-v3-moebius-mainline.webp /assets/case-study/cosmo-redesigns/cosmo-v4-pulse-trip.webp /assets/case-study/cosmo-redesigns/cosmo-v5-bart-mushroom.webp /assets/case-study/cosmo-redesigns/cosmo-v6-wide-eye-astronaut.webp "V1 Acid Tenniel · V2 Cosmic Hayao · V3 Moebius Mainline · V4 Pulse-Trip · V5 Bart Mushroom · V6 Wide-eye Astronaut"]

**Kritieke vondst**: Flux Dev kan **NIET text-only zuignap-handen renderen** — 8 van 8 generaties leverden ofwel mensen-vingers ofwel hagedis-klauwen ondanks aggressieve emphasis. Sample-bias > prompt. Workaround: image-to-image of inpainting na text-pass.

### Stap 2 — Richard kiest hybrid

> Hayao met chameleon-eyes, eventueel iets bollere ogen — Richard

We genereerden 4 hybrid-iteraties met chameleon-style bulging eyes. Eerste 2 misten doel (te tame), H3 raakte de roos.

[grid: /assets/case-study/cosmo-redesigns/cosmo-h1-hayao-moebius-suction.webp /assets/case-study/cosmo-redesigns/cosmo-h2-hayao-moebius-suction.webp /assets/case-study/cosmo-redesigns/cosmo-h3-hayao-chameleon.webp /assets/case-study/cosmo-redesigns/cosmo-h4-hayao-chameleon-bigger.webp "H1 + H2 Hayao×Moebius (te tame) · H3 chameleon (te gek!) · H4 alt-iteration"]

> H3 is te gek! — Richard

### Stap 3 — Locked canonical

H3 werd canonical: pear-drop Hayao-head + single antenna met faded-rose flower-bulb tip + BIG bulging chameleon-eyes + soft Hayao watercolor body + faded-rose spots + pink-peach moon halo backdrop. BiRefNet'd voor in-game gebruik.

![Locked canonical Cosmo — Hayao×Moebius+chameleon hybride (H3)](/assets/case-study/_LOCKED-REFERENCE.webp)

### Added
- `research/visual-references/_COSMO-CANONICAL.png` — Cosmo H3 locked
- `public/assets/sprites/v3/cosmo-canonical-cleaned.png` — BiRefNet-cleaned version voor in-game gebruik
- `cosmo_dna.md` memory-file met de complete 1992-DNA-tabel + Fase C learnings
- L1Scene laadt nu canonical Cosmo voor alle 6 states (multi-frame anim komt via image-to-image in Sprint 5+)

### Changed
- Cosmo display-size 80 → 120px voor "TE GEK + prominenter" eis
- Tail wegcrop nog niet gedaan (text-prompt-bias) — kunnen we negeren door body-crop in Phaser

### Known issues
- 6 cosmo-state textures wijzen naar dezelfde canonical PNG (geen multi-frame anim yet)
- Lizard-tail nog zichtbaar op canonical
- Hands zijn niet specifiek zuignap-vorm (sample-bias) — fix via image-to-image of inpainting in Sprint 5

### Cost
~$0.30 fal.ai (10 character-generaties + 1 BiRefNet)

## [0.5.0] — 2026-05-01 — Sprint 4.5: visuele coherentie-pass + TrippyEventDirector

We zochten een visuele waarheid voor de hele game door 4 keyframe-iteraties van een complete L1-scene te renderen. Elke iteratie probeerde een andere art-direction en we lockten v4 (hybrid v1-cosmic-palette × v3-Moebius-linework) als canonical style-stem.

[grid: /assets/case-study/keyframes/L1-keyframe-v1.webp /assets/case-study/keyframes/L1-keyframe-v2.webp /assets/case-study/keyframes/L1-keyframe-v3.webp /assets/case-study/keyframes/L1-keyframe-v4.webp "v1 Pixar-children-book (kawaii drift) · v2 Moebius woodcut (te abstract) · v3 Tenniel woodcut (te dark) · v4 cosmic+Moebius hybrid (LOCKED)"]

> Kies B-hybride (Cosmic Watercolor + kaleidoscope/fluo-pop/datamosh hallucinatie-pieken) — visie-document, locked

Met het v4 keyframe als visuele waarheid genereerden we 22 nieuwe in-game assets allemaal met letterlijk dezelfde style-stem-prefix. Resultaat: ~80% coherentie tussen Cosmo, enemies, tiles, pickups en backgrounds.

### Added
- **TrippyEventDirector** — autonome event-scheduler die elke 8-15s een diëgetisch trippy event vuurt: cosmic-eclipse / spore-cloud / synesthesia-flash / reality-tear / gravity-wobble / star-rain / mushroom-pulse. Weighted-random, 4s cooldown
- **Canonical style-stem** locked in `research/visual-references/_STYLE-STEM.md` op basis van keyframe v4 (hybrid Moebius woodcut + cosmic-saturated palette)
- **22 nieuwe in-game assets** allemaal met letterlijk dezelfde style-stem: 6 Cosmo frames + 3 enemies + 5 painted tiles + 4 painted pickups + 4 parallax-layers
- **4-laagse parallax** (sky / far / mid / near) ipv 3 — biome-config supports optional sky-layer voor extreem diepe cosmic backdrop
- `cosmo_dna.md` memory voor 1992→2026 character-bridge eis

### Changed
- L1Scene preload + populateLevel switcht van procedural Graphics-tiles naar painted PNG tiles
- Star + HintGlobe entities accepteren textureKey parameter — gebruiken painted pickup-art ipv canvas-graphics
- Slow Bloom biome wijst nu naar `slow-bloom-v2/` met de nieuwe 4 layers (cosmic moon-nebula sky, ink-aubergine mountains, glowing magenta-mushroom mid, foreground vines)
- Cosmo display-size 80x80 met aangepaste body-offset voor de painted 1024 sprite

### Visuele richting
v4 keyframe locked: Moebius/Tenniel/Miyazaki linework + cosmic-luminous saturated watercolor palette + paper grain. NIET dusk, NIET kawaii. Het 1992 origineel komt door Cosmo's design heen (moss-sage groen + faded-rose vlekken + antenne met flower-tip + suction-cup-feet).

### Memory
- `visual_coherence.md` uitgebreid met diepte-eis (4 parallax-lagen) + onverwachte-events-eis (TrippyEventDirector)
- `asset_learnings.md` met cosmos-specifieke gotchas: tile-asset trap, BiRefNet niet voor landscapes, fal.ai queue quirks
- `_STYLE-STEM.md` met per-asset-rider templates (sprite / tile / pickup / background-layer)

### Known issues (volgende sprint)
- tile-wall + tile-mushroom v1 werden full landscapes ondanks rider — v2-retry-pattern gevalideerd
- Cosmo's suction-cups landden op voet ipv hands — Fase C (Cosmo case study) gaat dit fixen
- 3/4 backgrounds hebben tiny human-figures ondanks `NO characters` — bekend Flux-bias
- HUD pill version-string nog v0.3.0 — fix volgende sprint

### Cost
~$0.77 fal.ai (22 generaties + 18 BiRefNet + 1 v2-retry)

## [0.4.0] — 2026-05-01 — Sprint 4: post-FX stack — constant trippy

### Added
- **`pmndrs/postprocessing` EffectComposer** stacked op de Three.js parallax renderer — elke frame gaat door post-FX voor render
- `src/three/postFX/postFX.ts` — orchestrator met 3 effect-passes (UV transforms / per-pixel / convolution + composite)
- `src/three/postFX/kaleidoscope.ts` — custom radial-mirror UV shader (N-fold symmetry), strength-driven
- `src/three/postFX/fluidDisplacement.ts` — custom curl-noise 2D-hash displacement, time-driven gentle wobble
- `src/three/postFX/datamosh.ts` — custom horizontal stripe-shift + RGB channel-split, voor damage-pulse

### Permanent base stack (constant-trippy)
- **Bloom** intensity 0.7-1.15 met breathing sine, mipmap radius 0.85 — saffron sun + stars + globes glowen continu
- **ChromaticAberration** offset 0.005-0.009 met radialModulation — cyan/magenta fringing op alle randen
- **FluidDisplacement** amplitude 0.022 frequency 2.6 — wereld wiggelt zachtjes als waterverf in beweging
- **Kaleidoscope** ambient strength 0.16-0.24 met angle rotatie 0.12rad/s — subtiele constante 8-fold symmetry-shimmer
- **Vignette** darkness 0.55, offset 0.28
- **Noise** overlay opacity 0.32 — paper-grain feel constant
- **Datamosh** strength 0 default; spike to 1.0 on damage, decays over 200ms

### Triggered peaks
- Star pickup → `kaleidoTrigger += 0.35` (kaleido pop). Elke 5e star → `kaleidoTrigger = 1.0` (volle peak)
- Spike contact → `damagePulse = 1.0` → datamosh-tear horizontale stripes, decay 200ms

### Changed
- Bg-mid + bg-near layers terug naar `blend: normal` (raw png's hebben transparant gebied al)
- ParallaxScene render gebruikt nu `composer.render()` ipv `renderer.render()`

### Pipeline note
Twee EffectPass-conflicten opgelost door drie aparte passes:
- pass 1: UV-transform (fluid + kaleido)
- pass 2: per-pixel (datamosh)
- pass 3: convolution + composite (chroma + bloom + vignette + noise)

## [0.3.1] — 2026-05-01 — Sprint 3.1: per-biome parallax + visuele polish

### Fixed
- **Parallax-stack toonde 3 verschillende biomes door elkaar** (cathedral / jungle / cave). Refactor: per level wordt nu **één biome** geladen — drie layers (far / mid / near) van DEZELFDE scene. PRD §5.3 conform
- Mushroom-tile zag eruit als dobbelstenen (3 kleine roze stippen). Vervangen door painterly cream-band met faded-rose underglow en flush-zijden voor naadloze tile-merge
- Ground-tile box-grid weggehaald; vervangen door grass-band variatie + sub-ground hint
- Wall-tile vertical wood-grain band ipv volledige rand-outline
- Black backdrop wanneer mid/near layers transparant zijn — ambient clear-color is nu opaque biome-tint

### Added
- `src/data/biomes.ts` — 3 biome configs (Slow Bloom / Inkpool Hollow / Cloud Cathedral) met per-layer parallax-multipliers en LEVEL_TO_BIOME mapping
- 3 nieuwe Slow Bloom backgrounds via Flux Pro: `bg-far.png` (sky + mountains), `bg-mid-cleaned.png` (cream mushroom canopy met BiRefNet alpha), `bg-near-cleaned.png` (faded-rose foreground frame met BiRefNet alpha)
- 3 nieuwe Inkpool Hollow backgrounds (bonus generation) — staan klaar voor S5 wanneer L4-L6 levels landen
- L1Scene gebruikt nu de echte FalSprite Cosmo-frames (walk-1/walk-2/walk-3 + jump-up + jump-fall + cling) met per-state texture-swap

### Changed
- ParallaxScene API: `loadBiome(biome)` ipv hardcoded `loadDefaultBiome()`. Biome wordt geconfigureerd in main.ts en kan straks dynamisch wisselen tussen levels.

## [0.3.0] — 2026-05-01 — Sprint 3: L1 + asset pipeline + audio

### Added
- **L1 "First Steps"** — Bloomroot Veld biome speelbaar op `/play/`. 60×22 grid-level uit `src/data/levelL1.ts` met decoder voor cosmo-spawn, stars, hint-globes, walls, mushroom-platforms, dirt, ground, spikes
- `src/phaser/entities/Star.ts` — bobbing fluo-pop Dewdrop met magenta+lime halo, collect-tween + cleanup
- `src/phaser/entities/HintGlobe.ts` — pulsing saffron+sky-wash orb met proximity-trigger en linger-latch tegen spam
- `src/audio/sfxBus.ts` — Howler-backed SFX + voice playback, lazy-load, silent-fail bij missing files
- `src/phaser/scenes/L1Scene.ts` — eerste echte level scene met SFX-wired collisions, hint-tekst-overlay (Cormorant Garamond italic), ↑↓ camera-pan-offset, debug-HUD met live state

### Audio (8 SFX + 3 voices via ElevenLabs)
- SFX: cling/jump/stomp/hurt + pickup-star/bonus + globe-trigger + bonus-warp (totaal ~$0.37 API kosten)
- Voices: 3 NL Hint Globe lines met Sarah voice (`EXAVITQu4vr4xnSDxMaL`, multilingual_v2, stability 0.6 / similarity 0.8 / style 0.4)
- Suno-prompts gedocumenteerd in `public/assets/audio/music/_SUNO_PROMPTS.md` — 12 tracks D-minor, mapped naar Surface/Hollow/Cathedral biomes
- `_HOWLER_CONFIG.json` met 23 logical-name → file mappings, levelMusicMap, globeVoiceMap
- ElevenLabs sound-generation min-duration is 0.5s (niet 0.3) — SFX-targets aangepast

### Changed
- SandboxScene verwijderd — vervangen door L1Scene als hoofd-scene
- Cosmo controller wired naar sfx-bus: cling-pop / jump / hurt vuren via Howler
- play/index.html HUD-pill nu `v0.3.0 · L1 First Steps`

### Fixed
- Above-fold IntersectionObserver fired niet voor `[data-reveal]` items in viewport — toegevoegd `requestAnimationFrame` first-paint pass + threshold 0.05

### Pipeline
- 6 Cosmo animation-frames staan klaar in `public/assets/sprites/` voor S4 atlas-pack
- Star + HintGlobe entities gebruiken procedural Graphics-textures (geen externe assets nodig)

## [0.2.0] — 2026-05-01 — Sprint 2: Cosmo controller + dual-canvas

### Added
- Three.js + Phaser 4 dual-canvas live op `/play/` — Three.js draait 3-layer parallax achter, Phaser overlay-canvas met transparante background voor 2D gameplay
- `src/core/globalUniforms.ts` — gedeelde state tussen renderers (time, audioFFT, cosmoX/Y/state, kaleidoTrigger, damagePulse)
- `src/core/canvasManager.ts` — single-rAF orchestrator met decay-uniform-helper
- `src/core/inputController.ts` — keyboard met just-pressed-edge-detection voor jump en bomb
- `src/three/parallaxScene.ts` — Three.js OrthographicCamera + 3 textured planes met parallax-multipliers (0.18 / 0.42 / 0.78)
- `src/phaser/entities/Cosmo.ts` — Cosmo controller met state-machine (idle/run/jump/fall/cling/damage/death), suction-cup wallcling, coyote-time, stomp-bounce, i-frames
- `src/phaser/scenes/SandboxScene.ts` — test-arena met procedural tile-textures, ground/walls/stair-steps/high-platform, debug-HUD overlay
- `src/main.ts` — boot-flow met dev-mode `window.cosmos` exposure

### Gameplay
- Suction-cup wallcling werkend — `body.velocity.y > -50` + `!onFloor` + side-touching = cling met `CLING_GRAVITY` 220
- Walljump fires van cling-state met `WALL_PUSHOFF_X` 230 en `WALL_CLIMB_VELOCITY` -320
- Run-speed 200, jump-velocity -460, gravity 1300 — strakke arcade-feel zonder Sonic-acceleration

### Visual
- Procedurele Cosmo placeholder (moss-sage met saffron eye-glow + faded-rose antenna-tip) — 1:1 body-texture match
- Procedurele tile-set (ground sage / walls aubergine / stairs faded-rose / high-platforms saffron)
- Three.js parallax laadt automatisch 3 showcase-backgrounds (cathedral / jungle / cave)

### Fixed
- Body-offset mismatch op cosmo-hero.png (1024×1024 texture vs 28×36 body) opgelost door procedural texture in S2
- `state === jump` werd direct overschreven door post-frame on-floor-check — nu pas overschreven als velocity.y >= 0
- Vite `allowedHosts: true` toegevoegd zodat MCP browser-tests via `host.docker.internal` werken

### Pipeline
- 6 nieuwe Cosmo animation-frames gegenereerd via fal.ai (`public/assets/sprites/cosmo-walk-1/2/3`, `cosmo-jump-up`, `cosmo-jump-fall`, `cosmo-cling`) — staan klaar voor Sprint 3 atlas-pack
- FalSprite gebleken niet als hosted fal.ai endpoint te bestaan; teruggevallen op individuele Flux Dev frames met BiRefNet remove-bg
- 4 nieuwe lessen genoteerd in `shared/reference_asset_gen.md` (FalSprite-status, anti-blur prefix, profile-side-view-wint, tekst-only pose-limits)

## [0.1.0] — 2026-05-01 — Sprint 1: Scaffolding

### Added
- Multi-entry Vite + TypeScript scaffolding (8 HTML entries)
- Site-architectuur naar RoB-blueprint: `/`, `/play/`, `/prd/`, `/updates/`, `/lore/`, `/support/`, `/press/`, `/thanks/`
- Locked CSS design tokens in `public/assets/css/tokens.css` (Cosmos watercolor palette + Cormorant Garamond + Inter + JetBrains Mono)
- Sticky-nav component met paper-grain overlay en vignette
- Reveal-on-scroll IntersectionObserver in `public/assets/js/site.js`
- Auto-generator `scripts/changelog-to-html.mjs` parseert dit bestand naar de updates-page
- Homepage met hero (Cosmo bobbing tegen Cloud Cathedral background), 3-world showcase, numbers grid, about-strip, CTA banner
- Play-launcher placeholder met sprint-progress-bar (Sprint 1/8 = 13%)
- Updates-page met auto-generated timeline-template + first entry (deze release)
- Support-page met "stardust" gamified counter, 4 tiers (Star Spotter / Hint Globe Sponsor / Bonus Room Builder / Episode Patron), 7-vraag FAQ
- Lore-page met 3-bioom verhaal (Slow Bloom · Inkpool Hollow · Cloud Cathedral) + cast-grid
- Press-page met factsheet, key art-grid en 5 suggested angles
- Thanks-page voor post-donation flow

### Decisions
- Visual: B-hybride (Cosmic Watercolor base + kaleidoscope/fluo-pop/datamosh hallucinatie-pieken)
- Architecture: Dual-canvas (Three.js root + Phaser 4 overlay)
- Scope v1.0: MVP — Episode 1 (10 levels)
- Titelthema: eigen-DNA (geen Tush-cover)
- Enemy roster: 12 types + 1 boss (4 buffer boven minimum)
- Site-laag: vanilla HTML/CSS/JS multi-entry Vite (RoB-blueprint, geen framework)
- Donation: Mollie placeholder voor Sprint 5 activatie; e-mail werkt direct in v0.1.0

### Pipeline
- 8 fal.ai showcase-assets (Cosmo + 4 enemies + 3 backgrounds + logo) — verplaatst naar `public/showcase-assets/`
- gitignore-whitelist toegevoegd voor `cosmos-cosmic-adventure-2026/`
- Eerste push naar `github.com/RichardTheuws/game-master.git`
