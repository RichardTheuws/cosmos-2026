# Pitch B — Horizontal One-Page Flow Loop

**Tagline**: *Cosmo loopt — jij ademt mee.*
**Reference DNA**: Alto's Odyssey × GRIS × Sayonara Wild Hearts × Subway Surfers (zonder de stress).
**Format**: Mobile-first endless auto-runner. Eén-hand-speelbaar. Geen dood, geen falen, alleen flow.

---

## 1. Core loop (30s gameplay-flow)

- **0-3s**: Cosmo materialiseert in Slow Bloom biome. Wooden flute fade-in. Loopt vanzelf. Geen tutorial-tekst.
- **3-8s**: Speler tikt instinctief — Cosmo springt over moss-rock. Eerste saffron-star pickup. Score-teller fade-in.
- **8-15s**: Kloof komt eraan, te ver voor sprong. Hold-tap = wing-glide met chromatic-bleed trail. Eerste "ohh"-moment.
- **15-22s**: Trampoline (retro spring-platform DNA). Auto-bounce sync op kick van `slow-bloom-l1.mp3` 86 BPM. Drie op rij = combo ×2, kaleidoscope spike op de derde.
- **22-30s**: Kosmische deur opent. Cosmo loopt erdoor, datamosh+RGB-shift 600ms, track cross-fade naar `inkpool-hollow-l4.mp3`. Palette wisselt naar ink-aubergine. Loop herstart in nieuwe wereld.

**Geen game-over.** Cosmo "valt" alleen als speler grof faalt — en de val zelf is de portal naar de volgende biome (zachte combo-reset, score blijft).

---

## 2. Mobile-first input vocabulary

| Gesture | Action | Visual feedback |
|---------|--------|-----------------|
| **Tap** | Spring | Cosmo hop + saffron sparkle |
| **Hold-tap** (>250ms) | Wing-glide | Chromatic trail, traag-zweven met lichte float |
| **Swipe-down** | Crouch-slide onder hangend obstakel | Stof-puff + lage kaleidoscope spike |
| **Swipe-up** | Wallclim / extra reach | Vertical stretch-frame + 1-frame motion-blur |
| **Two-finger tap** *(optional)* | Pause / settings drawer | Time-freeze bloom-pulse |

**Eén-hand-speelbaar: JA.** Alle core gestures werken met enkel duim, rechter- of linkerhand. Geen pinch, geen multi-touch verplicht. Portrait-orientation lock.

---

## 3. Cosmo grootte + centering

**Cosmo = 35% schermhoogte**, in de **linkerderde** (sweet-spot reactietijd: speler ziet wat eraan komt). Camera lerp 0.85 + lichte verticale parallax bij sprong (camera lift 30%, niet 100%, anders verliest speler de horizon).

**Sprite-upgrade noodzakelijk**: huidige `cosmo-canonical-v2-cleaned.png` (Hayao×Moebius+chameleon DNA) is goed maar te klein-render. Voor 35%-target nodig:
- Hi-res 1024×1024
- 8-frame walk-cycle (huidige is statisch)
- 4-frame glide-cycle (wings extended)
- 2-frame bounce (trampoline squash+stretch)
- 1 portal-warp frame (hallucination state, alle pop-accents)

Cosmo = visueel anker. Background mag wild gaan, Cosmo blijft leesbaar door consistente outline + saffron rim-light.

---

## 4. Visuele hiërarchie

**4 parallax-lagen per biome** (locked uit visual_coherence.md):
1. Sky (0.05x) — kosmische gradient, drift sterren, planeet-occlusie events
2. Far-mountains (0.25x) — silhouet, atmosferic perspective, bleek
3. Mid-canopy (0.6x) — bomen/mushrooms/cathedral-pilaren, hier zitten de portals
4. Near-frame (1.4x) — voorgrond-bladeren/spore-clouds, occlusief, dekt soms Cosmo half af

**Biome-bands** (4, één per Suno-track):
- **Slow Bloom** (L1): mushroom-cream / moss-sage, wooden flute, low-stim onboarding
- **Inkpool Hollow** (L4-L5): ink-aubergine / saffron-glow, koto drone, kaleidoscope-friendly
- **Cloud Cathedral** (L7-L8): industrial-organic, brushed kick, trampoline-heavy
- **Bonus Paradise** (L9): score-paradijs, 70 BPM, Dorian brightness, GEEN obstakels — beloning na 3 biomes

**Transitions** (TrippyEventDirector hook): elke switch = 600ms overgang. Slow Bloom→Inkpool = paint-bleed dissolve. Inkpool→Cathedral = kaleidoscope iris-open. Cathedral→Paradise = full-bloom whiteout.

---

## 5. Muziek-koppeling

De 4 huidige tracks worden de **4 biome-themes**, procedural geketend:

| Track | Biome | Beat-sync hook |
|-------|-------|----------------|
| `slow-bloom-l1.mp3` (86 BPM) | Slow Bloom | Trampoline-bounce op kick. Star-pickup op koto-pluck. |
| `inkpool-hollow-l4.mp3` (78 BPM) | Inkpool Hollow | Hand-drum heartbeat = parallax-pulse. Glide-sync op flute-sustain. |
| `cloud-cathedral-l8.mp3` (110 BPM) | Cloud Cathedral | Trampoline sequences locked op kick(1)+pluck(3). Speedier flow. |
| `bonus-warp-l9.mp3` (70 BPM) | Paradise | No-fail bonus, kaleido-arpeggio op pickup. |

**Audio-FFT bridge** (v0.4.0): 8-band log-FFT stuurt bloom/kaleido/fluid uniforms. Hergebruik voor sub-bass spike op portal-cross — speler voelt het in z'n maag. **Stilte tussen biomes (1-2s)**: cricket + tape-hiss only. Reset het oor, voorkomt desensitisatie.

---

## 6. Scoring + progressie

**Run-score**: `afstand × stijl-multiplier`. Stars op rij 3/5/10 = ×2/×3/×5. Perfect trampoline-bounce op de kick = ×3 + kaleido-flash. Glide-distance = bonus-tikker. Biome-clear zonder combo-break = +0.1 multiplier-bump voor hele run.

**Geen gameplay-blokkerende unlocks.** Wel: Cosmo-skins (rose/ink/gold) cosmetisch na X afstand; **Daily Ritual** = 1 willekeurige biome-volgorde per dag + daily-leaderboard van vrienden; **Streak-badges** 3/7/30 dagen → unlock 90s ambient Suno-edit (deelbaar). Session-time target: **2-5 min gemiddeld**, oneindig herhaalbaar.

---

## 7. Virale haakjes (5 share-momenten)

1. **"Combo van 12!" auto-screenshot** — combo ≥10 = gestileerde frame (Cosmo mid-bounce, kaleido-flash, score). One-tap share naar TikTok/IG.
2. **Sequence-replay-GIF** — laatste 4s van een spectaculaire run (trampolines + biome-switch) auto-rendered als 480×854 portrait MP4 met music. Geen edit-skills nodig.
3. **Soundscape-quote-card** — biome-switch geeft optioneel een trip-quote card (Cosmo + biome-art + Suno-track-titel + streak). Aesthetisch, geen score-flex.
4. **Week-streak badge** — 7 dagen = persoonlijke "Cosmic Pilgrim" card met biome-favoriet + flight-distance. Voelt als identiteit.
5. **Friend-pass-the-trip** — link-share opent een 60s pre-set sequence die jij speelde. Vriend speelt EXACT dezelfde biome-volgorde + portal-timing. Asynchrone score-battle binnen identieke trip.

Alle 5 zijn **friction-free**: geen account verplicht, share = native share-sheet.

---

## 8. Onboarding

**Tutorial = één tegel tekst.** Eerste run, na 3s, fade-in onderaan: **"tap to jump"**. Fade-out na eerste tap.

Hold-tap, swipe, trampoline, portals zijn **emergent**: kloof verschijnt → speler houdt vast → wing-glide gevonden. Hangend obstakel op kniehoogte → mis het, ontdek swipe-down. Geen tooltips, geen menu, geen "press X to continue". GRIS-school: vertrouw de speler.

---

## 9. Anti-stress design

**Cosmo loopt vanzelf.** Tappen is een kans, geen plicht. Skip alle obstakels = combo-verlies, geen levensverlies. Skip 30s = pure visual+audio meditatie, geldig speltype. Geen timer-stress, geen levens-counter, geen "you died" screen. Pause = time-freeze met bloom-halo + low-pass audio, ademt nog steeds. Bewust het **omgekeerde van Subway Surfers**: zij maximaliseren paniek, wij maximaliseren rust.

---

## 10. Stoner-specifiek design

- **Geen quick-reflexes**: obstakels worden 1.2-1.8s van tevoren zichtbaar via parallax-near-layer foreshadowing
- **Tap-tolerantie ±200ms** rond ideale frame — forgiving, niet pixel-perfect
- **Alle obstakels passable zonder ingrijpen**: Cosmo loopt eronder/eromheen automatisch (verlies alleen combo)
- **Kleur-pulse op interactiekansen**: stars bloomen 100ms voor pickup-moment, trampolines pulseren in beat. Speelt mee met muziek, niet tegen klok
- **Hallucination-pieken alleen op portal-cross** — nooit mid-flow chaos die input-reading verstoort
- **One-handed couch-mode**: liggend, headphones in, 5-15 min sessies

---

## 11. Existing assets reuse (v0.8.0)

**HOUDEN**: 4 Suno tracks (slow-bloom-l1, inkpool-hollow-l4, cloud-cathedral-l8, bonus-warp-l9) als 4-biome themes; backgrounds + 4-laags parallax (locked palette); Cosmo canonical v2 als basis; post-FX stack (bloom/chroma/fluid/kaleido/datamosh) 100%; TrippyEventDirector; Audio-FFT bridge 1-op-1; trampoline-tile (Sprint 11C).

**SCHRAPPEN**: level-grids (LEGEND/ENEMY_LEGEND); 12 enemy-classes + bomb-systeem; boss-fight L10 (track bewaren als epilog-easter-egg); cracked-walls + bomb-pickup; wallclim-walls (vervangen door swipe-up reach); HUD-grid + level-counter.

**AANPASSEN**: Cosmo sprite → 8-frame walk + glide + bounce (regen fal.ai met identieke style-stem); tile-set → procedural endless ribbon; stars houden; portal-art = nieuw asset, één kosmische deur per biome.

---

## 12. Sprint-scope (6 sprints, ground-up rebuild, ~5 weken)

1. **Runner Core (1w)**: Phaser auto-scroll, Cosmo walk-cycle, tap-jump, basic obstacles, single-biome (Slow Bloom). Speelbaar in 5 dagen.
2. **Input vocabulary (3d)**: Hold-tap glide, swipe-down crouch, swipe-up reach. Touch-overlay reuse uit v0.4.0.
3. **Biome chaining + portals (1w)**: 4 biomes geketend, portal-transitions, hallucination-overgangen, music-cross-fade, TrippyEventDirector port.
4. **Trampoline beat-sync + scoring (3d)**: Trampolines op kick, combo-system, multipliers, audio-FFT bridge re-wire.
5. **Viraal share + onboarding (1w)**: 5 share-momenten, auto-screenshot, MP4-render, daily ritual, streak-badges, "tap to jump"-only tutorial.
6. **Polish + ship (1w)**: Cosmo skin-variants, Paradise bonus, mobile perf pass (60fps op iPhone 12+), deploy theuws.com/games/cosmos-2026, ASO copy.

Ground-up rebuild is sneller dan doorbouwen op de Mario-platformer fundering (Sprint 7-9 stond nog open).

---

## Waarom dit beter viraal is dan vertical-riser

**Vertical-riser** (zoals Doodle Jump) heeft één probleem voor de stoner-doelgroep: **constante upward stress + camera die altijd verticaal volgt = misselijk-makend op telefoon**. Plus: vertical-format lijkt op TikTok-feed visueel, dus minder onderscheidend in shares.

**Horizontal flow loop** wint omdat:
1. **Auto-runner = zero-stakes entry** — speler kijkt 5 seconden, voelt het al, geen leercurve
2. **Horizontal scroll past natuurlijk in 9:16 portrait shares** — Cosmo plus parallax leest perfect in TikTok/Reels-frame
3. **Beat-sync met muziek is direct kopieerbaar als share-content** — de muziek IS de hook, mensen scrollen voor aesthetics + sound, en wij leveren beide tegelijk
4. **Biome-portals zijn share-momenten van zichzelf** — elke transition is een "wow"-frame die als loop-GIF op zichzelf staat
5. **Geen falen = geen schaamte = mensen delen vrijer** — niemand post een "ik ging dood na 10 seconden" clip, maar wel een "kijk dit moment" clip
6. **Daily ritual + friend-pass-the-trip** zijn intrinsieke virale loops zonder prompts of pop-ups

Sayonara Wild Hearts heeft dit format al bewezen werkbaar. Wij maken de **mobile-first, free-to-play, 5-week-MVP** versie ervan met onze eigen unieke trippy-stack.

## Grootste risico

**Visuele coherentie tussen biomes onder snelle scroll-snelheid**. Bij 86-110 BPM auto-scroll moet de parallax foutloos lopen, anders krijg je judder en de hele meditatieve feel breekt. Plus: het assemblage-werk van 4 biomes met elk 4 parallax-lagen + transitions = veel asset-werk waar de visual_coherence-checklist (5 punten) voor ELK asset moet kloppen, anders valt één enkele tile uit de droom en de illusie sneuvelt.

**Mitigatie**: Sprint 1 lockt de art-direction in één biome (Slow Bloom), pas na in-engine validatie met post-FX aan groen-licht voor Sprint 3 biome-chaining. Niet alle 4 biomes parallel ontwikkelen.
