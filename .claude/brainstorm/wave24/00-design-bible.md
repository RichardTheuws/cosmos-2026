# Wave 24 — Design Bible (Foundation)

> The shared decision tree every Wave-24 designer is held to. Read this before touching a `manifest.json`, a `behavior.ts`, or a sound prompt. It transcribes ground truth from `NORTH-STAR.md`, `.claude/CLAUDE.md`, `UNIVERSE-AUTHORING.md`, `AREA-AUTHORING.md`, `ROOM-AUTHORING.md`, `universes/forest/{manifest,areas,rooms}.json`, `universes/forest/behavior.ts`, `public/assets/cosmo-frames/manifest.json`, `AGENTS.md`, `INTEGRATIONS.md`. Where this file and a brainstorm doc disagree, NORTH-STAR + the real JSON win.

This is **a design canvas for human review**, not production code. Every section ends in a pass/fail gate.

---

## 1. The Dweller Lens — reviewer checklist

Crystallized 2026-05-31 (NORTH-STAR §1 + §6 ledger). The player is a **visitor who gathers experiences, not points.** No score, no win, no beat-timing. Each room must answer — through **sound + vibe + interaction** — "Is it fun here? Exciting? Beautiful? Strange?" Target feel = **pocket-escape**: AirPods in, waiting room / metro ride; calm enough to drift *into*, alive enough to *hold* you. Visiting **seeds building**. Cosmo is a dweller too — a being with his own life on screen whether or not you watch.

Every room/area/universe proposal must pass ALL of these:

- [ ] **No score, no win, no beat.** Nothing counts up, nothing is "completed," nothing times the player against a clock. If a mechanic rewards skill or punishes failure → cut it. (The retired `VibeMeter`/combo/DeepTripMode is the anti-pattern; do not reintroduce its shape.)
- [ ] **Answers the four questions.** State explicitly, per room: what is *fun* here, what is *exciting*, what is *beautiful*, what is *strange*. A room that can't answer at least two is a wallpaper.
- [ ] **Pocket-escape feel.** Would this hold someone on a 12-minute metro ride with AirPods in, without demanding their hands or stress? Calm baseline; peaks are events, not the steady state.
- [ ] **Drift-in, not lean-in.** The room invites passive watching as much as active poking. Cosmo lives here whether or not the player acts.
- [ ] **Seeds building.** Does wandering this room plant *"what would I make in mine?"* — is the authorship legible (you can sense a builder made a choice here)?
- [ ] **At least one delight-loop (trampoline-analog).** A small, juicy, repeatable joy Cosmo returns to that feels good every time, requires no skill, and rewards watching. (ROOM-AUTHORING §trampoline-analog.)
- [ ] **Sims-density.** Multiple things to do/notice: inhabitants that breathe + react, background life, ≥1 interactable, 5–7 parallax layers. One tree + one Cosmo = fail. Deliberate stillness is allowed only if declared in the README.

---

## 2. LOCKED Brand / Visual / Language — pass/fail

These never bend without a NORTH-STAR §6 pivot entry (`.claude/CLAUDE.md` brand contract; NORTH-STAR §3 locked sections). Do not restyle, do not re-ask.

**Visual**
- [ ] Hayao×Moebius watercolor base. No emojis. No unicode symbols. No Roblox-style placeholders. No stock graphics. Canvas-primitives or generated assets only.
- [ ] Palette stays inside: **mushroom-cream / moss-sage / sky-wash / faded-rose / ink-aubergine / saffron-glow / forest-deep**.
- [ ] Pop-accents ≤ **5% of frame**: pop-magenta / pop-lime / pop-cyan only.
- [ ] **Calm baseline + weirdness on event-peaks only.** Anything constantly-trippy = anti-pattern. "The world breathes, it does not shake."
- [ ] No pivot to bolder-pop / anime / graphic-novel. Visual questions must be implementation-concrete (which crop / dimension / decal-region), never "which mood."

**Cosmo 1992 DNA** (any Cosmo gen uses the `rtcosmo` LoRA trigger word)
- [ ] pearl-drop head · chameleon-bulging eyes · saffron-crescent catchlight · single antenna with flower-bulb · soft fingerless mitten-hands with faintly saffron-glowing palms (no suction cups) · faded-rose spots on green body · **NO tail** · slightly uncute / slightly menacing-uncanny proportions.

**Language**
- [ ] **ALL in-game text is ENGLISH** — every UI label, hint, room name shown to player, button, tooltip, invite copy. A Dutch in-game string is a bug. (We converse in Dutch; the game is English.) Dutch is permitted only in `displayName` (the non-`En` field) and internal docs — never in anything the player reads as instruction/UI.

**Brand-deviation escape hatch**: a Universe may deviate *inside its own folder only* by setting `manifest.brandDeviation` to a rationale + documenting it in its README. The substrate (everything outside `universes/`) may not. Areas inherit; they never declare their own brand-stance.

---

## 3. Substrate data schema — transcribed field-by-field with forest worked example

The traversal grammar is `?substrate=v2&universe=<u>&area=<a>&room=<r>` (post-cutover `?substrate=v2` is a no-op default). Resolution is **left-to-right with logged warnings**; invalid universe → `forest`, invalid area → universe `defaultArea`, invalid room → area `entryRoom`; each fallback `history.replaceState`s so share-links self-heal. Cosmo state (mood/energy/memory/inventory/traversal-history) lives in `localStorage["cosmos.state.v1"]` and survives all URL changes.

Four required artifacts per Universe, at `universes/<name>/`, loaded in order: `manifest.json` → `areas.json` → `rooms.json` → `README.md` (+ ≥1 composition-spec.json + PNG layers; optional `behavior.ts`).

### 3.1 `manifest.json` — Universe metadata + preload list

| Field | Type / allowed | Meaning | Forest value |
|---|---|---|---|
| `$schema` | url | schema id | `https://cosmos-2026.dev/schemas/manifest-1.1.json` |
| `version` | string | schema version; unknown **majors fail loudly**, minors forward-compat | `"1.1"` |
| `name` | slug | **must equal folder name**; appears in `?universe=` | `"forest"` |
| `displayName` | any lang | shown title | `"The Mushroom Forest"` |
| `displayNameEn` | English ≤100 chars | navigation for non-native readers | `"The Mushroom Forest — Cosmo's entry Universe"` |
| `summaryEn` | 2 sentences | what it is + why it wants to exist (PR review / index) | (see file) |
| `author` | string | required | `"Richard Theuws"` |
| `license` | string | required; MIT default | `"MIT"` |
| `behaviorModule` | bool | `true` iff a `behavior.ts` ships (skips a prod 404-probe) | `true` |
| `defaultArea` | area id | area when `&area=` omitted; **must exist in areas.json**; manifest wins over `areas.entryArea` on disagreement | `"the-mushroom-stand"` |
| `brandDeviation` | `null` \| string | `null` = follows brand; else a rationale reviewers engage | `null` |
| `assets[]` | `{type,path,preload}` | declarative preload list; paths universe-folder-relative, `../` stripped/normalised; `preload:true` resolves before arrival (eager at Universe-load), `false` lazy | 6 entries; `type:"image"|"audio"`; forest bg `preload:true`, objects `preload:false` |
| `post.preset` | `"calm-baseline" \| "deep-trip" \| "neutral"` | drives post-FX biome curve in this Universe; default `calm-baseline` | `"calm-baseline"` |
| `post.intensityCurve` | `{bloom,kaleido,fluid,chroma}` | optional multipliers on post-FX stack | `{1.0, 0.85, 0.9, 1.0}` |

### 3.2 `areas.json` — the Area tier

Top level: `$schema` (`areas-1.0.json`), `version` (`"1.0"`), `entryArea` (area used when `&area=` omitted; should equal `manifest.defaultArea`, manifest wins), `areas[]` (ordered — order only matters for first-listed fallback).

Per area entry:

| Field | Type / allowed | Meaning | Forest value |
|---|---|---|---|
| `id` | slug | stable; URLs reference it; renaming breaks share-links | `"the-mushroom-stand"` |
| `displayName` | any lang | Dutch OK here | `"De paddenstoelenstand"` |
| `displayNameEn` | English ≤100 | navigation | `"The Mushroom Stand"` |
| `description` | 1–3 sentences | mood + what makes the area distinct from siblings | (see file) |
| `moodOverrides` | `null` \| partial `{ambient, primary, post:{bloom,kaleido,fluid,chroma}}` | `null` inherits `manifest.post`; partial overrides only what differs (palette-locked) | `null` |
| `pathExperience` | object | the Room↔Room walk *flavor* (NOT a loading screen) | (below) |
| `pathExperience.kind` | `"mushroom-path" \| "burrow-down" \| "drift" \| "fade"` (any string accepted; unknown → default biome-blend) | maps to a default driver variant | `"mushroom-path"` |
| `pathExperience.duration` | seconds | | `2.4` |
| `pathExperience.ambient` | hex | path clear-color tint while traversing | `"#F5EDD8"` |
| `pathExperience.description` | 1 sentence | reviewers + future self | (see file) |
| `rooms[]` | room-id strings | set-membership (which rooms belong); traversal lives in `rooms.json exits[]` | `["clearing","deep-grove","the-hollow"]` |

**When to split into a 2nd Area** (AREA-AUTHORING): only when a second mood needs its *own palette tweak + own path-experience + own boundary moment*. Otherwise stay one Area; vary mood per-Room via `biomeKey`. When unsure → one Area.

### 3.3 `rooms.json` — the Room tier (flat at Universe level → `getRoom(id)` without traversing Areas)

Top level: `$schema` (`rooms-1.1.json`), `version` (`"1.1"`), `entryRoom` (room when `&room=` omitted), `rooms[]`.

Per room entry:

| Field | Type / allowed | Meaning | Forest `clearing` value |
|---|---|---|---|
| `id` | slug | stable; URLs + `exits[].to` reference it | `"clearing"` |
| `area` | area id | must exist in areas.json; **required v1.1**; missing → `manifest.defaultArea` (Wave-20a back-compat) | `"the-mushroom-stand"` |
| `displayName` / `displayNameEn` | any lang / English ≤100 | same convention as Areas | `"The Clearing"` / `"The Clearing"` |
| `description` | 1 sentence | room summary | `"A soft mushroom-cream open space where Cosmo arrives. The trampoline lives here."` |
| `anchor` | `{x,y,z}` world-space | where Cosmo is placed on enter; camera centres on it | `{0,0,0}` |
| `cameraBounds` | `{panRangeX, panRangeY}` optional | pan limits; tighten for intimate rooms, widen for vistas; omit → defaults | `{1.6, 0.6}` |
| `biomeKey` | string \| `null` | key in `BIOMES` registry → DefaultBackground routes via `BiomeManager`; `null` = fully-custom bg from `assets/backgrounds/<room-id>/composition-spec.json` | `"slow-bloom"` |
| `exits[]` | `{to, via, distance}` | directed graph edges OUT of this room. `to`=target id; `via`=path flavour string (used by `transitions.roomToRoom` override); `distance`=informational AI traversal-cost. Back-edges are convention not enforced; asymmetric (one-way burrow) is valid design. Cross-area exits valid → substrate auto-runs gradient-cut. | `[{to:"deep-grove",via:"left-mushroom-path",distance:12},{to:"the-hollow",via:"down-burrow",distance:8}]` |

### 3.4 `behavior.ts` (optional escape hatch)

Exports any subset of `UniverseBehavior`; substrate detects each via `typeof mod[key] === 'function'`; missing → default driver. Exports: `background?`, `arrival?`, `inhabitants?`, `interactables?`, `audio?`, `transitions?.{roomToRoom?, areaToArea?, universeToUniverse?}`.

JSON-only **floor** defaults (substrate fills in): background = composition-spec parallax via `DefaultBackground` (single shared `ctx.parallax` — **never construct a 2nd ParallaxScene**, the v2.2.4 double-tick scar); arrival = 1.4s portal, hue from `post.preset`; inhabitants = empty; interactables = empty; transitions = biome-blend / gradient-cut / portal; audio = silence unless an `assets[]` audio entry has `preload:true` → loops at 0.45 volume.

---

## 4. Painted-frames clip vocabulary + builder-interactable pattern

### 4.1 The 12 shipped clips (`public/assets/cosmo-frames/manifest.json`)
All clips: 8×8 atlas, `count:61`, `cell:256`, `fps:12`.

| Clip | loop | Reads as | Good trigger |
|---|---|---|---|
| `idle` | ✓ | calm-baseline presence | default state |
| `walk` | ✓ | locomotion to a target | `walkTo` an interactable |
| `bounce` | ✓ | repeated joyful spring | trampoline-analog peak (procedural trick-spins layer on top of this) |
| `jump` | ✗ | single arc | one-shot leap / reach |
| `duck` | ✗ | crouch/dodge | shelter, peek-under, low object |
| `dance` | ✓ | rhythmic delight | music object, celebratory loop |
| `wave` | ✗ | greeting | arrival, hello to an inhabitant |
| `wink` | ✗ | playful acknowledgement | small reward, "got it" |
| `stretch` | ✗ | waking/limbering | rest spot, sunbeam, after idle |
| `fall` | ✗ | descent | drop into a burrow / down-exit |
| `petted` | ✓ | being touched, content | player taps Cosmo directly |
| `look` | ✗ | turns to notice | reacts to an inhabitant / event |

New movements are **requestable as new clips** (cross-builder animation requests → contributed into the shared atlas). Procedural trick-spins (rollZ/pitchX) compose on top of `bounce`.

### 4.2 Builder-interactable spec (the trampoline is EXAMPLE #1, not a special case)

An interactable = **an object placed in a room** + an **`onUse` that drives Cosmo** (walkTo → a clip/behavior) + a **calm-baseline state** + an **event-peak**. Authored via `behavior.interactables(ctx)` → `InteractableHandle[]` (default empty). Shape (ROOM-AUTHORING / behavior.ts):

```ts
interface InteractableHandle {
  id: string;
  anchor: { x: number; y: number; z: number }; // where Cosmo walks to
  range: number;                                // how close the AI counts as "at" it
  update(dt, u): void;                          // calm-baseline life (hover-bob etc.)
  onUse(cosmo: CosmoV2Rig): void;               // the event-peak: drive a clip
  dispose(): void;
}
```

Forest trampoline (worked example): `id:"trampoline"`, `range:2.0`, anchored at `room.anchor` z-2.0, spawned only in `clearing`; `update` runs the hover-bob (calm baseline); `onUse` triggers the bounce/jump-arc peak (CosmoAnimDirector will own the full clip-drive). **Inhabitants** differ: autonomous lives Cosmo *sees* but doesn't activate (`InhabitantHandle{id,update,dispose}`, default empty) — eyeball-sentry, breathing-portal, floating-star. The companion-AI *targets* interactables and *sees* inhabitants.

**Every interactable design must name**: (a) the object + its painted asset, (b) which clip(s) `onUse` drives, (c) its calm-baseline `update` behavior, (d) its event-peak. A peak that runs constantly is an anti-pattern.

---

## 5. Sound design template — per room

Every room needs **(a) one ambient bed** + **(b) 2–3 event sounds** tied to interactions/peaks. Calm baseline; peaks on events. Runtime = Web Audio + Howler + Tone; generation = **Suno** for beds (~$10/mo wrapper, ~500 gens), **ElevenLabs** for SFX/voice ($5/mo tier). Beds ship to `public/assets/audio/music/<bed>.mp3`, wired through `AudioFFTBridge`; default audio driver loops the first `preload:true` audio asset at 0.45 volume.

Fill this per room:

```
ROOM: <id>
(a) AMBIENT BED — Suno prompt sketch:
    "<tempo bpm or 'beatless drone'>, <instrument palette>, <mood adjectives from the four-questions>,
     watercolor/Moebius-calm, loopable, no percussion-forward beat, low-key, headphone-intimate"
    loop: yes · target LUFS: quiet (sits under SFX) · length: 60–120s seamless
(b) EVENT SOUNDS (2–3) — ElevenLabs SFX descriptions, each tied to an interaction/peak:
    1. <interactable onUse peak>  → "<short organic descriptor, e.g. 'soft wet boing with a saffron shimmer tail, ~600ms'>"
    2. <inhabitant reaction>      → "<descriptor>"
    3. <traversal/path moment>    → "<descriptor>"
```

Gate: a bed that is percussion-forward or a "beat to tap on" fails the dweller lens (§1). SFX must be organic/painterly, never arcade-blip.

---

## 6. Traversal / transition rules per scale

Layered by scale so the world breathes, doesn't shake. **You don't declare which transition fires — spatial scope determines it.**

| Scale | Transition | Default behavior | Override |
|---|---|---|---|
| **Room ↔ Room** (same Area) | **biome-blend** (continuous) | 1.5–3.0s; mood lerps continuously (Universe → Area override → Room). `areas.pathExperience` colours the flavour (`ambient` tint, `kind` variant). | `behavior.transitions.roomToRoom(ctx, from, to)` → `TransitionDriver{run():Promise<void>, dispose()}`. Cosmo's position is set at t=0.5 so he "lands" with the new mood. Forest overrides exactly one path (mushroom-path); match that ratio — override nothing flattens, override everything shakes. |
| **Area ↔ Area** (same Universe) | **gradient-cut** (brief, directional) | 0.6–1.2s (default 0.9s); single-pass shader sweeps source `primary` → target `primary` diagonally; Cosmo renders on top. Substrate picks colors automatically. | `behavior.transitions.areaToArea`. Most never need it. |
| **Universe ↔ Universe** | **portal** (ceremonial event) | the nebula-portal; the literal "your Cosmo visits my world" moment. Arrival default = 1.4s portal, hue from `post.preset`. | `behavior.transitions.universeToUniverse` + `behavior.arrival`. |

---

## 7. Universe assignments (Wave 24 team)

Maximally distinct, spanning roadmap breadth, all inside the locked palette.

- **Universe 1 — "Mushroom Forest"** *(EXISTING home universe — deepen to 2 rooms incl. the current Clearing with the trampoline).* `name:"forest"`, area `the-mushroom-stand`. Designer mirrors the exact JSON shapes above; the Clearing + trampoline stay; add/finish a second fully-alive room (the existing graph already names `deep-grove` + `the-hollow` — pick one to bring to full Sims-density, with its own delight-loop + bed + 2–3 SFX). Palette: mushroom-cream / moss-sage / saffron-glow, faded-rose accents.
- **Universe 2 — "Ink-Ocean"** *(the chosen 2nd universe, NORTH-STAR §6 Wave-22).* A Moebius-ink underwater realm. Palette: **ink-aubergine / sky-wash / saffron-glow + one pop-cyan** (≤5%). This is the universe that proves the contract is generic (forces a custom `background(ctx)` configuring `ctx.parallax` — the non-biome override seam) and exercises the portal-transition + state persistence for real.
- **Universe 3 — designer commits to one of these** (each maximally distinct from lush-forest + deep-ocean; one-line brief):
  - **Dune-Sea at Dusk** — a vast slow wind-sculpted sand ocean under a saffron-glow horizon fading to ink-aubergine; the delight-loop is something that *sings or slides* on the dunes; sparse, meditative, "beautiful + strange."
  - **Luminous Crystal Cavern** — an intimate underground vault of slow-pulsing moss-sage/sky-wash crystals that hum when Cosmo nears; tight `cameraBounds`, faded-rose glow-pools; "strange + calm."
  - **Floating Sky / Cloud-Temple** — drifting cream-and-sky-wash cloud platforms at high altitude with a wide vista; the delight-loop is a thermal-updraft Cosmo can ride (jump/fall clips); airy, "exciting + beautiful."

---

*Held to NORTH-STAR. The world breathes; it does not shake.*
