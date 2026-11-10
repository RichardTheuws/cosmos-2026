# Pitch A — Cosmos: Endless Vertical Riser

> **Logline**: One-thumb hypnose — Cosmo stijgt eeuwig door biome-na-biome op springende paddenstoelen, bubbels en levitatie-poelen. Geen game-over. Geen tutorial. Alleen omhoog, en steeds dieper de trip in.

> **Werknaam**: `Cosmos: Bloom Riser` (of: `Cosmo Up`)

> **Reference cocktail**: Doodle Jump's verticale puurheid × Tiny Wings' rhythm-glide × Patapon's diëgetische muziek-koppeling × Alto's Odyssey's stilte × _de paddenstoelen-trip in jouw retro-herinnering_.

---

## 1. Core loop (30s exact)

- **t=0–1s** — Cosmo dead-center. Wereld scrollt zacht omlaag. Paddenstoel-trampoline zweeft van onderaf in frame.
- **t=1–2s** — Auto-bounce. Paddenstoel pulseert op bass van `slow-bloom-l1.mp3`. Spring-arc 1.4s.
- **t=2–4s** — Tweede landing op bubbel-pool (hogere boog). Speler swipet links/rechts om Cosmo te sturen.
- **t=4–10s** — Combo-meter loopt op. Bij 8 combo: bloom +20%, kaleido begint te ademen.
- **t=12s** — Eerste gele ster dwarrelt off-axis. Pickup = saffron-glow flash.
- **t=18s** — Mist-ribbon hint: "altitude 200 ↑" — eerste biome-poort.
- **t=22s** — Combo 13 → synesthesia-flash (200ms pop-magenta inversie via TrippyEventDirector). Cosmo's antenne licht op.
- **t=28–30s** — Biome-poort: verticale gradient-wash daalt in. Muziek crossfade 4s. Speler is in Inkpool Hollow. Trampolines worden oog-bubbels. Track wisselt naar `inkpool-hollow-l4.mp3`. Loop herstart.

**Falen?** Cosmo kan niet vallen. Mist hij een trampoline → 1s levitatie-fade, respawn op dichtstbijzijnde. Combo breekt, altitude blijft. Geen game-over, ooit.

## 2. Mobile-first input

**Primair**: één-vinger swipe links/rechts op heel scherm. Cosmo's horizontale snelheid = swipe-snelheid. Verticaal = automatisch (auto-bounce op trampoline-contact).

**Secundair (optioneel)**:
- **Tap-hold**: Cosmo zweeft langer in mid-air — kost een snippet "stardust" maar geeft tijd om mid-air ster te grijpen.
- **Double-tap**: Cosmo drijft horizontaal door, tot volgende trampoline. Voor stoners: "ik wil gewoon kijken".
- **No-input idle bonus**: 10s geen swipe → "auto-pilot drift" engageert, score-multiplier ×1.25 want het is mooier dan controle. Belonen wat de doelgroep tóch al doet.

**Tilt-mode (toggle)**: gyro stuurt horizontaal. Voor mensen die liggen.

**Geen knoppen, geen UI-overlay tijdens gameplay.** HUD-text fade't na 5s naar 15% opacity.

## 3. Cosmo grootte + centering

- **Schermhoogte aandeel**: 38% (boven de 35% drempel die Game Master memory vereist). Op een 6.7" iPhone: ±260px. Op desktop: ±380px.
- **Positie**: dead-center horizontaal, 50% verticaal — hij beweegt NIET met de bounce. **De wereld kantelt en valt om Cosmo heen**, niet andersom. Dit is de hypnose-truc: je oog blijft aan Cosmo geplakt en je perifere zicht ziet de trip.
- **Zelfde Cosmo-canonical-v2 sprite** (hayao×moebius, antenne, zuignap-handen, overbite — alle character-DNA blijft). Zachte audio-reactive ademhaling: 4% scale-pulse op kick-drum band van FFT.
- **Antenne-glow** = combo-indicator. Bij combo 13+ wordt de antenne een chromatic prism waar pop-magenta uit lekt.

## 4. Visuele hierarchie

**Parallax (4 lagen, conform visual_coherence.md)**: sky-wash dome ×0.05 (planeten/zonnen) → far biome-frame ×0.2 (mountains/spires/cave-vault) → mid gameplay-laag ×1.0 (trampolines + sterren + Cosmo) → near foreground ×1.6 (petals/spores/inkdrops, occlusion).

**Post-FX per biome** (oplopend bloom/chroma/kaleido/fluid/datamosh):
- Slow Bloom: 60/10/0/15/0
- Inkpool Hollow: 80/25/30/40/5
- Cloud Cathedral: 100/35/60/35/10
- Bonus Warp (zeldzaam): kaleido 100 / fluid 80 — pure trip, geen hazards

TrippyEventDirector blijft, maar gekoppeld aan **altitude-milestones** ipv random.

## 5. Muziek-koppeling

Hergebruik **alle 12 Suno-tracks** (D-minor anker = goud).

- **Slow Bloom (0–60s)**: `slow-bloom-l1.mp3`
- **Inkpool Hollow (60–150s)**: `inkpool-hollow-l4.mp3` → `l5.mp3` op combo 20
- **Cloud Cathedral (150–270s)**: `cloud-cathedral-l7.mp3` → `l8.mp3` (110 BPM = trampoline-tempo lock)
- **Bonus Warp (zeldzaam, na 8 combo bij poort)**: `bonus-warp-l9.mp3` — 90s paradijs
- **Apex (>500m)**: `cliffhanger-credits.mp3` reprise — speler heeft "credits" verdiend

**Hallucinatie-trigger**: Fibonacci-combo's (13/21/34) → 2-bar Tone.js-stinger boven op huidige track + 1.5s kaleido-piek + sterrenshower. Dat is de "drop". Biome-switch: 4s crossfade, FFT-bridge blijft live.

## 6. Scoring + progressie

**Altitude** (primair, permanent) · **Gele sterren** (skins: kameleon/prism/regenboog) · **Combo-meter** (hoogste van de run, vereist voor "perfect day" badge). Geen levens, geen timer, geen HP.

**Daily streak**: opvolgende dagen → unlock biome-of-the-day. Streak resets vriendelijk ("the cosmos waited for you"), geen straf. **Lifetime altitude**: elke 10.000m unlocked een biome-variant (cosmetisch).

## 7. Virale haakjes (5)

1. **Auto-screenshot bij synesthesia-piek** — game pakt zelf het frame waar bloom + kaleido + audio-drop samenvallen. Gallery + één-tap share. Frame is altijd instagrammable want gekozen op visuele dichtheid.
2. **15s MP4-export bij personal best** — laatste segment 640×1138, micro-corner watermark `cosmos.theuws.com`. Mensen delen highscores want het is mooi, niet uit grootspraak.
3. **Friend-challenge seed-link** — `cosmos.theuws.com/r/?seed=A8F2&target=1240` opent identieke biome-volgorde. Asynchrone PvP zonder server.
4. **Soundscape-loop share** — pause-scherm: 15s audio-export vanaf huidige biome. Stoners delen vibes, niet scores.
5. **Cosmo-of-the-day skin** — dagelijks andere palette-drift. "Welke Cosmo had jij vandaag?" → FOMO zonder paywall.

Bonus: **AR-mode** (ARKit) — Cosmo springt over je tafel. iOS-only. TikTok-bait.

## 8. Onboarding (eerste 10s)

- **0–1s**: Cosmo spawned middle-screen, antenne flikkert. Title "COSMOS" fade't in en weer uit (1.5s totaal).
- **1–3s**: Eerste paddenstoel verschijnt onderaan. Cosmo bounce't automatisch — speler kijkt, geen actie nodig.
- **3–5s**: Tweede trampoline verschijnt off-axis. Een lichte hint-pijl (saffron-glow) wijst er naar. Geen tekst.
- **5–7s**: Als speler swipet: pijl fade't direct weg, score begint te tellen. Als niet: geest-vinger-animatie demonstreert swipe.
- **7–10s**: Synesthesia-flash op combo 3. Eerste "drop". Speler is in.

**Geen tutorial-overlay, geen modal, geen "press to continue".** Discovery is de gameplay.

## 9. Anti-stress design

- **Geen game-over screen, ooit.** Mist → levitate → respawn dichtstbijzijnde. Combo breekt, altitude niet.
- **Pause = chillzone**: wereld ademt door, muziek blijft, geen modal. Tap to resume.
- **Idle 30s** → drift mode: auto-bounce + subtiele blur. Lava-lamp voor 30 min.
- **No-loss runs**: eindigen alleen bij app-close. Geen ads in flow.

## 10. Stoner-specifiek (fail-state als beauty)

- **"Death" = ascensie**: 3× missen → Cosmo stijgt door sterren-tunnel naar volgende biome. Geen straf, een gift. "The cosmos pulled you up."
- **Reincarnatie-skin** na 5× ascensie. Falen ontgrendelt content.
- **Geen reflex-eisen**: hit-windows 1.4s breed. Geen Flappy Bird.
- **Hypnose-framing in copy**: titel "Cosmos · drift", description "een plek om naartoe te gaan" — niet "een game om te winnen".

## 11. Existing assets reuse

**Behouden** (~70%): Cosmo canonical v2 sprite, alle 12 Suno-tracks, 3 biome-background-stacks (slow-bloom/inkpool/cathedral), post-FX stack v0.4.0, TrippyEventDirector, Audio-FFT bridge (Sprint 6D), trampoline-tile v3 (Flux Dev 3/4-angle die werkte), gele sterren + hint orbs, locked palette.

**Weg**: 12 enemy-classes, bomb-systeem, breakable walls (`B`) + bomb-pickup (`Q`), Phaser tile-grid level-editor (vervangen door procedural spawner), ENEMY_LEGEND data, Sprint 6/7 boss-arena, damage- & life-systeem.

Asset-pipeline en audio-systeem 100% intact, gameplay-code grotendeels weg.

## 12. Sprint scope (4 sprints tot ship)

**R1 — Vertical Core (1w)**: trampoline-spawner (procedural), auto-bounce physics, swipe-input + idle-drift, Cosmo dead-center + world-scroll camera, één biome oneindig.

**R2 — Biomes + Audio (1w)**: biome-poort transitie (4s crossfade), drie biomes live, music-router op altitude, TrippyEventDirector gekoppeld aan combo + altitude, Tone.js stingers op Fibonacci-combo's.

**R3 — Polish + Anti-stress (1w)**: no-game-over respawn, pause = chillzone, idle-drift mode, daily streak + biome-of-the-day, 3 starter-skins.

**R4 — Virale haakjes + Ship (1w)**: auto-screenshot, MP4-export, seed-link, soundscape-share, PWA + iOS Safari mobile build, deploy.

**Buffer R5 (optioneel)**: AR-mode, skin-shop, Bonus Warp paradijs.

**Totaal: 4 weken tot v1.0 ship.** Post-launch: TikTok/Reels seeding (5-10 creators).

---

## Honest take — waarom DIT viraal gaat

**Drie redenen meer dan andere richtingen**:

1. **Vertical = TikTok-native frame.** 9:16 ratio _is_ de gameplay. Geen letterbox, geen cropping. Auto-screenshot zorgt dat ook niet-deler-types delen — de game kiest het mooie moment voor ze.

2. **One-thumb + no-fail = stoner-instant-grip.** Doodle Jump's puurheid + Alto's Odyssey's calmness + jouw retro-trippy-art-DNA = niemand op de App Store doet dit. Markt heeft hyper-casual risers, maar geen die er als kunst uitzien én een audio-DNA hebben dat al loop-baar gemixt is.

3. **Audio-reactivity die niemand kopieert.** FFT-bridge op Suno-tracks (Sprint 6D al live) modulerend kaleido/bloom is een moat — vereist én muziek-IP én shader-stack. Dat is wat mensen voelen zonder te kunnen benoemen ("waarom voelt dit anders?").

**Het grootste risico — technisch én markt**:

- **Technisch**: mobile post-FX. De full v0.4.0 stack (bloom + chroma + fluid + kaleido + datamosh) draaien op een midrange Android op 60fps is niet gegarandeerd. Mitigatie: device-tier detection, fallback-shader-stack voor low-end (alleen bloom + chroma). Maar dit kan een week extra werk worden, en als het slecht draait op de helft van de Android-markt is dat een viraliteits-killer (mensen reposten geen 28fps gameplay).

- **Markt**: het genre "endless vertical hyper-casual" is _verzadigd_. Doodle Jump alleen heeft 200M+ downloads. De manier waarop wij ons onderscheiden — kunst + audio — is ook _moeilijker over te brengen in een 6-sec App Store preview_ dan "spring hoog en grijp coins". Risico: zonder een sterke initial TikTok-seeding (5-10 creators die de vibe vangen) zakt het weg in de algoritmische ruis. **Daarom is sprint R4 (virale haakjes) niet optioneel**. Auto-screenshot en gif-export zijn niet polish — die zijn launch-kritisch.

**Mijn vinger-in-de-lucht**: 60% kans dat dit een sleeper-hit wordt mits we sprint R4 serieus nemen. 30% kans dat het een mooi nicheding wordt dat in stoner-Twitter rondzingt. 10% kans dat het wegzakt — die 10% is bijna volledig "we shipten met slechte mobile-perf".

Ship het.
