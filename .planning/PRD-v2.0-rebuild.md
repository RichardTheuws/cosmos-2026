# PRD v2.0 — Zorp's Universe ground-up rebuild

**Version target**: 1.0.0
**Date**: 2026-05-02
**Status**: APPROVED — pivot van platformer naar rhythm-trip
**Predecessor**: v0.8.0 (live op theuws.com/games/cosmos-2026/, platformer-experiment)
**Source pitches**: `pitch-D-rhythm-beat-trip.md` (primary) + `pitch-C-trip-room-toy.md` (filosofie)

---

## 1. Wat is dit?

**Cosmos** is een mobile-first hypnotiserende rhythm-trip. Geen levels, geen game-over, geen ego-flex score. Cosmo (40% schermgroot, dead-center) reageert in real-time op de muziek via een 8-band FFT-rig — head-bob op kicks, body-pulse op sub, antenne-flap op air. De speler tapt cosmic-bubbles op het beat om combo's te bouwen. Mismatched timing = cosmetic miss, niet punishment. Geen taps = auto-VJ-mode (track loopt door, Cosmo grooved zelf, post-FX gaat door).

**Pitch-zin**: *"Geen game. Geen score. De track is de game. Cosmo woont hier — raak hem aan op het beat."*

**Doelgroep**:
- Stoners (hypnose, locked-in, no-reflex-pressure)
- Focus-zoekers (15-min mindfulness alternatief)
- TikTok-creators (audio-first algoritme bait)

---

## 2. Core loop (30 sec gameplay)

**Open**: Speler opent app op iPhone in portrait. Cosmo staat dead-center, ademend. Eerste track (title-theme) start auto bij eerste tap (autoplay-policy unlock). Geen tutorial. Geen UI behalve een minimale "version pill".

**0-5s**: Cosmo bobt op het beat. 8-band FFT bridge stuurt bloom (lows), kaleido (mids), fluid wobble (highs). Wereld ademt mee. Twee soft cosmic-bubbles drijven van onderen omhoog langs Cosmo, op-beat (kick + snare).

**5-10s**: Speler tapt op een bubble op het juiste moment (perfect ±150ms). Bubble bursts in pop-magenta + saffron-glow burst. Combo counter (kleine cijferfade-in rechts-onder) springt naar 1. Post-FX bloom bursts kort, dan terug naar baseline.

**10-30s**: Patroon herhaalt. Bij combo 8 triggert auto `startHallucination(HALLUCINATION_PEAKS)` — een hallucination-peak overlay-track loopt 30s mee, kaleidoscope intensiveert, Cosmo's antenne-bloem opent volledig. Speler kan blijven tappen (combo telt door, perfect-runs kan oneindig) of ophouden — auto-VJ neemt over.

**Geen game-over**: vallen, missen, ophouden — alles wordt geabsorbeerd door auto-VJ. De track loopt sowieso door tot het einde, dan crossfade naar volgende biome.

---

## 3. Mobile gestures (5 stuks)

| Gesture | Effect | Wanneer |
|---------|--------|---------|
| **Tap on target** | Burst bubble, combo+1 op perfect timing | Primary loop |
| **Hold-tap (anywhere)** | Build-up — Cosmo crouch, post-FX dim, op release: shockwave + extra combo-kick | Optionele power-move |
| **Swipe horizontal** | Tempo-shift — track speed shift ±10% voor 4 seconden | Stoner-experiment |
| **Pinch-zoom** | Camera dolly in/out op Cosmo (50% → 80% screen) | Visual control |
| **Long-hold center 3s** | Deep-trip mode — alle post-FX naar max, één hallucination forced-trigger, 15s peak-immersion | Day-30 unlock |

**One-hand-bedienbaar**: ja. Alle gestures zijn met duim haalbaar in portrait.

**No-input fallback**: na 8s geen interactie → auto-VJ. Cosmo grooved zelf, bubbles bursten zichzelf op de beat (auto-perfect), post-FX-cycle gaat door. Track loopt af, biome switcht. Speler kan 30 min weg zijn zonder dat er iets stopt.

---

## 4. Cosmo center-stage (40% screen, dead-center)

**Source asset**: `cosmo-canonical-v2-cleaned.png` (Hayao×Moebius+chameleon hybrid, suction-cup pads, faded-rose spots). Sprint 13D: upscale naar 4K via Real-ESRGAN voor crisp render op high-DPI mobile.

**8-band FFT-rig** (uses existing `globalUniforms.audioFFT[0..7]`):
- **Band 0 (sub, 0-375 Hz)**: body-pulse Y-scale × 0.04
- **Band 1 (bass, 375-750 Hz)**: head-bob Y-translate × 4px
- **Band 2-3 (low-mid + mid)**: faded-rose spots glow opacity × 0.3
- **Band 4 (high-mid)**: chameleon-eye iris-shimmer rotation × 8°
- **Band 5 (air)**: antenne-bloem flap rotation × 12°
- **Band 6-7 (tape-hiss + sparkle)**: outline-jitter Phaser tint pop-cyan × 0.15

Alles per-frame uit FFT-bridge. Geen Phaser tweens. Pure shader-driven. Result: Cosmo voelt LEVEND, reageert op alles wat klinkt, wordt nooit statisch.

**Idle micro-acties** (uit pitch C):
- Blink elke 4-7s (random)
- Antenne-bloem zwiept lichtjes met sub-band
- Yawn elke 30-60s in auto-VJ-mode
- Look-around (kleine head-tilt) bij no-input >12s

---

## 5. Biome-cycling (4 base-tracks = 4 biomes)

| Biome | Track | BPM | Post-FX intensity-curve | Visual focus |
|-------|-------|----:|--------------------------|--------------|
| **Slow Bloom** | `slow-bloom-loop.mp3` | 86 | bloom 60% / kaleido 20% / fluid 30% | Mushroom forest, soft pinks |
| **Inkpool Hollow** | `inkpool-loop.mp3` | 78 | bloom 40% / kaleido 80% / fluid 70% | Deep aubergine, kaleido-heavy |
| **Cloud Cathedral** | `title-theme.mp3` | 92 | bloom 100% / kaleido 60% / fluid 40% | Bloom-pierce, sky-wash |
| **Boss Stinger** | `boss-stinger.mp3` | 96 | bloom 80% / kaleido 50% / fluid 60% / chroma max | Saffron-storm, pop-magenta climax |

Biome switch:
- **Auto**: na track-end crossfade (4s) naar volgende
- **Player-trigger**: long-hold 3s = forced-switch (alleen na day-1 unlock)

Background: `slow-bloom-v2/bg-{sky,far,mid,near}.png` blijft als basis (parallax). Andere biomes via post-FX-curves alleen — geen 4 aparte background-sets nodig (volgens pitch-D asset-audit).

---

## 6. Scoring (zonder ego)

- **Combo counter** rechtsonder, klein, 12px JetBrains-Mono. Telt perfect taps. Reset bij 1 miss.
- **Tap-count totaal** als sub-stat, niet permanent zichtbaar.
- **No leaderboards. No competitive.** Persoonlijke combo-record wordt lokaal opgeslagen, alleen jij ziet het.
- **Combo-thresholds triggeren EVENTS** (niet rewards):
  - 8 → hallucination-peak overlay
  - 16 → kaleidoscope-intensify event
  - 32 → "vibe peak" auto-screenshot
  - 64 → deep-trip mode forced (alleen mogelijk in 1 specifieke track)

---

## 7. Virale share-mechanismen

5 share-momenten, allemaal friction-free:

1. **60s gameplay clip-export** met Suno-track + tap-graphic-overlay → directly shareable op TikTok. Hero-feature. MediaRecorder API + canvas + audio-mix. Browser-natuurlijk.
2. **Auto-screenshot bij synesthesia-piek** (combo 32+): Cosmo + biome + track-name + tap-count gerenderd op een share-card.
3. **Daily-streak badge**: "Dag 7 in de trip" — kleine vibrant share-card.
4. **Friend-pass-the-trip link**: shareable URL met track-deep-link en daily-seed (de bubble-pattern is dezelfde voor jou en je vriend op die dag).
5. **Audio-only quote-card**: 15s loop fragment met Cosmo-portrait, "I tapped this — ${trackName}".

---

## 8. Onboarding (geen tutorial)

- **0-3s**: Splash met Cosmo logo, faded-rose breath. "Tap to begin" microcopy onder.
- **3-8s**: Cosmo verschijnt, eerste bubble drift omhoog. Het beat begint (track unlocks AudioContext op de eerste tap).
- **8-15s**: Bubble komt langs Cosmo. Tap-on-bubble = burst. Discover.
- **15-30s**: Combo counter verschijnt rechtsonder. No words. Pure feedback.
- **30s+**: Hallucination triggert eerste keer op combo 8. Magic moment.

Geen text-tutorial. Geen "tap here" arrow. Discover-by-doing. Volgens pitch-C-filosofie.

---

## 9. Anti-stress design

- **Impossible to fail**: missed taps zijn niet hoorbaar/zichtbaar als negativiteit. Bubble drijft door ongeklikt, dat is het.
- **Geen tijdsdruk**: bubbles drijven traag (~3-4s on screen).
- **Geen reflex-eisen**: telegraph 1.5-2.0s tussen verschijnen-bubble en moment-of-tap.
- **Geen game-over screen**: track-end = biome-cross-fade, niet "GAME OVER".
- **Speler kan WEGLOPEN**: 30 min later is alles nog mooi. Auto-VJ blijft.
- **DND-detectie** (uit pitch-C): als notificatie binnenkomt, fade post-FX licht uit (respect screen-sharing context).

---

## 10. Codebase impact

### Wat BLIJFT uit v0.8.0:
- `src/audio/audioFFTBridge.ts` (Sprint 6D + 8B + 10) — core asset
- `src/audio/sfxBus.ts` — Howler-bus
- `src/three/parallaxScene.ts` — biome-background renderer
- `src/three/postFX/*` — bloom, chroma, kaleido, fluid, datamosh, trippyEventDirector
- `src/core/globalUniforms.ts` — uniforms naar shaders
- `src/core/inputController.ts` (Sprint 7B virtual-input merge blijft)
- `src/core/deviceDetect.ts`
- `src/ui/touchOverlay.ts` — wordt vereenvoudigd, geen d-pad meer (geen platformer)
- `src/core/assetPath.ts`
- `public/assets/audio/music/*.mp3` — alle 7 tracks blijven
- `public/assets/sprites/v3/cosmo-canonical-v2-cleaned.png` — hero asset
- `public/assets/backgrounds/slow-bloom-v2/*` — parallax base
- `public/assets/case-study/*` — historisch
- `scripts/postbuild-*.mjs` — build pipeline (DIST_DIR support)

### Wat WEG gaat:
- `src/phaser/scenes/L1Scene.ts` — vervangen door `src/phaser/scenes/BeatScene.ts`
- `src/phaser/entities/{Cosmo,Bomb,BreakableWall,HintOrb,Star,Trampoline}.ts`
- `src/phaser/entities/enemies/*` — geen vijanden meer
- `src/phaser/hud/HudOverlay.ts` — Sprint 11B HUD weg, vervangen door minimale combo-counter + version-pill
- `src/data/{biomes,levelL1}.ts` — geen levels, biomes worden runtime
- Alle tile-assets `public/assets/tiles/*` — niet meer nodig
- Alle enemy-sprites `public/assets/sprites/v{2,4}/enemy-*` — niet meer nodig
- Alle bomb-assets `public/assets/bombs/*` — niet meer nodig
- Alle pickup-assets behalve eventueel star (kan blijven als bubble-decoratie)

### Wat NIEUW:
- `src/phaser/scenes/BeatScene.ts` — main scene, single-screen
- `src/phaser/entities/CosmoRig.ts` — FFT-driven Cosmo met 8-band-rig
- `src/phaser/entities/BeatTarget.ts` — cosmic-bubble met perfect/good/miss timing
- `src/phaser/entities/AutoVJ.ts` — auto-tap-mode logic
- `src/audio/beatmap.ts` — JSON-DSL beatmap loader + per-track tap-pattern
- `src/audio/onsetDetector.ts` (offline) — FFT-based beatmap auto-extractor
- `src/share/captureClip.ts` — MediaRecorder 60s clip export
- `src/share/screenshotCard.ts` — synesthesia-piek auto-screenshot composer
- `public/assets/beatmaps/*.json` — per-track beatmaps
- `public/assets/sprites/cosmo-canonical-4k.png` — Real-ESRGAN upscale
- 6 abstracte tap-target sprites (cosmic-bubble variants) — canvas-drawn primitives, geen fal.ai-genereren

---

## 11. Sprint roadmap (4 sprints, ~2-3 weken)

| Sprint | Scope | Owner |
|--------|-------|-------|
| **13A** | Strip + foundation (BeatScene, CosmoRig met FFT, gestures, auto-VJ) | general-purpose |
| **13B** | Beatmap system + onsetDetector + 1 track manual fine-tune (title-theme) | general-purpose |
| **13C** | Biome-cycling + share-mechanismen (clip + screenshot) | general-purpose |
| **13D** | Asset upgrades (Cosmo 4K, tap-target primitives, removed-asset cleanup) | Asset Generator |
| **13E** | Deploy v1.0.0 (landing-copy update, FTP, browser-MCP verify) | Game Deployer |

13A-13D parallel. 13E blocked op alle 4.

---

## 12. Success criteria voor v1.0.0 launch

- [ ] Mobile portrait first-run: Cosmo center, beat audible, eerste bubble tap-bare in <8s
- [ ] 60s gameplay clip-export werkt op iPhone Safari
- [ ] Auto-VJ blijft draaien zonder interactie 5+ minuten
- [ ] Hallucination-peak triggert correct op combo 8
- [ ] 4 biomes cyclen automatisch, geen 404s, geen jank
- [ ] post-FX 60fps op iPhone 14 baseline
- [ ] Combo counter persistent in localStorage
- [ ] Geen platformer-relics zichtbaar (geen tiles, geen enemies, geen bombs, geen HUD-pill clutter)
- [ ] Landing-copy "Geen game. Geen score." live
- [ ] Browser-MCP playwright test: 0 console errors, screenshot bewijst nieuwe vibe

---

## 13. Open vragen voor pre-sprint goedkeuring

1. **Track-volgorde**: title-theme als opener of als "climax" biome? PRD-default = title als climax, slow-bloom als opener (rustigste).
2. **Combo reset op miss**: harde reset of decay (-1 per miss)? PRD-default = harde reset, simpler en duidelijker.
3. **Day-30 deep-trip unlock**: progressie via localStorage of via QR/link? PRD-default = localStorage (zero-server).
4. **Friend-seed sharing**: hoe sync je daily-seed? PRD-default = `?seed=YYYYMMDD` URL-param.
5. **Real-ESRGAN budget**: ~$0.05 voor één upscale, OK?

---

## 14. APPROVED — Asset budget $10 (2026-05-02)

User goedgekeurd: $10 budget voor visuele next-level bumps. Doel: "ik moet al moeite hebben om te stoppen met de eerste demo".

**Allocation**:
- Cosmo 4K hero render (Recraft V3 of Flux Pro Ultra + ESRGAN): $0.40
- 8 cosmic-bubble tap-targets (Flux Pro v1.1 + BiRefNet): $0.80
- 4 biome backgrounds upgrade (Flux Pro Ultra, 4K parallax-ready): $2.00
- Synesthesia-piek share-card template (Recraft V3): $0.20
- Splash + landing-hero (Flux Pro Ultra, TikTok-bait): $0.40
- 6 hallucination-particle textures (Flux Dev + BiRefNet): $0.40
- Promo-trailer 5 keyframes (Flux Pro v1.1): $0.30
- ESRGAN upscales: $0.20
- **Quality buffer (regen tot wow-factor)**: $5.30

Quality > quantity. Geen "good enough" — als de eerste poging er retro/clichee/Flash uit ziet, regenereren met andere prompt-strategie of model-pick. Sprint 13D Asset Generator agent krijgt expliciete autonomie tot wow-criteria gehaald zijn.

---

**Approval needed**: lees het door, geef akkoord (of corrigeer), dan spawn ik 4 build-agents parallel.
