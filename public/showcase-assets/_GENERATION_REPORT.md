# Zorp's Universe — Asset Generation Report

**Generated**: 2026-04-30
**Visual Direction**: B-hybride "Cosmic Watercolor" (Ghibli x Moebius x Tenniel-Alice)
**Pipeline**: fal.ai Flux Dev (sprites/logo) + Flux Pro v1.1 (backgrounds) + BiRefNet (remove-bg)
**Locked palette**: #E8D5B7 / #7B9E89 / #4A6FA5 / #B85C7E / #3D2E4A / #F4A261 / #2D4A3E

## Status Overview

| # | Asset | File | Status | Note |
|---|-------|------|--------|------|
| 1 | Zorp (hero) | cosmo-hero.png + cosmo-hero-cleaned.png | ok | Kleurpalet OK (moss-sage, faded-rose, saffron). Kawaii drift — minder Tenniel, meer chibi-airbrush dan beoogd. Acceptable v1. |
| 2 | Brumberry | enemy-brumberry.png + enemy-brumberry-cleaned.png | ok | Sterk Tenniel-Moebius mood, ink linework + wet-edge bleeds zichtbaar. Op palette. |
| 3 | Hopper Cabbage | enemy-hopper-cabbage.png + enemy-hopper-cabbage-cleaned.png | ok | Te kawaii (blush + sparkle eye). Moss-sage palette OK, maar mist Moebius-grit. Acceptable v1, eventueel her-genereren met sterkere "NO kawaii NO blush" negatives. |
| 4 | Eye Plant | enemy-eye-plant.png + enemy-eye-plant-cleaned.png | ok | Beste sprite — Moebius linework, faded-rose iris, saffron pupil, dripping aubergine sap on-spec. |
| 5 | Slow Bloom (jungle BG) | bg-slow-bloom-jungle.png | ok | Excellent — drie depth-lagen, saffron sunbeams, paper grain, Ghibli mood. Mushrooms iets te FlyAgaric/Mario, maar mood top. |
| 6 | Inkpool Hollow (cave BG) | bg-inkpool-cave.png | ok | Sterke compositie + reflectie. Wel meer warm/oranje dan locked palette voorschrijft (forest-deep + aubergine zou koeler/donkerder moeten). Acceptable. |
| 7 | Cloud Cathedral (sky BG) | bg-cloud-cathedral-sky.png | ok | Beste BG — pastel layers, mushroom-cream arches, saffron-edge clouds, Castle-in-the-Sky mood spot-on. Op palette. |
| 8 | Logo Title | logo-title.png | ok | Letters lezen warm-saffron-red ipv ink-aubergine + faded-rose. Mist sage spore-stars en sky-blue swirls. Style + paper-grain BG correct. v2 nodig voor on-palette accuracy. |

## Pipeline Details

- 8 base images: parallel generated, ~30-50s each (queue + poll)
- 4 sprites: BiRefNet remove-bg toegepast (sprites 1-4) — alle output transparant, schone edges
- 3 backgrounds: GEEN remove-bg (opaque vereist) — correct overgeslagen
- 1 logo: GEEN remove-bg (paper-grain BG is intentioneel deel van ontwerp) — correct

## Bestanden in deze folder

- 8x originele Flux output (.png met witte/cream BG)
- 4x cleaned sprites (.png met transparante alpha) — voor in-game gebruik
- Backgrounds + logo: gebruik direct (geen cleaned versies)

## Aanbevelingen voor v2 (optioneel)

1. **Zorp + Hopper**: regenerate met "NO kawaii NO blush NO sparkle eye NO chibi NO mascot" sterk vooraan in negatives + voeg "Tenniel woodcut", "spiky proportions", "uncute" expliciet toe
2. **Logo**: regenerate met "ink-aubergine letters PRIMARY COLOR" + "moss-sage 5-point spore-stars" + "sky-wash-blue ribbon swirls" — kleurinstructies werken beter als positieve toewijzing dan generieke palette-noemers
3. **Cave BG**: regenerate met "cool dark forest-deep + aubergine palette ONLY, NO orange NO warm tones" voor strakkere kleur-lock
