# Sprint 4.5 Fase C — Cosmo Redesign Case Study

**Datum**: 2026-04-30
**Doel**: retro → 2026 cosmic-acid-Moebius bridge voor Cosmo character
**Generations**: 6 hoofdvarianten + 2 v2 retries = 8 totaal
**Cost**: ~$0.20 Flux Dev sprite generations

## KRITIEKE BEVINDING — suction-cup hands fail

**Flux Dev kan zuignap-handen NIET renderen vanuit pure tekst**, ongeacht prompt-emphasis. Alle 8 generaties (6 first-pass + 2 retries met expliciete anatomy-instructies inclusief "toilet plunger tip" / "octopus tentacle suction-cup" / "BIG ROUND DISC pads instead of fingers") leveren standaard hand-anatomie:
- Lizard-clawed hands (v1, v3, v4, v5)
- Standard human-hand met 4-5 vingers (v2, v6, v3b, v4b)
- Niet één variant heeft de signature plunger-tip-style suction-cup-discs

**Conclusie**: voor de canonical Cosmo-suction-cup-hands hebben we een **image-to-image** pipeline nodig. Pure text-to-image faalt op dit specifiek anatomical detail (training-bias: "alien-kid" + "hands" → standard biped hands, geen tools/discs op armen). Zie nieuwe gotcha in `asset_learnings.md`.

**Workaround opties** voor canonical-pick:
1. Richard kiest beste body+head+vibe winnaar uit deze 6 → daarna **Photoshop AI inpaint** of **fal.ai inpainting** waar hij de hands selecteert en prompt "round flat circular suction-cup disc pad like toilet plunger tip, no fingers"
2. Of: pak de winnaar als **base-image**, doe image-to-image met +0.6 strength en heel kort prompt focused op hands-only retraining
3. Of: **eerst** de hands los renderen (witte achtergrond, niets dan twee suction-discs), daarna comp in Photoshop/Photopea

## Per-variant evaluatie

### V1 — Acid Tenniel
**File**: `cosmo-v1-acid-tenniel.png`

| Trait | Status |
|-------|--------|
| Moss-sage groen huid | ✓ |
| Faded-rose spots (kleinhouden) | ✗ over-saturated red, te veel |
| **Single antenna** | ✗ TWEE antennae met rode bollen |
| Overbite hint | ✗ glimlach geen overbite |
| **TWEE ZUIGNAP-HANDEN** | ✗ lizard-claw vingers |
| Kid-proportions | ✓ |
| Naakt + geen schoenen | ✓ |
| Tenniel ink-line woodcut | ✓✓ heel sterk |
| **Anti-pattern**: tail | ✗ heeft tail (het oude ontwerp had geen tail) |

**Stylistic-fit**: 7/10 — sterke ink linework, kid-frame goed, maar tail + 2 antennae zijn hard DNA-fails.
**Wat dit goed maakt**: aller-melancholische trip-vibe; voelt als "Tenniel die acid neemt".

### V2 — Cosmic Hayao
**File**: `cosmo-v2-cosmic-hayao.png`

| Trait | Status |
|-------|--------|
| Moss-sage groen huid | ✓ |
| Faded-rose spots | ✓ goede density |
| **Single antenna** | ✗ DRIE flowers (centraal + 2 wings — over-cluttered) |
| Overbite hint | partially — toothy smile maar niet Bart |
| **TWEE ZUIGNAP-HANDEN** | ✗ standard 4-finger hands |
| Kid-proportions | ✓ |
| Naakt + geen schoenen | ✓ |
| Hayao soft watercolor | ✓✓ pink moon halo achtergrond mooi |
| Cosmic glow halo painted in | ✓ pink moon disk doet dit werk |

**Stylistic-fit**: 6/10 — Ghibli-aesthetic werkt, maar 3 flowers verstoort de character-DNA. Twee "wing flowers" lezen als ears, niet als spots/antenna.
**Wat dit goed maakt**: dreamy-hopeful tone die Hayao vraagt — minder zwaar dan Tenniel.

### V3 — Moebius Mainline
**File**: `cosmo-v3-moebius-mainline.png`

| Trait | Status |
|-------|--------|
| Moss-sage groen huid | ✓ |
| Faded-rose spots op hoofd | ✓ heel prominent (over-prominent: alleen op kop) |
| **Single antenna** | ✓ enkele antenna met star-tip |
| Overbite hint | ✗ kleine pruil-mond, geen overbite |
| **TWEE ZUIGNAP-HANDEN** | ✗ 5-finger hands |
| Kid-proportions | ✓ slank, slightly elongated |
| **Mushroom-cap-head** | ✗ kop is mushroom-cap-shape (anti-pattern: head-shape distortion) |
| Moebius bande-dessinée | ✓✓✓ pure 70s french comic style — sterkste stylistic match |

**Stylistic-fit**: 8/10 — als pure Moebius is dit de winner. Maar mushroom-cap-head is een vreemde DNA-twist die niet bij het oude ontwerp past.
**Wat dit goed maakt**: de meest "echte" Moebius-rendering — dit voelt als concept-art uit Métal Hurlant 1978.

### V4 — Pulse-Trip ⭐
**File**: `cosmo-v4-pulse-trip.png`

| Trait | Status |
|-------|--------|
| Moss-sage groen huid | ✓ met yellow-green saffron underglow |
| Faded-rose spots | ✓✓ goede density op kop + body |
| **Single antenna** | ✓ enkele antenna met faded-rose flower-tip |
| Overbite hint | ✓ subtiele closed-mouth smirk (niet Bart-prominent maar present) |
| **TWEE ZUIGNAP-HANDEN** | ✗ lizard-claws |
| Kid-proportions | ✓ slim slightly elongated |
| Naakt + geen schoenen | ✓ |
| Cosmic glow-aura painted in | ✓✓ magenta-pink mist + stars rondom |
| Psychedelic poster vibe | ✓✓ |
| **Anti-pattern**: tail | ✗ kleine tail aanwezig |

**Stylistic-fit**: 9/10 — het meest TE-GEK + meest cosmic-acid-coherent met de bestaande backgrounds.
**Wat dit goed maakt**: dit is **dichtst bij de gewenste "Cosmos = MIJN trip" identity**. Magenta-mist atmosphere + spore-grit ground + glowing antenna = volledig binnen de locked palette + style-stem. Single antenna met flower-tip is correct DNA. Als suction-cups worden gefixed via inpainting → dit wordt canonical.

### V5 — Bart-Simpson Mushroom
**File**: `cosmo-v5-bart-mushroom.png`

| Trait | Status |
|-------|--------|
| Moss-sage groen huid | ✓ |
| Faded-rose spots PROMINENT | ✓✓ grote duidelijke vlekken |
| **Single antenna** | ✓ enkele antenna met faded-rose flower-tip |
| **Overbite Bart-Simpson** | ✓✓ duidelijke twee front teeth visible |
| **TWEE ZUIGNAP-HANDEN** | ✗ tiny 4-finger hands met rose tips (rose tips zijn een interessante hint maar geen suction-discs) |
| Kid-proportions chibi-ish | partially — buik is wat te chibi-pot-belly |
| Naakt + geen schoenen | ✓ |
| **Anti-pattern**: kawaii-eye drift | ✗ kawaii sparkle-eye (ondanks negatives) |
| **Anti-pattern**: tail | ✗ tail aanwezig |

**Stylistic-fit**: 6/10 — meest expliciet character-DNA via overbite + spots, maar slipt naar kawaii + geen acid-cosmic vibe.
**Wat dit goed maakt**: enige variant met duidelijke Bart-overbite. Goed voor retro-fidelity-shoppers.

### V6 — Wide-eye Astronaut
**File**: `cosmo-v6-wide-eye-astronaut.png`

| Trait | Status |
|-------|--------|
| Moss-sage groen huid | ✓ lichter dan andere |
| Faded-rose spots | ✓ minder prominent |
| **Single antenna** | ✗ TWEE antennae met red-balls (Toy Story-alien look) |
| Overbite hint | ✗ closed mouth subtle smile |
| **TWEE ZUIGNAP-HANDEN** | ✗ standard human-style hands |
| Kid-proportions | ✓ slim |
| **Wide nebula-eyes** | ✓ wel cosmic reflection... maar leest als kawaii sparkle |
| **Anti-pattern**: 2-antennae Toy-Story-alien look | ✗ |

**Stylistic-fit**: 4/10 — leest het meest als "cute alien from Pixar" — slipt grootste in anti-pattern-territorium.
**Wat dit goed maakt**: niets onderscheidt deze positief van een generic alien-mascot. Niet voor canonical-pick.

### V3b — Moebius retry (suction-cup-emphasis)
**File**: `cosmo-v3b-moebius-suction.png`

Suction-cup-hands FAIL → 5-finger hands. Bonus: scene-bleed (mountains + sun + sky horizon ondanks "neutral mushroom-cream paper card background"). Ronde kop is gefixed (geen mushroom-cap meer), spots beter, single antenna met flower-tip ✓. Body-pose is goed.
**Score**: 7/10 — als suction-cups gefixed worden, een goede tweede keuze. Nadeel: te veel scene-elementen op de card.

### V4b — Pulse-Trip retry (suction-cup-emphasis)
**File**: `cosmo-v4b-pulse-trip-suction.png`

Suction-cup-hands FAIL → lizard-claws. Bonus: kop is nu groter pumpkin-style met meer DNA-spots, single antenna correct, eye groot Moebius-stijl. Tail aanwezig. Pink-magenta cosmic background sterk.
**Score**: 8/10 — body+head zijn een step-up, maar tail blijft + suction-cups missen.

## Director's Note — aanbeveling

**Top 2 voor canonical-overweging:**

1. **V4 (Pulse-Trip)** — sterkste cosmic-acid-coherent fit met bestaande L1-keyframe palette. Single antenna met flower-tip ✓, spots goed, glow-aura painted IN. Mind: tail moet weg + suction-cup-hands fix via inpainting nodig. Dit voelt als "Cosmo die in 2026 wakker wordt in Richard's eigen acid-droom".

2. **V3b (Moebius retry)** — als Richard de pure Moebius bande-dessinée linework prioriteert boven de painterly-watercolor wash. Round head correct, single antenna correct, body-pose neutral. Mind: scene-bleed wegcroppen + suction-cup-hands fix nodig.

**Mijn pick als ik moet kiezen**: **V4** — past het beste bij `_LOCKED-REFERENCE.png` palette, is het meest TE-GEK zonder slip naar kawaii, en de tail kan in Photoshop weggehaald worden. Suction-cups worden via image-to-image inpaint-pass alsnog correct.

## Action items (na keuze)

1. Richard kiest 1 winnaar uit deze 6
2. Tail wegcroppen in Photoshop (V1, V4, V5, V4b — afhankelijk van keuze)
3. **Suction-cup-hands inpainting**: handen los renderen (single floating round suction-cup-disc on neutral grey card, plunger-tip aesthetic, ink linework) en compositen met Photoshop AI of fal.ai inpainting
4. Lock als `_COSMO-CANONICAL.png`
5. Image-to-image regen alle 6 animation-frames vanuit canonical
6. BiRefNet remove-bg pas op canonical (NIET op deze 6 first-passes)

## Cost summary
- 6 first-pass × $0.025 = $0.15
- 2 retries × $0.025 = $0.05
- **Totaal Fase C**: ~$0.20
