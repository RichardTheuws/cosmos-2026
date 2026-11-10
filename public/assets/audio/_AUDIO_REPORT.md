# Sprint 3 Audio Report — Zorp's Universe

**Date**: 2026-04-30
**Sprint**: 3 — L1 + Asset Pipeline (target v0.3.0)
**Generator**: Claude Code (Opus 4.7) via direct curl → ElevenLabs API
**Provider**: ElevenLabs SFX Generation + TTS

---

## 1. SFX (8/8 generated — 100%)

All SFX rendered via `POST /v1/sound-generation` with `prompt_influence=0.3`.

| Filename | Status | Size | Duration | Prompt summary |
|---|---|---:|---:|---|
| `sfx/cosmo-cling.mp3` | OK | 8821 B | 0.5s | suction cup pop, watery latch |
| `sfx/cosmo-jump.mp3` | OK | 8821 B | 0.5s | wooden boing, soft toy spring |
| `sfx/cosmo-stomp.mp3` | OK | 8821 B | 0.5s | soft squish thud |
| `sfx/cosmo-hurt.mp3` | OK | 8821 B | 0.5s | glassy crack + watercolor bleed |
| `sfx/pickup-star.mp3` | OK | 8821 B | 0.5s | glass koto pluck shimmer |
| `sfx/pickup-bonus.mp3` | OK | 24703 B | 1.5s | warm magical fanfare |
| `sfx/globe-trigger.mp3` | OK | 17180 B | 1.0s | wooden bowl resonance hum |
| `sfx/bonus-warp.mp3` | OK | 33062 B | 2.0s | kaleidoscope koto sweep |

**Note re. duration adjustment**: ElevenLabs sound-generation enforces a minimum `duration_seconds=0.5`. The original brief had four SFX at 0.3-0.4s. Those were bumped to 0.5s after the API returned `400 invalid_generation_settings`. No audio quality compromise — the prompts were short-lived sounds anyway, the engine pads the tail with natural decay.

**Format**: MPEG ADTS layer III, v1, 128 kbps, 44.1 kHz, Stereo

---

## 2. Voice-overs (3/3 generated — 100%)

All voices rendered via `POST /v1/text-to-speech/{voice_id}` with model `eleven_multilingual_v2`, settings `stability=0.6, similarity_boost=0.8, style=0.4`.

| Filename | Status | Size | Text |
|---|---|---:|---|
| `voices/globe-l1-1.mp3` | OK | 115400 B | "Welkom op Zonk, kleine wandelaar. Gebruik je handen — ze plakken aan muren. Druk tegen de muur en spring opnieuw." |
| `voices/globe-l1-2.mp3` | OK | 94502 B | "Sterren liggen niet altijd op de grond. Kijk omhoog. Sommige glimmen waar je niet meteen heen kijkt." |
| `voices/globe-l1-3.mp3` | OK | 96174 B | "Drie hartjes maar geen zorgen. Een paddenstoel hier, een cheeseburger daar — en je rekt het verder uit." |

**Format**: MPEG ADTS layer III, v1, 128 kbps, 44.1 kHz, Monaural

### Voice-cast keuze: Sarah (`EXAVITQu4vr4xnSDxMaL`)

**Motivatie**:
- ElevenLabs default library voice; stabiel, goed gedocumenteerd, multilingual
- Warm female mid-range storyteller-timbre — sluit aan op de PRD-vraag "ElevenLabs warm-vrouwelijk mid-range, één voice-cast voor alle Hint Globes"
- "Narrator van Zonk" past bij Hisaishi-Ghibli-toon (warmth zonder sentimentaliteit)
- Nederlandse uitspraak via `eleven_multilingual_v2` is solide voor de korte regels (geen complex jargon)
- Settings: `stability=0.6` (consistent), `similarity_boost=0.8` (clean voice), `style=0.4` (lichte expressiviteit voor narrator-flair)

**Beslissing**: gebruik dezelfde voice-id voor alle Hint Globes door alle 10 levels — single consistent narrator. Bij Sprint 5 dezelfde voice opnieuw gebruiken voor L2-L6 globes.

---

## 3. Music — Suno prompts geschreven (12/12)

Suno heeft geen publieke API beschikbaar — track-prompts zijn gedocumenteerd in `music/_SUNO_PROMPTS.md` voor handmatige render via Suno v4 Pro Custom Mode (Instrumental).

**Tracks**: 12 (alle in D-minor, folktronica × ambient-koto × Hisaishi/BoC textuur, eigen-DNA, geen ZZ Top covers).

| # | File | Where | Tempo | Duration target |
|---:|---|---|---:|---|
| 1 | `title-theme.mp3` | Title screen, menu, credits | 92 BPM | 2:30 |
| 2 | `slow-bloom-l1.mp3` | L1 Surface | 86 BPM | 2:00 |
| 3 | `slow-bloom-l2-l3.mp3` | L2-L3 Surface | 96 BPM | 2:30 |
| 4 | `inkpool-hollow-l4.mp3` | L4 ghost-mechanic | 78 BPM | 2:30 |
| 5 | `inkpool-hollow-l5.mp3` | L5 kaleidoscope tubes | 100 BPM | 2:30 |
| 6 | `inkpool-hollow-l6.mp3` | L6 monument-wall | 88 BPM | 2:00 |
| 7 | `cloud-cathedral-l7.mp3` | L7 industrial-organic | 104 BPM | 2:30 |
| 8 | `cloud-cathedral-l8.mp3` | L8 spring-trampoline | 110 BPM | 2:00 |
| 9 | `bonus-warp-l9.mp3` | L9 25-star bonus-room | 70 BPM | 1:30 |
| 10 | `cloud-cathedral-l10-boss-intro.mp3` | L10 pre-fight | 96 BPM | 0:45 |
| 11 | `boss-fight-l10.mp3` | L10 boss (3-fase blob) | 124 BPM | 3:00 |
| 12 | `cliffhanger-credits.mp3` | Cutscene + credits | 80 BPM | 3:30 |

**Volgende stap**: Richard rendert de tracks in Suno (handmatig), exporteert naar 320kbps MP3, plaatst in `public/assets/audio/music/` met de exact filenames boven. Howler-config is al klaar voor wanneer dat gebeurt.

---

## 4. Howler config

Geschreven naar `_HOWLER_CONFIG.json`. Bevat:
- `basePath: /assets/audio` (Vite serve from `public/`)
- 23 logical-name → file-path mappings (8 SFX + 3 voices + 12 music)
- `globalVolume`, `fadeMs`, `categories` (sfx/voices/music) met default volumes
- `pool` per SFX (4-8 voor frequente, 1-2 voor zeldzame)
- `html5: true` op alle music tracks (streaming, geen pre-decode in memory)
- `levelMusicMap`: `L1` → `music-l1`, etc. — directe lookup voor LevelLoader
- `globeVoiceMap`: per level array van voice-IDs

**TS-import patroon** (suggestie voor Sprint 3 implementatie):
```ts
import audioConfig from '/assets/audio/_HOWLER_CONFIG.json';
import { Howl } from 'howler';

const sounds: Record<string, Howl> = {};
for (const [name, opts] of Object.entries(audioConfig.sounds)) {
  sounds[name] = new Howl({
    src: [`${audioConfig.basePath}/${opts.src}`],
    volume: opts.volume * audioConfig.categories[opts.category].volume,
    loop: opts.loop,
    html5: opts.html5 ?? false,
    pool: opts.pool ?? 5,
  });
}
```

---

## 5. Kosten-estimate

ElevenLabs character/credit pricing (Creator plan, april 2026):

**SFX** (sound-generation):
- Pricing: ~200 chars per second of audio
- Total seconds generated: 0.5+0.5+0.5+0.5+0.5+1.5+1.0+2.0 = **7.0s**
- Estimated chars: 7.0 × 200 = **1400 chars** (~$0.30 op Creator-plan)

**TTS** (text-to-speech, multilingual_v2):
- 1 char = 1 credit
- Sum of voice texts:
  - Line 1: 117 chars
  - Line 2: 96 chars
  - Line 3: 105 chars
- Total: **~318 chars** (~$0.07 op Creator-plan)

**Suno**: nog niet betaald, prompts klaar voor handmatige render.

**Totaal API-kosten Sprint 3 audio (excl. Suno)**: ~$0.37 / circa €0.34

---

## 6. Failures / retries

- 3 SFX returned `HTTP 400 invalid_generation_settings` op de eerste poging wegens `duration_seconds < 0.5`. Opgelost door duration naar 0.5 te bumpen → succesvol op de tweede poging. Geen permanente failures.
- Geen netwerk-, auth- of rate-limit-issues.
- Geen retries op TTS — alle drie de voices first-shot OK.

---

## 7. Open punten / volgende stappen

1. **Suno tracks renderen** (handmatig door Richard): 12 tracks, `_SUNO_PROMPTS.md` is de sourced-of-truth.
2. **Loop-points editen** in Audacity na Suno-render — bar-aligned, geen pop.
3. **Mix-pass**: -14 LUFS, high-pass 60Hz, soft glue-comp. Zie `_SUNO_PROMPTS.md` § Mixing-richtlijnen.
4. **Sprint 5 globe-voices**: zelfde voice-id (`EXAVITQu4vr4xnSDxMaL`) hergebruiken voor L2-L6 hint-globes (consistent narrator).
5. **Boss-stinger + damage-stinger**: niet als aparte Suno-tracks gegenereerd — in Sprint 6/7 via Tone.js procedural over de bestaande track laggen.
6. **Crickets/tape-hiss bedlaag**: optioneel, eventueel field-recording uit free archives toevoegen als ambient bed onder alle tracks (overweeg in Sprint 6 polish-pass).

---

## 8. Files delivered

```
public/assets/audio/
├── _AUDIO_REPORT.md          (dit bestand)
├── _HOWLER_CONFIG.json       (23 sounds gemapped, leveltarget-routing)
├── sfx/
│   ├── cosmo-cling.mp3
│   ├── cosmo-jump.mp3
│   ├── cosmo-stomp.mp3
│   ├── cosmo-hurt.mp3
│   ├── pickup-star.mp3
│   ├── pickup-bonus.mp3
│   ├── globe-trigger.mp3
│   └── bonus-warp.mp3
├── voices/
│   ├── globe-l1-1.mp3
│   ├── globe-l1-2.mp3
│   └── globe-l1-3.mp3
└── music/
    └── _SUNO_PROMPTS.md      (12 prompts klaar voor Suno-render)
```

**Status**: SFX + voices live. Music wacht op Suno-render. Howler-config is forward-compatible.
