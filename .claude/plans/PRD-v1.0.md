# Zorp's Universe — PRD v1.0

**Status**: Draft → ter goedkeuring
**Datum**: 2026-04-30
**Owner**: Game Master (Richard Theuws)
**Build target**: v1.0.0 — MVP, 1 episode (10 levels)
**Codename**: `cosmos-2026`

---

## 1. Vision

Een 2.5D browser-platformer — een retro-geïnspireerde alien-avontuurgame — als **psychedelische Ghibli-aquarel-droom** met hallucinaire breekpieken. Het 2D-gameplayplane blijft strak en eerlijk (Cosmo's identiteit = tactiele zuignap-platforming); de 3D-parallax + post-FX laag breekt en bloeit eromheen.

**One-line pitch**: *"Een retro alien-avontuur herboren als Tenniel-droom: aquarel-Ghibli-werelden die op power-ups, damage en bonus-momenten in fractal-tunnels en datamosh-scheuren openbarsten."*

**Doelgroep**: nostalgische 90s-platformer-fans + indie-gamers die "art-direction first" titels zoeken (Hyper Light Drifter, Hollow Knight, Gris-publiek).

**Distributie**: primair **theuws.com/games/cosmos-2026** (FTP). Bij succes: eigen subdomain **cosmos.theuws.com** en eigen landing page.

---

## 2. Locked Decisions

| # | Beslissing | Keuze |
|---|------------|-------|
| 1 | Visual direction | **B-hybride** — Cosmic Watercolor base + kaleidoscope (power-up, 5s) + fluo-pop accent (collectibles/HUD, 5% pixel-budget) + datamosh-tear (damage, 200ms) |
| 2 | Architectuur | **Dual-canvas** — Three.js (WebGPURenderer) als root voor 3D parallax + post-FX, Phaser 4 als overlay-canvas voor 2D gameplay, gedeelde uniforms via globalUniforms object |
| 3 | Scope v1.0 | **MVP — Episode 1 (10 levels)** — Forbidden Planet biome (jungle/forest/ghost-haunt/industrial-intro) |
| 4 | Frozen Easter egg | **Geparkeerd** voor E2 — wordt Frozen RoB-eenheid (DLC-fase) |
| 5 | Titelthema | **Eigen-DNA** — geen cover van een bestaand titelthema. Suno-prompt vangt een retro funk-zany-spirit zonder bekende melodieën. Brief: folktronica-koto + analog-warmth + lichte rock-undertow. |
| 6 | Platform | **Browser, desktop-first** — mobile/touch is post-MVP |
| 7 | Language | **TypeScript strict** + Vite |

---

## 3. Core Mechanics

### 3.1 Cosmo (player)
- **Movement**: run + jump (single jump, geen double jump). Constante run-speed (geen Sonic-acceleration). Strakke arcade-feel.
- **Suction-cup wallcling** *(signature)*: tegen verticale wall drukken → cling. Spring + cling + spring = wallclimb. **Niet** op ceilings. SFX: ElevenLabs-gegenereerde "plop". Visueel: kleine wet-edge ink-bleed-puls op cling-punt.
- **Stomp**: spring op enemies om te killen. Sommige vereisen 2 stomps.
- **Bombs**: max 9 dragen, plaatsen via secondary key, vertraagde explosie 2s, kan walls (Monuments — 3 bombs) + Eye Plants vernietigen, kan Cosmo zelf raken.
- **Camera pan**: ↑/↓ pijltjes pannen camera 1 tile-blok om sterren boven/onder schermrand te onthullen.

### 3.2 HP & Damage
- 3 HP base, max 5 via 1 verborgen cheeseburger in E1.
- Power-Up Module (visueel: aquarel-paddenstoel) = +1 HP.
- Geen mid-level checkpoints — dood respawnt op level-start, alle stars dat run kwijt.
- Vallen in chasm = instant respawn, geen HP-verlies.
- **i-frames**: 1.2s na damage — visueel datamosh-tear 200ms + flicker.

### 3.3 Saves
- Save-anywhere via 3 slots (`cosmos-save-1/2/3`) in localStorage.
- JSON-payload: episode, level, stars, HP, max-HP, bombs, secrets-found.

### 3.4 Score & Bonuses
- Stars = primaire collectible (visueel: saffron-glow Dewdrops met sky-wash blue swirl).
- Bonus-room thresholds: 25 stars (Bonus 1), 50 stars (Bonus 2). Single bonus-room in MVP (25-threshold).
- Hidden 50K bonuses: stomp 10 enemies airborne, blow up 15 Eye Plants, stomp alle barrels.
- Hint orb vernietiging = 12.800.
- Hint orb contact = ElevenLabs-voice tip + 0 score.

---

## 4. Episode 1 — "Forbidden Planet"

### 4.1 Plot
Cosmo's familie maakt een uitstapje voor zijn verjaardag. Een komeetinslag dwingt een noodlanding op een onbekende planeet. Cosmo wandelt af, ouders zijn bij terugkomst weg — opgeslokt door een blob? Hij gaat de jungle in. (Ware plot-twist komt in E2/E3 — voor MVP eindigt E1 met cliffhanger: Cosmo wordt opgeslokt door reuzen-blob.)

### 4.2 Level-architectuur (10 levels)

| # | Level | Sub-biome | Mechanic-introductie | Iconisch element |
|---|-------|-----------|----------------------|------------------|
| L1 | "First Steps" | Bloomroot Veld (jungle) | Run, jump, eerste cling | Tutorial hint orbs |
| L2 | "Up the Glow-Trees" | Bloomroot Veld | Verticale wallclimb | Sterren boven schermrand (camera-pan reveal) |
| L3 | "The Hidden Hover" | Bloomroot Veld → industrial transitional | Hovercraft (verborgen) | Verborgen scooter geeft 30s flight-section |
| L4 | "Whispers in the Hollow" | Slow Bloom mushroom forest | Ghost-enemy (beweegt alleen als Cosmo wegkijkt) | Boo-mechanic + paper-grain-dither piek |
| L5 | "Through the Tube" | Mushroom forest → cave-edge | Green-tube teleporters | Eerste **kaleidoscope-FX trigger** (5s tijdens teleport) |
| L6 | "Star Hunter" | Inkpool Hollow (cave) | Bombs introductie | Monument wall (3 bombs) verbergt cheeseburger |
| L7 | "The Sap Factory" | Industrial-organic hybrid | Conveyors, bomb-management | Eerste industrial-tilset (E3-foreshadowing) |
| L8 | "Above the Spires" | Cloud Cathedral (sky) | Spring-trampolines, beat-jumps | Halo Spire parallax-piek (3D Meshy-props prominent) |
| L9 | "The Star Bridge" | Sky → blob descent | Combo all mechanics | Bonus-room-warp bij 25-star reach (kaleidoscope tunnel 8s) |
| L10 | "The Blob" | Mini-arena | Boss fight | Stomp 5x → cliffhanger cutscene (Theatre.js) |

**Bonus Room** (25-star unlock): no-enemy floating island — pure star/gem hunt, 90s timer, kaleidoscope edge-tunnel als ambient state.

### 4.3 Enemy roster (MVP — 12 types + 1 boss, "+4 buffer" boven minimum)
| Naam | Stomps | Gedrag | Variant-skin |
|------|--------|--------|--------------|
| Brumberry | 1 | Patrol left-right | Forest-deep berry, faded-rose tendrils |
| Hopper Cabbage | 1 | Hops at intervals | Moss-sage cabbage with sleepy eye |
| Parachute Drifter | 2 | Floats slowly down, na 1 stomp drops fast | Mushroom-cream parachute jellyfish |
| Eye Plant | bombs only | Static, schiet projectile | Aubergine eye-stalk, 1 bomb-pickup reward |
| Pink Worm | 1 | Burrows, surfaces near Cosmo | Faded-rose with saffron underbelly |
| Ghost (L4 only) | invincible | Moves only when Cosmo faces away | Translucent ink-aubergine wisp |
| Spitting Wall Plant | bombs only | Static turret, spits acid | Deep-forest stalk, 3-shot pattern |
| **Dragonfly** *(buffer)* | 1 | Sinusoidal flight pattern, dive-attack | Sky-wash blue with iridescent saffron wings |
| **Flying Wisp** *(buffer)* | 1 | Slowly homes naar Cosmo | Faded-rose translucent orb met inkt-trail |
| **Suction Crawler** *(buffer)* | 2 | Klimt walls + ceilings (mirror van Cosmo) | Forest-deep insectoid, mushroom-cream zuignap-tips |
| **Tulip Launcher** *(buffer)* | 1 | Static, lanceert Cosmo omhoog bij contact (positief gimmick, schade bij hostile-modus) | Saffron-rose tulip met spring-stamen |
| Spark Hazard | n.v.t. (hazard) | Volgt rail in industrial L7 | Phosphorescent saffron arc-jolt |
| **Boss "The Blob"** | 5 | 3-phase: drops + slams + spawns | Massive ink-aubergine ooze, eye-cluster |

### 4.4 Hazards
Floor Spikes (statisch + retracting), Wall Spikes, Bear Trap, Flame (small + intermittent), Choke-Spore vents, Acid Geyser, Falling Floor Block, Force Field Beam.

### 4.5 Pickups
Stars (saffron Dewdrops), Power-Up Module (aquarel paddenstoel), Bomb refill (3-pack), Cheeseburger (hidden, 1x in L6 monument-wall), Score-fruits (8 varianten, low-priority polish), Invincibility Cube (1.5s, kaleidoscope ambient).

---

## 5. Visual Direction (locked: B-hybride)

### 5.1 Base (90% pixel-budget)
**Cosmic Watercolor** — Ghibli × Moebius × Tenniel-Alice. Hand-painted aquarel met ink-line underdrawing, paper-grain texture, wet-edge bleeds, ragged inkt-outlines.

**Palette (locked)**:
- `#E8D5B7` Mushroom Cream
- `#7B9E89` Moss Sage
- `#4A6FA5` Sky Wash Blue
- `#B85C7E` Faded Rose Bleed
- `#3D2E4A` Ink Aubergine
- `#F4A261` Saffron Glow
- `#2D4A3E` Forest Deep

### 5.2 Hallucinaire breekpieken
| Trigger | Effect | Duur |
|---------|--------|------|
| Power-up oppakken | Kaleidoscope edge-tunnel 6-fold spiegel rond viewport, midden normaal | 5s |
| Bonus-room warp | Kaleidoscope ambient (continu, lichter) | hele bonus-room |
| Collectibles (stars/gems) on-screen | Fluo-pop accent — `#FF2D95` + `#7AFF3D` halo bloom op item | continu |
| HUD elementen | Fluo-pop accent — magenta + lime op nummers/iconen | continu |
| Damage taken | Datamosh-tear — horizontale stroken verschuiven | 200ms |
| Boss-intro | Kaleidoscope + 8-bar A-stijl hyperpop-stinger in dezelfde toonsoort | 8 bars |

### 5.3 3D parallax-laag (Meshy v6)
3-layer parallax via Three.js scene:
- **Far**: distant mountains/spires/gas-planet — low-poly Meshy GLTFs, atmospheric haze shader
- **Mid**: floating islands, distant flora — mid-poly, light TSL fluid distortion
- **Near**: foreground frame-elements (drooping vines, mushroom-stalks) — hi-poly, parallax 1.5x of camera-x

### 5.4 Post-FX stack (TSL nodes via Three.js + pmndrs/postprocessing op Phaser canvas)
Permanent: paper-grain dither (intensity 0.15), soft bloom (threshold 0.85, intensity 0.6), wet-edge fluid distortion (amplitude 1.2px, low-freq).

Triggered: kaleidoscope-tunnel pass, RGB-shift datamosh, fluid-sim curl-noise on DMT-peaks.

### 5.5 Anti-patronen (geblokkeerd in asset-generator memory)
- Geen emoji's (canvas roundRect/arc voor primitieven)
- Geen Roblox/Among-Us silhouetten
- Geen photorealistische textures op tiles
- Geen unicode-glyph references
- BiRefNet remove-bg verplicht voor Flux-sprites (Flux levert nooit transparant)

---

## 6. Audio Direction

### 6.1 Suno OST (10 tracks + 2 stingers)
**Stijl**: acoustic-folktronica + ambient-koto, Hisaishi × Boards of Canada. Field-recording crickets, wooden flute high-register, analog tape hiss. 80-100 BPM most levels, 110-120 in industrial.

| # | Naam | Levels | Notes |
|---|------|--------|-------|
| 1 | "Welcome" | Title screen | Eigen titelthema — folktronica + zany rock-undertow, koto + analog-warmth |
| 2 | "First Light" | L1, L2 | Gentle intro, koto + bird-loops |
| 3 | "The Glow-Trees" | L3 | Builds to flute-lead op hover-section |
| 4 | "Whispers" | L4 | Sparse, ambient, ink-aubergine droning |
| 5 | "Tube Songs" | L5 | Granular-synth-friendly, plays under kaleidoscope |
| 6 | "Inkpool" | L6 | Cave-echo reverb, water-drops |
| 7 | "Sap & Steam" | L7 | Industrial-folk, wooden percussion |
| 8 | "Sky Cathedral" | L8 | Spacious, sweeping, harp + flute |
| 9 | "Bridge of Stars" | L9, Bonus | Counterpoint, optimistic |
| 10 | "Blob's Lament" | L10 boss | 3-phase build, climax + cooldown |
| Stinger A | "Hyperpop Boss-Open" | Boss-intro 8 bars | Sophie/Toby Fox stijl, contrastief |
| Stinger B | "Datamosh Damage" | Player-damage 200ms | Compressed white-noise + hit-stab |

### 6.2 ElevenLabs SFX & Voice
**SFX**: zuignap-pop (cling), spring-trampoline-sproing, jump-pad-fwoosh, stomp-splat, bomb-fizz + boom, pickup-tinkle, star-chime, cheeseburger-fanfare-1bar, datamosh-glitch.

**Voices** (hint orbs — 8 unieke lines minimum):
- Stem-cast: warm-vrouwelijk, mid-range, lichte verwondering. Eén voice voor alle orbs (consistente "narrator van deze wereld").
- Lines per level: 1-2 hints, 1 cosmetic flavor, 1 secret-tease.

### 6.3 Tone.js procedural layer
- `Tone.GrainPlayer` op Suno-tracks tijdens kaleidoscope-state — time-stretch 1.5x zonder pitch-shift.
- 512-FFT analyzer → globalUniforms.audioFFT[8] → TSL fluid-sim amplitude.

### 6.4 Howler.js layer
Static playback voor SFX-sprites + music-loops met spatial audio voor environmental loops (waterval in L6, machinery in L7).

---

## 7. Tech Architecture

### 7.1 Folder structure
```
cosmos-cosmic-adventure-2026/
├── .claude/
│   └── plans/
│       └── PRD-v1.0.md (this file)
├── research/
│   ├── 00-VISION-SYNTHESIS.md
│   ├── 01-original-game.md
│   ├── 02-tooling-2026.md
│   └── 03-visual-directions.md
├── public/
│   ├── assets/
│   │   ├── sprites/        (FalSprite output → free-tex-packer atlas)
│   │   ├── backgrounds/    (Flux Pro v1.1 → optimized PNG)
│   │   ├── meshy/          (GLTF parallax props)
│   │   ├── audio/
│   │   │   ├── music/      (Suno tracks)
│   │   │   ├── sfx/        (ElevenLabs SFX)
│   │   │   └── voices/     (ElevenLabs hint-orb lines)
│   │   └── tilemaps/       (Tiled JSON exports)
│   └── shaders/
│       └── tsl/            (Three Shader Language modules)
├── src/
│   ├── main.ts             (entry, dual-canvas setup)
│   ├── core/
│   │   ├── globalUniforms.ts  (shared time, audioFFT, gameState)
│   │   ├── canvasManager.ts   (orchestrates 2 canvases)
│   │   └── inputController.ts
│   ├── three/
│   │   ├── parallaxScene.ts   (3D parallax-layer composition)
│   │   ├── postFX/
│   │   │   ├── kaleidoscope.ts
│   │   │   ├── fluidSim.ts    (Pavel Dobryakov port)
│   │   │   ├── paperGrain.ts
│   │   │   └── datamosh.ts
│   │   └── cinematics/        (Theatre.js scenes)
│   ├── phaser/
│   │   ├── scenes/
│   │   │   ├── BootScene.ts
│   │   │   ├── TitleScene.ts
│   │   │   ├── LevelScene.ts (parameterized per level)
│   │   │   ├── BonusScene.ts
│   │   │   └── BossScene.ts
│   │   ├── entities/
│   │   │   ├── Cosmo.ts       (player controller + wallcling)
│   │   │   ├── enemies/       (8 enemy classes)
│   │   │   ├── HintOrb.ts
│   │   │   └── pickups/
│   │   ├── systems/
│   │   │   ├── damageSystem.ts
│   │   │   ├── collectibleSystem.ts
│   │   │   ├── saveSystem.ts
│   │   │   └── hudSystem.ts
│   │   └── filters/           (Phaser 4 Filter pipeline configs)
│   ├── audio/
│   │   ├── musicDirector.ts   (Howler + Tone.js orchestration)
│   │   ├── sfxBus.ts
│   │   └── fftBridge.ts       (audio → globalUniforms)
│   └── data/
│       ├── levels/            (Tiled JSON + level configs)
│       ├── enemies.json
│       └── hintLines.json
├── scripts/
│   ├── generate-spritesheet.sh   (FalSprite wrapper)
│   ├── generate-background.sh    (fal.ai Flux Pro wrapper)
│   ├── pack-atlas.sh             (free-tex-packer-cli)
│   └── deploy.sh                 (delegates naar parent deploy-ftp.sh)
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── VERSION                    (start: 0.1.0)
├── CHANGELOG.md
└── README.md
```

### 7.2 Dual-canvas orchestration
- Three.js canvas (`#scene-canvas`) achter — z-index 0, full-viewport, WebGPURenderer.
- Phaser canvas (`#game-canvas`) voor — z-index 1, full-viewport, transparent background, alpha:true.
- Single `requestAnimationFrame` loop in `main.ts`:
  1. Update globalUniforms (time, audioFFT, gameState.cosmoX, gameState.cosmoY, gameState.kaleidoTrigger)
  2. Update Phaser scene → render (passes globalUniforms to its filters)
  3. Update Three.js scene → renderer.render() (TSL nodes lezen globalUniforms)
- Camera-sync: Three.js camera-X volgt Phaser camera-X met parallax-multipliers per layer (0.2 / 0.5 / 1.5).

### 7.3 Performance budgets
- Bundle: < 5MB gzipped (excl. assets).
- Assets: < 30MB total v1.0 (sprites < 10MB, backgrounds < 8MB, meshy < 6MB, audio < 8MB).
- Target: 60fps on M3 Air baseline. 30fps fallback voor 2018+ devices.
- WebGPU detected → use; geen WebGL2 → degraded mode (skip fluid-sim, simpler post-FX).

---

## 8. Asset Pipeline

### 8.1 Sprites (FalSprite)
Per character/enemy: one prompt → animated spritesheet PNG + JSON. Pipeline:
1. `scripts/generate-spritesheet.sh "Cosmo, watercolor Ghibli-Moebius alien hero, 6-frame walk-cycle"` →
2. BiRefNet auto-remove-bg →
3. `free-tex-packer-cli` pack into `cosmos-2026.atlas.png` + JSON →
4. Phaser `this.load.atlas('cosmos', ...)`.

### 8.2 Backgrounds (Flux Pro v1.1)
Per biome: 3 backgrounds (jungle/cave/sky). Layered into 3 PNG depth-layers via prompt-conditioning. Used as Three.js textured planes.

### 8.3 3D parallax (Meshy v6 → Blender → GLTF)
~15 unique props for E1: mushroom-trees, glow-roots, sky-pillars, blob-boss. Poly-budget per layer (far <1k tris, mid <5k, near <15k). Ink-line stylized shader applied via TSL.

### 8.4 Audio (Suno + ElevenLabs)
Suno: prompt-batch alle 12 tracks in folktronica-stijl in dezelfde key (D-minor) zodat stinger-A en damage-stinger naadloos invallen.
ElevenLabs: één voice cast voor alle hint orbs (consistency), ~25-30 lines totaal voor MVP.

---

## 9. Sprint Plan (8 sprints)

| Sprint | Doel | Deliverables | Versie |
|--------|------|--------------|--------|
| **S1 — Scaffolding** | Vite + TS + dual-canvas + build deploy-ready | Three.js root + Phaser overlay rendering, deploy naar staging URL | 0.1.0 |
| **S2 — Cosmo controller** | Wallcling-mechanic perfectioneren | Run/jump/cling/wallclimb/stomp werkend op test-tilemap | 0.2.0 |
| **S3 — L1 + asset-pipeline** | Eerste echte level + alle pipeline-scripts werkend | L1 speelbaar met fal.ai sprites + Meshy parallax + Suno music | 0.3.0 |
| **S4 — Enemies + damage** | 8 enemy-types + HP-systeem + damage-FX | Alle E1-enemies geïmplementeerd, datamosh-tear werkend | 0.4.0 |
| **S5 — L2-L6 + hint orbs** | 5 levels + ElevenLabs voices | L2-L6 speelbaar, 25-star bonus-room werkend | 0.5.0 |
| **S6 — L7-L9 + post-FX** | 3 levels + alle hallucinaire effects | L7-L9 speelbaar, kaleidoscope/fluid-sim/fluo-pop volledig live | 0.6.0 |
| **S7 — L10 + Boss + Cinematics** | Boss-fight + Theatre.js cliffhanger | L10 boss-fight speelbaar, ending-cutscene werkend | 0.7.0 |
| **S8 — Polish + Launch** | Audio-mix, perf-tuning, save-systeem, browser-test, deploy | v1.0.0 deployed naar theuws.com/games/cosmos-2026 | **1.0.0** |

**Geschatte tijd**: 6-8 weken bij 2-3 sessies per week parallel met RoB.

---

## 10. Success Criteria (definitie van klaar voor v1.0)

**Must-have**:
- 10 speelbare levels van begin tot eind
- Alle 8 enemy-types + 1 boss
- Suction-cup wallcling tactiel (geen frustration-moments — getest op 5+ sessies)
- 1 hint orb per level minimum, ElevenLabs-stem
- Kaleidoscope op power-ups + fluo-pop op collectibles + datamosh op damage operationeel
- Suno OST volledig (10 tracks + 2 stingers)
- Save-anywhere via localStorage (3 slots)
- 60fps op M3 Air
- Mobile detect → "best on desktop" message + redirect naar landing
- Deployed naar theuws.com/games/cosmos-2026
- Landing page card op theuws.com/games met "NEW" badge

**Nice-to-have (post-v1.0)**:
- Touch controls voor mobile
- Speedrun-timer optie
- Achievement-systeem
- Eigen subdomain cosmos.theuws.com bij positief signaal

---

## 11. Risico's & Mitigaties

| Risico | Kans | Impact | Mitigatie |
|--------|------|--------|-----------|
| Three.js + Phaser sync-issues | Mid | Hoog | S1 spike: bewijs concept met simpele rotation-test voordat we levels bouwen |
| WebGPU browser-coverage | Laag | Mid | WebGL2-fallback expliciet in S6, test op Safari 26 + Firefox latest |
| FalSprite consistency tussen prompts | Mid | Mid | LoRA finetune op Cosmo character-design na S3, batch-generate alle frames met seed-locking |
| fal.ai-uitval tijdens dev | Laag | Hoog | Asset-cache in repo voor reproducibility, secondary key in `.env.backup` |
| Kaleidoscope motion-sickness | Mid | Mid | Settings: "reduce motion" toggle disables kaleidoscope + fluid-sim |
| ~~Cover-copyright titelthema~~ | ~~Hoog~~ | ~~Mid~~ | **Geresolved**: eigen titelthema, geen cover. |
| Scope-creep richting E2 vóór E1 ship | Hoog | Hoog | E2-features → BACKLOG file, niet in v1.0-tracker |

---

## 12. Out of Scope (v1.0 — voor latere versies)

- Episodes 2 en 3 (DLC-uitbreiding)
- Frozen RoB-eenheid easter egg (E2 L7)
- Mobile/touch controls
- Multiplayer / co-op
- Level-editor / community-content
- Steam-port / native build
- Speedrun-leaderboard
- Achievement-systeem
- Localization (NL/DE/FR)
- Eigen subdomain — alleen bij positief release-signaal

---

## 13. Approval

PRD klaar voor review. Bij goedkeuring start sprint S1 (Scaffolding) — Vite-setup + dual-canvas spike + deploy-pipeline naar `theuws.com/games/cosmos-2026`.

**Review-vraag aan Game Master**:
1. Zijn de 8 enemy-types (S4) goed genoeg voor MVP, of moet er specifiek iets uit Cosmodoc toegevoegd worden?
2. Wil je een bestaand titelthema 1:1 coveren (met copyright-risico) of een eigen-DNA opener?
3. Sprint-cadence: bij goedkeuring start S1 deze sessie, of plan je een aparte kickoff-sessie?
