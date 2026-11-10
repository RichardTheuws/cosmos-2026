# Wave 24 — Universe 2: Ink-Ocean

> A Moebius-ink underwater realm. The universe that proves the substrate contract is **not forest-hardcoded**: it omits `biomeKey` (`null`) on every room and ships a custom `background(ctx)` that paints ink-line water onto the single shared `ctx.parallax`, exercises the ceremonial **Universe↔Universe portal**, and leans on `localStorage["cosmos.state.v1"]` so a Cosmo who descended here once resurfaces where he left off.
>
> Held to `00-design-bible.md` (the foundation) and `NORTH-STAR.md`. The world breathes; it does not shake. All in-game text is English. No emoji, no placeholder, no stock.

---

## 1. UNIVERSE IDENTITY

- **Name (English, `displayNameEn`):** *Ink-Ocean — where the sea is drawn in one breath*
- **`displayName` (folder/title):** `Ink-Ocean`
- **`name` (slug, = folder):** `ink-ocean`
- **One-line soul:** A sea rendered as a single Moebius pen-line, where light falls in cathedral-shafts and Cosmo learns he can be *weightless*.
- **The dweller question it answers — why is it worth visiting?**
  - **Beautiful:** the whole ocean is one continuous ink contour over wet washes of ink-aubergine and sky-wash; light-shafts comb down through it like a drawn pipe-organ. It is the most painterly frame in the project.
  - **Strange:** there is no floor and no ceiling you can name. Up is a pale sky-wash skin you never reach; down is aubergine that deepens forever. Cosmo *floats* — his idle reads differently here than anywhere else, and a single pop-cyan jellyfish is the only saturated thing in a desaturated world.
  - **Fun (secondary):** the kelp-organ and the updraft-current are repeatable, hands-light delights — push, watch, drift, push again.
- **Sensory signature (how it differs at a glance/listen from Forest and Universe 3):**
  - *Glance:* Forest is warm, opaque, dense (cream + sage, things touching the ground). Ink-Ocean is **cool, translucent, suspended** — everything hangs in negative space, contoured in ink, lit by vertical shafts. Nothing rests on a surface; Cosmo never "stands."
  - *Listen:* Forest is dry, organic, close-mic'd (spores, nectar-drip). Ink-Ocean is **submerged** — a low-passed beatless drone, pressure in the ears, distant whale-throat swells, the click of bubbles released slowly. Headphones make it a pressure-chamber, not a meadow.
  - This is the **descend / drift** universe. Where Forest invites you to *settle*, Ink-Ocean invites you to *sink and let go*.

---

## 2. ROOMS

Two rooms, scaled as a **descent**: you enter in the lit upper water and drift down into the deep. Both rooms keep `biomeKey: null` (no forest biome applies) → both rely on the custom `background(ctx)` seam.

### ROOM A — "The Light-Shafts" (`light-shafts`)

**The visitor's FELT arrival (first 3 seconds):**
You arrive suspended, not standing. The frame is pale sky-wash at the top fading to ink-aubergine below, and **three cathedral shafts of saffron-glow light** comb slowly down through drifting motes — God-rays in water, drawn with ruled ink-hatching. A low submerged drone settles in your ears with a faint pressure-swell. Cosmo doesn't land — he *hovers*, antenna-bulb trailing upward, suction-cup hands splayed slightly as if feeling the water. A scatter of slow bubbles rises past him. It reads instantly: *I am underwater, and it is calm, and it is beautiful.*

**PALETTE:**
- **Dominant locked colors:** `sky-wash` (upper third, the lit surface skin), `ink-aubergine` (lower two-thirds, deepening), `saffron-glow` (the three light-shafts only — warm light cutting cool water).
- **Foreground watercolor:** dark ink-aubergine kelp silhouettes (the kelp-organ interactable), ink-contoured, near-black washes.
- **Mid watercolor:** drifting mote-field + the slow bubble columns; Cosmo lives at mid-depth.
- **Background watercolor:** the sky-wash surface-skin with rippling caustic ink-lines, very pale, suggesting an unreachable above.
- **The ≤5% pop-accent — `pop-cyan`:** a single small **bioluminescent jellyfish** that drifts across the upper-mid frame on a slow loop. It is the only saturated thing in the room — perhaps 2–3% of frame at most, and only when on-screen. (No pop-magenta, no pop-lime in Ink-Ocean — the cyan is the universe's signature single accent.)

**SOUND:**
- **(a) Ambient bed — Suno prompt sketch:**
  > "Beatless underwater drone, deep submerged ambient. Low-passed pad swells, distant filtered whale-throat moan, soft sub-bass pressure pulse ~every 8s. Glassy bowed-string harmonics far in the background, occasional single sustained marimba-mallet note ringing through water. No percussion, no beat. Watercolor-Moebius calm, weightless, suspended. Loopable seamless 90s, headphone-intimate, sits quiet under SFX."
  > *Instrumentation:* low-pass-filtered synth pad · bowed glass-harmonica harmonics · sub-bass swell · one ringing mallet. *Feel:* beatless drone, ~no bpm (free-time swells). *Loop:* yes · target LUFS: quiet · 90s seamless. Ships to `public/assets/audio/music/ink-ocean-shafts.mp3`.
- **(b) Event sounds (2–3) — ElevenLabs SFX:**
  1. **Kelp-organ onUse peak** → "A slow underwater pipe-organ swell, low and reedy, like blowing across a bottle-neck submerged — warm saffron-tinted overtone blooms then bends down as it settles, ~1.8s, no attack-click, all breath."
  2. **Jellyfish pass (inhabitant reaction / drift-by)** → "A single soft glassy bell-chime, very faint, with a cyan shimmer-tail and a wet halo, ~700ms — like one drop of light. Plays once when the jellyfish crosses center-frame, randomized so it never feels timed."
  3. **Bubble-release (traversal / Cosmo idle accent)** → "A short cluster of slow rising bubble-blips, organic and wet, descending-then-rising pitch, ~500ms, never arcade — like a held breath let out underwater."
- **Calm-baseline → peak → settle:** Baseline = the drone + occasional bubble-blips + the jellyfish chime if it happens to pass. Peak = the player drives Cosmo to the kelp-organ → the organ-swell blooms and a brief saffron light-shaft *brightens* (post bloom nudge, never a flash). Settle = within ~2s the swell decays, the shaft returns to baseline brightness, the drone reabsorbs it. Nothing latches; nothing escalates.

**VIBE:**
Emotional register: **awe + release** — the relief of letting gravity go. It stays *calm-enough-to-drift* because nothing demands input: the shafts comb, the jellyfish wanders, Cosmo floats with or without you. It stays *alive-enough-to-hold* because the light moves continuously, the bubbles randomize, and the single cyan jellyfish gives the eye one rare, precious moving accent to track. Pocket-escape test: yes — a 12-minute metro ride spent watching shafts of light comb through ink-water while a being you adopted drifts and occasionally lets out a breath of bubbles. Hands optional.

**INTERACTABLES (1–2):**

1. **The Kelp-Organ** *(headline interactable for Room A)*
   - **Object (painterly, on-brand):** a stand of tall ink-aubergine kelp drawn as hollow reed-pipes, ink-contoured with translucent sky-wash washes inside the tubes. When still, they sway as silhouettes. No emoji/placeholder — a generated/painted layer asset (`assets/objects/kelp-organ.png`), Moebius ink-line over wet wash.
   - **`onUse` behavior:** Cosmo `walkTo` the kelp anchor (in-water, this reads as a slow drift-swim — see ANIMATION REQUEST below), then triggers **`stretch`** (one-shot — he reaches up into the reed-tubes, suction-cup hands splayed) immediately followed by **`wink`** (one-shot — the playful "I made it sing" acknowledgement). The kelp-pipes brighten and the organ-swell SFX (#1) blooms; one light-shaft warms for ~1.8s.
   - **Calm-baseline `update`:** the kelp silhouettes sway on a slow sine (low amplitude, ~0.4Hz), each pipe phase-offset so the stand breathes — no sound at baseline.
   - **Event-peak it triggers:** the organ-swell + the shaft-brighten (a small `post.bloom` nudge via the universe intensity-curve, decaying over 2s).
   - **What the visitor FEELS:** *I touched the world and the world answered with a chord.* The first time, it's a small revelation; every time after, it's a satisfying repeatable note. This is the room's trampoline-analog: small, juicy, skill-free, rewards watching.
   - **ANIMATION REQUEST (cross-builder):** `drift-swim` — *a slow weightless locomotion loop: Cosmo's limbs make lazy underwater paddle-strokes, body bobs gently on the vertical, no foot-contact. Replaces `walk` for all underwater rooms. Loop, 8×8 atlas, count 61, cell 256, fps 12 — same envelope as shipped clips. Until it lands, the substrate falls back to `walk` (acceptable but reads slightly wrong underwater).*

2. **Float-Tap (uses existing `petted`)** — *(optional, builder pattern, no new asset)*
   - **Object:** none placed — this is the direct-tap-Cosmo affordance that exists project-wide, re-skinned by context.
   - **`onUse`:** player taps Cosmo directly → **`petted`** (loop, content) — but here, because he's weightless, the tap also imparts a tiny upward drift impulse (procedural, on `root.position.y`, decays) so he bobs up a hand's-width and slowly sinks back. A small **bubble-release SFX (#3)** plays.
   - **Calm-baseline vs peak:** baseline = no tap. Peak = the content-bob + bubbles.
   - **What the visitor FEELS:** he's *buoyant* — touching him here feels different from petting him on solid ground in the Forest. Proves the same clip reads new in a new universe.

**COSMO here (idle / dweller behavior specific to this room):**
Cosmo's room-idle is a **suspended hover-idle**: he plays `idle` but the substrate adds a slow vertical drift-bob (±0.15 world-units, ~0.25Hz) and a barely-perceptible rotational sway, so he reads as neutrally buoyant rather than standing. Occasionally (every ~25–40s, randomized) he autonomously plays **`look`** to track the passing pop-cyan jellyfish, and rarely **`stretch`** as if reaching toward a light-shaft. He never walks the ground because there is no ground — his autonomous wandering is replaced by slow drift between two hover-anchors. He lives here whether watched or not.

**SUBSTRATE DATA (conformant `rooms.json` entry):**
```json
{
  "id": "light-shafts",
  "area": "the-drowned-cathedral",
  "displayName": "The Light-Shafts",
  "displayNameEn": "The Light-Shafts",
  "description": "Suspended in lit upper water; three saffron shafts comb down through ink-aubergine. A kelp-organ sways at the edge.",
  "anchor": { "x": 0, "y": 0, "z": 0 },
  "cameraBounds": { "panRangeX": 1.8, "panRangeY": 1.2 },
  "biomeKey": null,
  "exits": [
    { "to": "the-trench", "via": "sink-down", "distance": 14 }
  ]
}
```
- **`biomeKey: null`** is the load-bearing proof: no forest biome paints this room → the custom `background(ctx)` seam is required.
- **`cameraBounds.panRangeY: 1.2`** is taller than any forest room (forest maxes 0.6) — vertical pan matters in water; you look up at the surface and down into the dark.
- **behavior.ts hook needed:** `background(ctx)` (custom ink-water parallax — see §5), `inhabitants` (the jellyfish), `interactables` (kelp-organ + float-tap), `audio` (room-specific bed), `transitions.universeToUniverse` + `arrival` (the portal — see §4).

---

### ROOM B — "The Trench" (`the-trench`)

**The visitor's FELT arrival (first 3 seconds):**
You sink. The frame is almost entirely **ink-aubergine deepening to near-black at the lower edge**; the sky-wash surface is now just a faint pale memory at the very top, far away. The light-shafts are gone — instead, a **slow vertical updraft-current** (drawn as rising ink-streak hatching and a column of bubbles) rises through center-frame. The drone is lower, the pressure-swell heavier in your ears. Cosmo drifts in, smaller against the void, and the only color is a faint cyan glow from far below — something luminous, deep. It reads: *I have gone deep, and it is vast, and it is a little uncanny.*

**PALETTE:**
- **Dominant locked colors:** `ink-aubergine` (the overwhelming majority — the deep), with the lower frame washing toward `forest-deep`/near-black (the abyss). A thin band of `sky-wash` at the very top (the distant surface). `saffron-glow` reduced to almost nothing — one faint warm catchlight where the updraft catches stray light.
- **Foreground watercolor:** drifting deep-particle motes, slow and sparse; the rising bubble-column of the updraft.
- **Mid watercolor:** Cosmo + the updraft-current's ink-streak hatching.
- **Background watercolor:** the abyss gradient — aubergine to black, with one barely-there pale shaft-memory up top.
- **The ≤5% pop-accent — `pop-cyan`:** a **deep-glow anglerfish-lure orb** resting at the lower frame — a single small cyan luminous point with a soft halo, the only saturated pixel in the room, well under 5%. It pulses very slowly (the room's one strange heartbeat). It is *seen, never used* — an inhabitant, not an interactable. Slightly menacing in keeping with Cosmo's own uncanny register.

**SOUND:**
- **(a) Ambient bed — Suno prompt sketch:**
  > "Deep-abyss beatless drone, heavier and lower than the upper water. Sub-bass pressure pulse ~every 10s, very long filtered whale-moan swells fading in and out, a faint metallic sonar-ping echo far away (~once per 20s, randomized). Glassy harmonic shimmer occasionally rising from below. No beat, no percussion. Vast, weightless, slightly uncanny but never tense. Loopable seamless 90s, headphone-intimate, quiet."
  > *Instrumentation:* deep sub pad · long whale-moan swell · distant sonar-ping · rising glass shimmer. *Feel:* beatless, free-time, lower register than Room A. *Loop:* yes · quiet LUFS · 90s. Ships to `public/assets/audio/music/ink-ocean-trench.mp3`.
- **(b) Event sounds (2–3) — ElevenLabs SFX:**
  1. **Updraft-ride peak** → "A rising whoosh of pressurized water and a column of bubbles, soft and full-bodied, pitch slowly rising as it lifts, ~2s, then a gentle settling sigh as it releases — all breath and water, no whoosh-cliché, no arcade."
  2. **Deep-glow pulse (inhabitant)** → "A very low, slow glassy throb with a faint cyan-cold shimmer, ~900ms, felt more than heard — like a heartbeat seen as light. Plays softly each time the lure-orb pulses, low in the mix."
  3. **Surface-call (traversal / ascend cue)** → "A faint distant choral 'aah' swell with a warm saffron edge, ~1.5s, calling from above — heard only when Cosmo begins to ascend back toward the light-shafts."
- **Calm-baseline → peak → settle:** Baseline = the heavy drone + slow deep-glow throbs + sparse sonar-pings. Peak = the player sends Cosmo into the updraft-current → the whoosh rises, Cosmo is carried up in a buoyant arc, bubbles bloom. Settle = the current releases him near the top of his arc; he drifts back down over ~3s; the drone reabsorbs the silence. Repeatable, never escalating.

**VIBE:**
Emotional register: **vastness + a tolerable thread of the uncanny** — the awe of the deep where you are very small. It stays *calm-enough-to-drift* because the abyss is mostly still and the only "task" (the updraft) is a gentle ride you choose. It stays *alive-enough-to-hold* because the lure-orb pulses, the sonar pings randomize, and the updraft is a genuinely satisfying repeatable lift. Pocket-escape: yes — a deeper, more meditative chamber than Room A; the metro-ride equivalent of closing your eyes and sinking. The faint menace (lure-orb, uncanny drone) is the *strange* answer — it never tips into stress because nothing pursues, nothing threatens, nothing can fail.

**INTERACTABLES (1–2):**

1. **The Updraft-Current** *(headline interactable for Room B — the trench's trampoline-analog)*
   - **Object (painterly, on-brand):** not a solid object but a *drawn current* — a vertical column of rising ink-streak hatching and slow bubbles, rendered as a tall semi-transparent parallax layer (`assets/objects/updraft-current.png`) with a subtle scroll. Reads as moving water, fully on-brand Moebius-ink.
   - **`onUse` behavior:** Cosmo `drift-swim`s (→ `walk` fallback) to the column base, then the current lifts him: trigger **`jump`** (one-shot — the launch into the current) layered with a **procedural buoyant-arc** (a slow tall vertical lerp up + ease back down, ~3s, much floatier than the forest trampoline's snappy bounce), and on the way down **`fall`** (one-shot — the gentle weightless descent). The updraft-ride SFX (#1) plays through the lift.
   - **Calm-baseline `update`:** the current's bubble-column and ink-streaks scroll slowly upward continuously (it's always "running" as water), but produces no SFX and does not move Cosmo at baseline — it's just alive scenery until he enters it.
   - **Event-peak it triggers:** the buoyant lift + whoosh + a brief bubble-bloom (small particle puff). A faint `post.fluid` nudge during the lift (the water "ripples" around him), decaying on settle.
   - **What the visitor FEELS:** *weightless joy* — the trench's answer to the forest trampoline. The forest trampoline is a snappy spring (skill-free bounce); this is its **counterpoint**: a slow, floaty, exhale of a lift. Same delight-loop grammar, opposite physics. Repeatable and satisfying every time, rewards just watching Cosmo carried up and drift down.
   - **Reuses the `drift-swim` ANIMATION REQUEST** from Room A (no second request needed — `jump`/`fall` already exist and read beautifully underwater as float-launch/float-sink).

2. **The Deep-Glow Lure** *(inhabitant — seen, not used; listed here for completeness)*
   - This is an **inhabitant**, not an interactable (no `onUse`). It's the pop-cyan lure-orb. Cosmo *notices* it: his autonomous behavior here occasionally targets it with **`look`** and, rarely, an uneasy **`duck`** (one-shot — a slight flinch-crouch, reading as "that's a little spooky") before returning to idle. This is the *strange/uncanny* texture, kept calm. It pulses + plays SFX #2; it never attacks, never scores, never threatens.

**COSMO here (idle / dweller behavior specific to this room):**
Same suspended hover-idle as Room A but **slower and lower** — his drift-bob amplitude is a touch larger and his vertical position sits lower in frame (he's heavier in the deep). Autonomously he plays `look` toward the lure-orb (curious), occasionally `duck` (the uncanny flinch), and rarely drifts into the edge of the updraft and lets it lift him on his own (the world plays its own delight-loop when unwatched — a true dweller). Mood register slightly more solemn than the Forest; the brand's "slightly uncanny" Cosmo fits the deep perfectly.

**SUBSTRATE DATA (conformant `rooms.json` entry):**
```json
{
  "id": "the-trench",
  "area": "the-drowned-cathedral",
  "displayName": "The Trench",
  "displayNameEn": "The Trench",
  "description": "The deep below the shafts — ink-aubergine fading to black. A rising updraft-current lifts Cosmo; a single cyan lure-orb pulses far down.",
  "anchor": { "x": 0, "y": -4, "z": 0 },
  "cameraBounds": { "panRangeX": 1.6, "panRangeY": 1.4 },
  "biomeKey": null,
  "exits": [
    { "to": "light-shafts", "via": "rise-up", "distance": 14 }
  ]
}
```
- **`anchor.y: -4`** places Cosmo lower in world-space than Room A's `y:0` — the descent is real geometry, mirroring how forest's `the-hollow` uses `y:-3`.
- **`biomeKey: null`** again — custom background required.
- **`panRangeY: 1.4`** — the deepest vertical pan in the project (you can look up the long way to the faint surface, and down into black).
- **behavior.ts hook needed:** `background(ctx)` (abyss-gradient variant of the ink-water parallax — keyed off `ctx.room.id`), `inhabitants` (lure-orb), `interactables` (updraft-current), `audio` (trench bed).

---

## 3. INTRA-UNIVERSE TRAVERSAL (Room A ↔ Room B)

Both rooms are in **one Area** (`the-drowned-cathedral`) — per the bible's "when unsure → one Area" rule, a single mood-family (submerged) with one path-experience is correct; the descent is a *Room↔Room* depth-shift, not a second mood needing its own palette + boundary. So traversal is the continuous **biome-blend** transition.

- **What it looks like:** descending (`light-shafts` → `the-trench`, via `sink-down`) the camera drifts downward, the sky-wash surface recedes upward out of frame, the saffron shafts dim and slide off the top, and the ink-aubergine deepens to abyss-black — one continuous **sink**, 2.6s. Ascending (`the-trench` → `light-shafts`, via `rise-up`) reverses it: the abyss lightens, the surface-skin slides back in from the top, the shafts return — a **rise** toward the light, accompanied by the faint **surface-call** SFX (#3).
- **What it sounds like:** the Room A bed and Room B bed cross-fade through the blend (the substrate's mood-lerp); on `rise-up` the surface-call choral swell bridges them (calling you up to the light); on `sink-down` the sonar-ping fades in as the whale-moan deepens.
- **The transition mechanism:** **biome-blend** (continuous, 2.6s — within the 1.5–3.0s window). Default substrate driver would suffice; we ship a thin `transitions.roomToRoom` override only to drive the **vertical camera drift** (down on sink, up on rise) and tint the blend with the area's `pathExperience.ambient` ink-aubergine — matching the forest's "override exactly one path" ratio (override the descent flavour, inherit everything else). The area's `pathExperience.kind` is `"drift"` (a known kind → the substrate's drift variant; our override layers the vertical-camera flavour on top).
- **Where Cosmo is on arrival:** per the biome-blend contract, Cosmo's position is set at t=0.5 so he "lands" (here: *settles into neutral buoyancy*) with the new mood already resolving. On `sink-down` he arrives mid-frame in the trench already in hover-idle, drifting down into place at `anchor.y:-4`. On `rise-up` he arrives in the light-shafts, drifting up into `anchor.y:0`, and frequently auto-plays `look` up toward the surface.

---

## 4. PORTAL (Universe ↔ Universe entry / exit)

Per the bible §6, Universe↔Universe is the **ceremonial portal** — the literal "your Cosmo visits my world" moment, built on the existing **NebulaPortal precedent** (the forest's `arrival` uses `{kind:'portal', duration:1.4, hue:0.62}`).

- **Entering Ink-Ocean (from any universe):** the nebula-portal opens, but its **hue is shifted cool** — `arrival: {kind:'portal', duration:1.4, hue:0.55}` (toward sky-wash/cyan rather than the forest's saffron 0.62). Visually: the portal iris is not warm nebula but a **drawn whirlpool / vortex of ink-aubergine and sky-wash**, with the single pop-cyan accent spiraling at its eye. Cosmo is drawn *into and downward* through it — a `fall` clip reads as plunging beneath the surface. As the portal closes, the first thing that resolves is the surface-skin of `light-shafts`, then a wash of bubbles as if Cosmo just broke the surface tension going in.
- **Portal sound:** a ceremonial **submersion swell** — ElevenLabs: "a deep watery whoosh-suck with a rising pressure-drop, a muffling low-pass sweep as if your ears go underwater, capped by a soft saffron bell, ~1.4s." This is the audio signature of "you have left the air and entered the sea." Distinct from the forest portal's airy nebula-chime.
- **Leaving Ink-Ocean:** the reverse — a rising **breach** (the low-pass sweep opens back up, a gasp of surfacing) as the portal carries Cosmo back out toward the next universe. State persists (see below).
- **State persistence (the contract proof):** `localStorage["cosmos.state.v1"]` carries Cosmo's mood/energy/memory/traversal-history across the portal. A Cosmo who descended to `the-trench`, was lifted by the updraft, and then portaled away **resurfaces** (on return) at his last Ink-Ocean room — Ink-Ocean is the universe that exercises this for real, because its two rooms are a stateful descent (you remember how deep you went).
- **Within brand:** the vortex is Hayao×Moebius ink-line, the single pop-cyan stays ≤5%, the ceremony is calm-but-momentous (a held breath, not a bang). No flashing, no shake — the portal *breathes* you under.

---

## 5. SUBSTRATE FILES (full proposed, schema-conformant)

All three mirror the forest shapes field-for-field. `behaviorModule: true` because Ink-Ocean **must** ship a `behavior.ts` (the custom `background(ctx)` is non-optional here — that's the whole point of this universe).

### `universes/ink-ocean/manifest.json`
```json
{
  "$schema": "https://cosmos-2026.dev/schemas/manifest-1.1.json",
  "version": "1.1",
  "name": "ink-ocean",
  "displayName": "Ink-Ocean",
  "displayNameEn": "Ink-Ocean — where the sea is drawn in one breath",
  "summaryEn": "A Moebius-ink underwater realm where the sea is one continuous pen-line over washes of ink-aubergine and sky-wash. Saffron light-shafts comb the upper water; a deep trench holds a rising updraft-current and one cyan glow far below. It exists to prove the substrate is not forest-hardcoded: every room is biomeKey-null and painted by a custom background(ctx).",
  "author": "Richard Theuws",
  "license": "MIT",
  "behaviorModule": true,
  "defaultArea": "the-drowned-cathedral",
  "brandDeviation": null,
  "assets": [
    { "type": "image", "path": "assets/backgrounds/ink-water-surface-4k.png", "preload": true },
    { "type": "image", "path": "assets/backgrounds/ink-water-abyss-4k.png", "preload": true },
    { "type": "image", "path": "assets/objects/kelp-organ.png", "preload": false },
    { "type": "image", "path": "assets/objects/updraft-current.png", "preload": false },
    { "type": "image", "path": "assets/objects/jellyfish-cyan.png", "preload": false },
    { "type": "image", "path": "assets/objects/deep-glow-lure.png", "preload": false },
    { "type": "audio", "path": "../../public/assets/audio/music/ink-ocean-shafts.mp3", "preload": true },
    { "type": "audio", "path": "../../public/assets/audio/music/ink-ocean-trench.mp3", "preload": false }
  ],
  "post": {
    "preset": "calm-baseline",
    "intensityCurve": { "bloom": 1.1, "kaleido": 0.7, "fluid": 1.15, "chroma": 0.95 }
  }
}
```
- `intensityCurve`: **kaleido down** (0.7 — water is not kaleidoscopic, it is continuous), **fluid up** (1.15 — the one post-FX that *is* water, used on the updraft/organ peaks), **bloom slightly up** (1.1 — light-shafts glow), **chroma slightly down** (0.95 — keep it desaturated except the single cyan). Stays inside `preset: calm-baseline`.
- `brandDeviation: null` — Ink-Ocean does **not** deviate; the locked palette explicitly contains ink-aubergine/sky-wash/saffron-glow + pop-cyan, so no deviation entry is needed. (Proof it fits the brand without an escape hatch.)

### `universes/ink-ocean/areas.json`
```json
{
  "$schema": "https://cosmos-2026.dev/schemas/areas-1.0.json",
  "version": "1.0",
  "entryArea": "the-drowned-cathedral",
  "areas": [
    {
      "id": "the-drowned-cathedral",
      "displayName": "The Drowned Cathedral",
      "displayNameEn": "The Drowned Cathedral",
      "description": "One submerged mood, scaled as a descent. Lit upper water with saffron light-shafts above; an ink-aubergine trench below. Two rooms threaded by a single vertical drift.",
      "moodOverrides": {
        "ambient": "#2A1F3D",
        "primary": "#3A2D52",
        "post": { "bloom": 1.1, "kaleido": 0.7, "fluid": 1.15, "chroma": 0.95 }
      },
      "pathExperience": {
        "kind": "drift",
        "duration": 2.6,
        "ambient": "#241834",
        "description": "Sinking or rising through ink-water; the surface-skin recedes or returns overhead while the deep darkens or lightens — one continuous vertical drift."
      },
      "rooms": ["light-shafts", "the-trench"]
    }
  ]
}
```
- `moodOverrides` is a partial (allowed): cool ink-aubergine `ambient`/`primary` hexes (palette-locked aubergine tones) + the universe post-curve. This is where Ink-Ocean's cool baseline is set vs the forest's warm null-inherit.
- `pathExperience.kind: "drift"` — a known kind (maps to the substrate drift variant); the `behavior.transitions.roomToRoom` override adds the vertical-camera flavour.

### `universes/ink-ocean/rooms.json`
```json
{
  "$schema": "https://cosmos-2026.dev/schemas/rooms-1.1.json",
  "version": "1.1",
  "entryRoom": "light-shafts",
  "rooms": [
    {
      "id": "light-shafts",
      "area": "the-drowned-cathedral",
      "displayName": "The Light-Shafts",
      "displayNameEn": "The Light-Shafts",
      "description": "Suspended in lit upper water; three saffron shafts comb down through ink-aubergine. A kelp-organ sways at the edge.",
      "anchor": { "x": 0, "y": 0, "z": 0 },
      "cameraBounds": { "panRangeX": 1.8, "panRangeY": 1.2 },
      "biomeKey": null,
      "exits": [
        { "to": "the-trench", "via": "sink-down", "distance": 14 }
      ]
    },
    {
      "id": "the-trench",
      "area": "the-drowned-cathedral",
      "displayName": "The Trench",
      "displayNameEn": "The Trench",
      "description": "The deep below the shafts — ink-aubergine fading to black. A rising updraft-current lifts Cosmo; a single cyan lure-orb pulses far down.",
      "anchor": { "x": 0, "y": -4, "z": 0 },
      "cameraBounds": { "panRangeX": 1.6, "panRangeY": 1.4 },
      "biomeKey": null,
      "exits": [
        { "to": "light-shafts", "via": "rise-up", "distance": 14 }
      ]
    }
  ]
}
```

### `behavior.ts` hooks needed (sketch — the override seam, NOT production code)
Ink-Ocean exports this subset of `UniverseBehavior`:
- **`background(ctx)`** — *required, the whole point.* Configures the single shared `ctx.parallax` (NEVER constructs a 2nd `ParallaxScene` — the v2.2.4 double-tick scar). Keys off `ctx.room.id`: `light-shafts` builds 6–7 ink-water layers (surface-skin → caustics → 3 saffron shafts → mote-field → kelp-silhouette foreground); `the-trench` swaps to the abyss-gradient layer set (faint surface-band → deep aubergine → updraft-current column → deep-mote foreground). Animates caustic ink-line scroll + shaft sway + mote drift in `update(dt,u)`.
- **`arrival(ctx)`** → `{kind:'portal', duration:1.4, hue:0.55}` (cool submersion portal, §4).
- **`inhabitants(ctx)`** — room-filtered (like forest): `light-shafts` → cyan jellyfish (slow drift loop + chime); `the-trench` → deep-glow lure-orb (slow pulse).
- **`interactables(ctx)`** — room-filtered: `light-shafts` → kelp-organ; `the-trench` → updraft-current.
- **`audio(ctx)`** — room-keyed bed (`ink-ocean-shafts` vs `ink-ocean-trench`), routed through `AudioFFTBridge` at 0.45 base volume.
- **`transitions.roomToRoom(ctx,from,to)`** — thin override: vertical camera drift (down on `sink-down`, up on `rise-up`) over 2.6s biome-blend, ink-aubergine tint. (`areaToArea` omitted — single area. `universeToUniverse` omitted → substrate default portal, hue driven by `arrival`.)

---

## 6. DWELLER-LENS SELF-CHECK (pass/fail, per §1)

- **No score/win/beat:** PASS — nothing counts, completes, or times. Updraft + kelp-organ are skill-free, failure-impossible.
- **Answers ≥2 of fun/exciting/beautiful/strange:** PASS — beautiful (ink-line shafts), strange (weightless, single cyan, lure-orb), fun (kelp-organ + updraft).
- **Pocket-escape (12-min metro, AirPods, calm baseline):** PASS — beatless submerged drones, calm baseline, peaks only on chosen events.
- **Drift-in not lean-in:** PASS — Cosmo hovers, the jellyfish wanders, the lure pulses, the updraft lifts him unwatched.
- **Seeds building:** PASS — the authorship is legible (a builder *chose* a sea drawn in one line, chose to make light sing through kelp); the `biomeKey:null` + custom `background` is the literal demonstration that *you could author your own world this way*.
- **≥1 trampoline-analog:** PASS — two, in fact: kelp-organ (Room A) and updraft-current (Room B, the floaty counterpoint to the forest's snappy trampoline).
- **Sims-density:** PASS — 6–7 parallax layers per room, breathing/reacting inhabitants (jellyfish, lure-orb), ≥1 interactable per room, Cosmo with room-specific autonomous life.
- **Brand/lang gate:** PASS — locked palette only, pop-cyan ≤5%, calm baseline, Cosmo character-DNA preserved (floating reads his uncanny proportions even better), ALL text English, no emoji/placeholder/stock, `brandDeviation:null`.

---

*One animation request raised: `drift-swim` (underwater locomotion loop, replaces `walk`; `walk` is the acceptable fallback until it lands). Everything else uses the shipped 12-clip set: `idle`, `look`, `stretch`, `wink`, `petted`, `jump`, `fall`, `duck`.*

*Held to NORTH-STAR. The sea breathes; it does not shake.*
