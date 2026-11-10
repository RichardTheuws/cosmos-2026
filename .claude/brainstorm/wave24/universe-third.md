# Wave 24 — Universe 3 (Designer's Commit): **The Singing Dunes**

> A design canvas for human review. Held to NORTH-STAR + the Dweller Lens + the locked brand/palette + English-only + calm-baseline. The world breathes; it does not shake.
> Schema mirrored field-for-field from `universes/forest/{manifest,areas,rooms}.json` and `00-design-bible.md §3`.

---

## 0. The commit — why Dune-Sea over Crystal Cavern / Cloud-Temple

I commit to **Dune-Sea at Dusk**, named **The Singing Dunes**.

It is the most *distinct* of the three candidates because it sits at the opposite pole of forest and ocean on every spatial axis:

| Axis | Forest (U1) | Ink-Ocean (U2) | **Singing Dunes (U3)** |
|---|---|---|---|
| Density | dense canopy | dense water-column | **sparse, near-empty** |
| Dominant axis | vertical (drip down) | vertical (sink/rise) | **horizontal (lateral drift)** |
| Enclosure | enclosed under leaves | submerged, pressed-in | **vast open, no ceiling** |
| Moisture | wet/nectar | wet/suspended | **dry, grain, heat-shimmer** |
| Light | dappled green | bioluminescent cyan | **low raking saffron dusk** |

Crystal Cavern would re-tread ocean's *enclosed-glow / cyan-hum* register (two intimate glowing caves in one portfolio = redundancy). Cloud-Temple's headline is a *thermal-updraft ride* — an excitement/skill loop that leans toward lean-in thrill, fighting the pocket-escape "drift-in, hands-free" target.

The dune-sea is also the most **meditative-psychedelic** within the palette: the saffron-glow→ink-aubergine dusk is the single most naturally-breathing gradient we own; *singing sand* (a real acoustic phenomenon) gives a hypnotic, skill-free, beautiful delight-loop; and **emptiness itself is the strangeness** — a gorgeous place where almost nothing happens, which is exactly the metro-ride pocket-escape.

---

## 1. UNIVERSE IDENTITY

**Name (English):** The Singing Dunes
**One-line soul:** A windless dusk over an endless sand-ocean that hums when you move across it.
**The dweller question it answers:** *Is it beautiful and strange here?* — Yes: beautiful in the saffron→aubergine horizon that never quite resolves into night; strange in that the sand itself **sings** a low slow chord whenever Cosmo slides, and the dunes very slowly **redraw their own crests** while you watch, as if the landscape is breathing in slow motion. (It also answers *fun* via the slide-loop — but its primary register is beauty+strangeness.)
**Sensory signature (how it differs at a glance / a listen):**
- *Glance:* almost no foreground clutter — wide horizontal bands of warm sand-light meeting a tall dusk sky; heat-shimmer wobble at the horizon; a single long-shadowed dune-crest is the only "object" in frame. Where forest is busy-vertical and ocean is busy-suspended, the Dunes are **calm-horizontal and almost-empty**.
- *Listen:* no melody, no percussion — a single sustained **resonant sand-drone** (the dune itself) plus wind that has texture but no gusts. Forest is dripping/organic-wet; ocean is bubbling/muffled; the Dunes are **dry, granular, and wide-open**, with one deep harmonic that swells only when Cosmo moves.

---

## 2. ROOMS

This Universe is **one Area, two rooms** (per AREA-AUTHORING: split into a 2nd Area only when a second mood needs its own palette tweak + path-experience + boundary moment — both rooms share the dusk mood, so one Area, mood varied per `biomeKey`). The two rooms are **the open crest-line (vista)** and **a sheltered hollow between two dunes (intimate)** — the same dusk, seen wide then close.

---

### ROOM A — **The Long Dune**

**Felt arrival (first 3 seconds):**
You land high on a windswept crest. The frame is mostly sky: a tall saffron-glow band low on the horizon bleeding upward into ink-aubergine, the first faint stars not yet committed. Below you, ranks of sand-ridges recede in cooling bands toward a shimmering horizon. The sound that reaches you first is **width** — a soft dry wind with grain in it, and under it a single low sustained tone you feel more than hear. Cosmo stands at the lip, antenna-bulb tilting as if testing the air. Nothing rushes you. It is dusk that has decided to last.

**PALETTE**
- **Dominant locked colors:** *saffron-glow* (the low horizon-light and the lit faces of dunes) → *ink-aubergine* (the upper sky and the deep shadow-sides of dunes) → *faded-rose* (the soft mid-band where light and dark meet, the "alpenglow" on far crests). *Mushroom-cream* used very sparingly for the brightest sand-highlights catching the last light.
- **Foreground watercolor:** a single near dune-crest, sand rendered in dry-brush saffron-glow on its lit slope, ink-aubergine in its long shadow; a few wind-combed striations.
- **Mid:** receding dune-ranks in faded-rose, each fainter than the last (atmospheric perspective).
- **Background:** the great dusk sky gradient + heat-shimmer at the horizon line.
- **Pop-accent (≤5%, ONE color = pop-magenta):** a single tiny **glass-bead bloom** — a cluster of three or four desert-glass nodules half-buried in the foreground sand, that catch a pinprick of **pop-magenta** glint only at the exact angle of the last light. They occupy well under 5% of frame and are the one "impossible" color in an otherwise warm-natural palette — the strangeness made visible.

**SOUND**
- **(a) Ambient bed — Suno prompt sketch:**
  > "Beatless desert drone, ~52 bpm felt-pulse (no percussion), bowed double-bass harmonic + soft glass-harmonica pad + a single sustained sine sub-tone, warm and dry, vast open-air reverb, slow swelling and receding like breath, Moebius-calm watercolor mood, melancholy-beautiful, loopable, headphone-intimate, low-key, no melody-line."
  > loop: yes · target LUFS: quiet (sits under SFX) · length: 90–120s seamless
- **(b) Event sounds (2–3) — ElevenLabs SFX:**
  1. **Sand-slide peak** (the slide interactable `onUse`) → *"a deep resonant sand-boom that swells from near-silence to a warm sustained chord over ~1.8s then decays into a granular hiss, like a cello note made of sand, no attack-transient, organic."*
  2. **Glass-bead glint** (the desert-glass inhabitant catching light) → *"a single tiny crystalline shimmer-ping with a long soft tail, ~700ms, glassy but warm, almost subliminal."*
  3. **Path / crest-wind moment** (traversal toward Room B) → *"a slow textured dry-wind swell with fine grain in it, rising and falling once over ~2.5s, no gust-spikes, spacious."*
- **Calm→peak→settle arc:** Baseline = the drone + grainy wind only. When Cosmo slides a dune (peak), the **sand-boom (1)** swells *with* the slide and the drone briefly rises a fifth in pitch, the bead-glint (2) may fire if light-angle aligns; then over ~3s the chord decays back into the wind and the drone settles to baseline. Peaks are events, never the steady state.

**VIBE**
Emotional register: **awe + gentle melancholy** — the held breath of the last light of a day. It stays *calm-enough-to-drift* because the baseline is near-empty and slow; nothing blinks, nothing demands. It stays *alive-enough-to-hold* because the dunes **very slowly redraw their crests** (a 30–60s morph cycle you only notice if you watch), the heat-shimmer never stops wobbling, and the slide-loop is always one tap away. Pocket-escape test: passes — a 12-minute metro ride here is a place to *exhale*, not a task.

**INTERACTABLES (builder-authored pattern)**

1. **The Slide-Crest** *(the trampoline-analog — the delight-loop)*
   - **Object (painterly, on-brand):** the lit edge of the foreground dune itself, marked subtly by a smoother dry-brushed sheen of saffron-glow sand — clearly "the place that slides," no icon, no emoji. Painted asset: `objects/slide-crest.png` (a sand-sheen decal layered on the foreground crest).
   - **`onUse` (Cosmo walkTo → clips):** Cosmo walks to the crest lip (`walk`), pauses at the edge (`look` down the slope), then **`fall`** as he slips over and slides down the lit face — with a **procedural lateral-glide drift** (a gentle rollZ sway + downhill translation layered on top of the `fall` pose, NOT a tumble) — landing into a soft **`stretch`** at the dune-foot as the sand-boom decays. He then idles, and the slope's sheen *slowly re-forms uphill* inviting another go.
   - **Calm-baseline `update`:** the crest-sheen does a very slow shimmer-breathe (opacity + a 1px heat-wobble), and the sand grain on the lit face drifts imperceptibly downhill — alive but silent.
   - **Event-peak:** the slide + the sand-boom chord (SFX 1) + drone pitch-swell. Small, juicy, repeatable, skill-free, rewards watching.
   - **What the visitor FEELS:** the satisfying *whump-and-hum* of a sand-slide — the same "I'll do that again" pull as the trampoline, but horizontal and meditative instead of bouncy. Joy without effort.
   - **ANIMATION REQUEST (cross-builder):** *clip `slide`* — a one-shot ~1.6s painted clip of Cosmo seated/leaning back, arms out for balance, body angled downslope, suction-cup hands trailing in the sand. Brief: "Cosmo sledding down a slope on his backside, calm not frantic, slight grin, antenna streaming back." Until shipped, the composite above (`fall` + procedural lateral-glide + `stretch`) is the fallback and reads acceptably.

2. **The Bead-Bloom** *(a smaller, quieter interactable)*
   - **Object:** the cluster of half-buried desert-glass nodules (the pop-magenta accent). Painted asset: `objects/glass-bead-bloom.png`.
   - **`onUse` (walkTo → clip):** Cosmo walks over (`walk`), crouches (`duck`) to peer at the beads, and **`wink`s** as a tiny pop-magenta glint answers him (SFX 2 fires); he rises back to `idle`.
   - **Calm-baseline `update`:** the beads glint only on the light-angle cycle (tied to the slow dusk shimmer) — most of the time they're dormant warm-grey nodules.
   - **Event-peak:** the synchronized glint + the crystalline shimmer-ping; brief and intimate.
   - **What the visitor FEELS:** the small private delight of noticing something almost-hidden — *strange*, like the desert kept one secret jewel. It rewards the slow looker.

**COSMO here (idle / dweller behavior specific to this room):**
Left alone, Cosmo dwells like a small traveler at a viewpoint: long `idle` with his antenna-bulb slowly tilting toward the horizon as if listening to the drone; occasionally a spontaneous `look` out to the far dunes when a crest redraws; once in a while a quiet `stretch` as the light shifts. He drifts a few steps along the crest and stops. He is unhurried, faintly contemplative — a being having his own dusk whether or not you watch.

**SUBSTRATE DATA (conformant `rooms.json` entry):**
```json
{
  "id": "long-dune",
  "area": "the-singing-flat",
  "displayName": "The Long Dune",
  "displayNameEn": "The Long Dune",
  "description": "A high windswept crest over an endless dusk sand-sea. The slide-crest lives here.",
  "anchor": { "x": 0, "y": 0, "z": 0 },
  "cameraBounds": { "panRangeX": 2.4, "panRangeY": 0.9 },
  "biomeKey": "dusk-dune",
  "exits": [
    { "to": "the-windless-hollow", "via": "descend-leeward", "distance": 10 }
  ]
}
```
*(Wide `cameraBounds` — this is a vista; the dunes want lateral space.)*
**behavior.ts hook needed:** `background(ctx)` (custom — `biomeKey:"dusk-dune"` must exist in the BIOMES registry OR fall back to a `composition-spec.json` parallax; either way configure the single shared `ctx.parallax`, never a 2nd ParallaxScene), `interactables(ctx)` (slide-crest + bead-bloom), `inhabitants(ctx)` (the slow crest-redraw + bead glint-cycle), `audio(ctx)` (dune drone bed + the 3 SFX).

---

### ROOM B — **The Windless Hollow**

**Felt arrival (first 3 seconds):**
You descend into the lee of two dunes and the world goes *still*. The sky narrows to a soft band overhead; the wind drops away to almost nothing; the saffron-glow is gentler here, pooled and reflected off the sheltering sand-walls into a warm faded-rose glow. The drone is closer, more enveloping, as if the hollow holds the sound. In the cupped sand-floor lies a smooth scoured **wind-bowl** where the sand has settled into ripples. Cosmo arrives a little lower in the frame, calmer, almost cradled. It is the quiet *inside* the vastness.

**PALETTE**
- **Dominant locked colors:** *faded-rose* (the reflected pooled light on the inner sand-walls — the signature of the hollow) + *saffron-glow* (softer here, the warm floor) + *ink-aubergine* (the deepening upper shadow and the narrow sky). *Mushroom-cream* for the brightest ripple-edges of the wind-bowl.
- **Foreground watercolor:** the rippled wind-bowl floor, sand drawn in concentric faded-rose/cream ripples.
- **Mid:** the two cupping dune-walls in saffron-glow turning to ink-aubergine where they curve away from light.
- **Background:** the narrow band of dusk sky and one faint early star.
- **Pop-accent (≤5%, ONE color = pop-magenta — kept consistent with Room A):** a thin line of **pop-magenta** that appears *only* on the event-peak — the rim-light that races along the bowl's ripple-crests when the bowl rings (see interactable). At calm baseline there is **no pop-accent at all** in this room (even quieter than Room A), which makes the peak feel earned.

**SOUND**
- **(a) Ambient bed — Suno prompt sketch:**
  > "Beatless enclosed-desert drone, felt-pulse ~48 bpm, the same bowed-bass harmonic as the open dune but warmer and closer with a soft room-resonance, glass-harmonica pad lower and more intimate, no wind-texture (sheltered), a faint sand-settling shimmer, Moebius-calm, cradling and still, loopable, headphone-intimate, no melody, no percussion."
  > loop: yes · target LUFS: very quiet · length: 90–120s seamless
  > *(This is the Room A bed's intimate sibling — same harmonic DNA, wind removed, reverb tightened, so the Room↔Room biome-blend is a continuous closing-in rather than a new theme.)*
- **(b) Event sounds (2–3) — ElevenLabs SFX:**
  1. **Bowl-ring peak** (the Singing Bowl `onUse`) → *"a sustained crystalline-sand 'singing-bowl' tone that rises slowly and blooms with shimmering overtones over ~2.5s, like a wet finger circling a glass rim but made of sand, warm and resonant, very long decay."*
  2. **Ripple-settle** (the bowl returning to calm) → *"a soft granular sand-trickle settling, ~1.5s, dry and gentle, descending."*
  3. **Hollow-hush** (arrival into the room from the path) → *"a brief soft pressure-drop 'whoomp' as wind cuts out, ~600ms, the sound of stepping into shelter."*
- **Calm→peak→settle arc:** Baseline = the close warm drone, near-silent. When Cosmo circles the wind-bowl (peak), the **bowl-ring (1)** blooms, the drone lifts an octave-harmonic, and the pop-magenta rim-light races the ripples; then the **ripple-settle (2)** descends and over ~4s everything returns to the cradling baseline. The longest, slowest peak-decay of the universe — this room is where you *land*.

**VIBE**
Emotional register: **safety + hush** — the held-breath of Room A finally let out. It stays *calm-enough-to-drift* by being the quietest room in the universe (no wind, no pop at baseline). It stays *alive-enough-to-hold* through the slow ripple-shimmer of the bowl, Cosmo's cradled idle, and the deeply satisfying bowl-ring that's always available. Pocket-escape test: passes hardest of all — this is the room you'd *fall asleep to* on the metro and be glad of.

**INTERACTABLES**

1. **The Singing Bowl** *(this room's delight-loop)*
   - **Object:** the scoured rippled sand-depression in the floor, a natural resonator. Painterly, no icon. Asset: `objects/wind-bowl.png` (rippled-sand decal on the floor layer).
   - **`onUse` (walkTo → clips):** Cosmo walks to the bowl's edge (`walk`), then begins to **`dance`** — a slow circling sway around the rim (the `dance` loop, NOT frantic) — and as he circles, the bowl *rings* (SFX 1), the rim-light traces the ripples; when he stops he settles into `petted`-style contentment posture, then `idle`. The loop invites re-triggering by walking back to the rim.
   - **Calm-baseline `update`:** the bowl's ripples shimmer very slowly (a faint cream highlight crawling the crests); silent.
   - **Event-peak:** the long blooming bowl-ring + pop-magenta rim-light + drone octave-lift; the slowest, most enveloping peak.
   - **What the visitor FEELS:** the meditative pleasure of *making a held tone bloom* — like running a finger around a glass, but you're just watching Cosmo do it and the whole hollow rings. Deeply calming, repeatable, skill-free.
   - **ANIMATION REQUEST (cross-builder):** *optional clip `circle-sway`* — a 2s loop of Cosmo slowly orbiting in place, leaning into the turn, suction-cup hands trailing. Brief: "Cosmo doing a slow trance-like circular sway, calm and absorbed, eyes half-lidded." Until shipped, the `dance` loop with a procedural slow-orbit translation is the fallback and reads well.

2. *(Deliberately only one interactable in Room B — declared.)* Per the dweller lens, Sims-density is met here by inhabitants + background life + the bowl + the 5–7 parallax layers; a second interactable would crowd the hush this room is *for*. The intentional restraint is the design.

**COSMO here (idle / dweller behavior specific to this room):**
In the hollow Cosmo dwells lower and slower than anywhere else: long settled `idle` near the bowl, the occasional `stretch` as if waking from a doze, a slow `look` up at the narrow sky and its first star. If left very long he drifts to the bowl-rim and does a single unbidden slow circle on his own (autonomous delight — he uses *his* world whether or not you watch), then settles again. He is at rest here.

**SUBSTRATE DATA (conformant `rooms.json` entry):**
```json
{
  "id": "the-windless-hollow",
  "area": "the-singing-flat",
  "displayName": "The Windless Hollow",
  "displayNameEn": "The Windless Hollow",
  "description": "A sheltered lee between two dunes where the wind dies and the sand sings. The wind-bowl lives here.",
  "anchor": { "x": 0, "y": -2, "z": 0 },
  "cameraBounds": { "panRangeX": 1.2, "panRangeY": 0.45 },
  "biomeKey": "dusk-hollow",
  "exits": [
    { "to": "long-dune", "via": "climb-windward", "distance": 10 }
  ]
}
```
*(Tight `cameraBounds` — intimate, cupped; the inverse of Room A's vista, mirroring forest's clearing→hollow tightening.)*
**behavior.ts hook needed:** `background(ctx)` (`biomeKey:"dusk-hollow"` or composition-spec parallax via shared `ctx.parallax`), `interactables(ctx)` (singing-bowl), `inhabitants(ctx)` (ripple-shimmer), `audio(ctx)` (close drone bed + the 3 SFX), and `transitions.roomToRoom` override for the one descend/climb path (see §3).

---

## 3. INTRA-UNIVERSE TRAVERSAL (Room A ↔ Room B)

**The path:** `descend-leeward` (A→B) / `climb-windward` (B→A). Both rooms share the Area `the-singing-flat`, so the substrate runs a **biome-blend (Room↔Room, continuous, 1.5–3.0s)** — *not* a gradient-cut.

**What it looks / sounds like:** As Cosmo crosses, the camera follows him over the crest and down into the lee. The mood **lerps continuously** from the open vista to the cupped hollow: the wide saffron-glow band *narrows* and *warms* into faded-rose pooled light; the wind-texture *fades out* (the `hollow-hush` pressure-drop SFX, Room B event 3, fires at the threshold); the drone *closes in* (open-reverb → room-resonance) since both beds share harmonic DNA, so it's one continuous tone tightening, never a cut to a new theme. Going the other way it opens back up and the wind returns. This matches forest's "override exactly one path" ratio — we override this single descend/climb path's flavor and let the substrate default-blend handle scope.

**`areas.pathExperience` colours the flavour:** `kind:"drift"`, `ambient` a faded-rose dusk tint (`#E8C4B8`), short duration — sand drifting at the crest-edge as Cosmo passes over.

**Where Cosmo is on arrival:** per the substrate rule, Cosmo's position is set at t=0.5 of the blend so he "lands" already infused with the destination mood — arriving in The Windless Hollow he is already lower in frame and calmer; arriving back on The Long Dune he's at the crest-lip facing the horizon.

---

## 4. PORTAL (Universe ↔ Universe entry / exit)

**Identity (ceremonial, within brand — nebula-portal precedent):** Entry to The Singing Dunes is a **dusk-mirage portal**. Where the forest's portal is an organic breathing-aperture and the ocean's is a submerging ripple, the Dunes' portal is a **heat-shimmer rift on the horizon**: the destination universe's frame appears to *waver into being through rising desert-heat*, the saffron-glow horizon-line bowing and parting like a mirage, then resolving into the dune-sea. 1.4s, hue pulled from `post.preset:"calm-baseline"` warmed toward saffron.

**Look:** a horizontal band of intensified heat-shimmer sweeps the frame; the outgoing world dissolves into wavering warm bands; the dune-sea coalesces from the bottom of the horizon upward. No spinning vortex (that would "shake") — a slow lateral mirage-bloom (it "breathes").

**Sound:** a single warm rising **mirage-swell** — *"a low warm air-shimmer rising in pitch and brightness over ~1.4s, ending on a soft sustained saffron tone, like heat made audible, no impact-hit."* (ElevenLabs.) On exit, the reverse: the tone descends and the shimmer recedes into the horizon.

**Arrival:** Cosmo materializes on **The Long Dune** crest (the universe `entryRoom` / `defaultArea` `entryArea`), giving the wide vista as the first impression — the "you have arrived somewhere vast" beat. `behavior.arrival` keeps the default 1.4s but tints the portal-hue saffron.

---

## 5. SUBSTRATE FILES (full proposed, schema-conformant)

### `universes/dunes/manifest.json`
```json
{
  "$schema": "https://cosmos-2026.dev/schemas/manifest-1.1.json",
  "version": "1.1",
  "name": "dunes",
  "displayName": "The Singing Dunes",
  "displayNameEn": "The Singing Dunes — a dusk sand-sea that hums when you move",
  "summaryEn": "A vast meditative sand-ocean at endless dusk, rendered in Hayao×Moebius watercolor. Saffron-glow horizon bleeding into ink-aubergine; the sand sings a low slow chord when Cosmo slides a crest or circles a wind-bowl. The pocket-escape made of emptiness and one held tone.",
  "author": "Richard Theuws",
  "license": "MIT",
  "behaviorModule": true,
  "defaultArea": "the-singing-flat",
  "brandDeviation": null,
  "assets": [
    { "type": "image", "path": "../../public/assets/backgrounds/biome-dusk-dune-4k.png", "preload": true },
    { "type": "image", "path": "../../public/assets/backgrounds/biome-dusk-hollow-4k.png", "preload": false },
    { "type": "image", "path": "../../public/assets/objects/slide-crest.png", "preload": false },
    { "type": "image", "path": "../../public/assets/objects/glass-bead-bloom.png", "preload": false },
    { "type": "image", "path": "../../public/assets/objects/wind-bowl.png", "preload": false },
    { "type": "audio", "path": "../../public/assets/audio/music/dune-drone-open.mp3", "preload": true },
    { "type": "audio", "path": "../../public/assets/audio/music/dune-drone-hollow.mp3", "preload": false }
  ],
  "post": {
    "preset": "calm-baseline",
    "intensityCurve": { "bloom": 1.1, "kaleido": 0.6, "fluid": 1.0, "chroma": 0.9 }
  }
}
```
*(Note on `intensityCurve`: `kaleido` dialed **down** to 0.6 — the dunes are about width and stillness, not kaleidoscopic trippiness; `bloom` nudged to 1.1 for the soft dusk glow. All inside the calm-baseline preset; no deep-trip.)*

### `universes/dunes/areas.json`
```json
{
  "$schema": "https://cosmos-2026.dev/schemas/areas-1.0.json",
  "version": "1.0",
  "entryArea": "the-singing-flat",
  "areas": [
    {
      "id": "the-singing-flat",
      "displayName": "The Singing Flat",
      "displayNameEn": "The Singing Flat",
      "description": "The dusk sand-sea: one endless mood seen wide then close. A high open crest and a sheltered windless hollow, threaded by a single descend/climb path. Saffron-glow above, faded-rose in the lee.",
      "moodOverrides": null,
      "pathExperience": {
        "kind": "drift",
        "duration": 2.6,
        "ambient": "#E8C4B8",
        "description": "Sand drifts off the crest-edge as Cosmo crosses; the wind narrows to a hush as the world cups around him."
      },
      "rooms": ["long-dune", "the-windless-hollow"]
    }
  ]
}
```

### `universes/dunes/rooms.json`
```json
{
  "$schema": "https://cosmos-2026.dev/schemas/rooms-1.1.json",
  "version": "1.1",
  "entryRoom": "long-dune",
  "rooms": [
    {
      "id": "long-dune",
      "area": "the-singing-flat",
      "displayName": "The Long Dune",
      "displayNameEn": "The Long Dune",
      "description": "A high windswept crest over an endless dusk sand-sea. The slide-crest lives here.",
      "anchor": { "x": 0, "y": 0, "z": 0 },
      "cameraBounds": { "panRangeX": 2.4, "panRangeY": 0.9 },
      "biomeKey": "dusk-dune",
      "exits": [
        { "to": "the-windless-hollow", "via": "descend-leeward", "distance": 10 }
      ]
    },
    {
      "id": "the-windless-hollow",
      "area": "the-singing-flat",
      "displayName": "The Windless Hollow",
      "displayNameEn": "The Windless Hollow",
      "description": "A sheltered lee between two dunes where the wind dies and the sand sings. The wind-bowl lives here.",
      "anchor": { "x": 0, "y": -2, "z": 0 },
      "cameraBounds": { "panRangeX": 1.2, "panRangeY": 0.45 },
      "biomeKey": "dusk-hollow",
      "exits": [
        { "to": "long-dune", "via": "climb-windward", "distance": 10 }
      ]
    }
  ]
}
```

### `behavior.ts` hooks (sketch, not production)
Exports the subset: `background` (configure the single shared `ctx.parallax` for `dusk-dune` / `dusk-hollow` — 5–7 layers each: far-sky-gradient, heat-shimmer-horizon, far-dune-ranks, mid-dunes, near-crest, foreground-sand-grain, [Room A: bead-bloom layer / Room B: wind-bowl layer]); `inhabitants` (slow crest-redraw morph + bead glint-cycle in A; ripple-shimmer in B — all *seen-not-used*); `interactables` (A: slide-crest + bead-bloom; B: singing-bowl); `audio` (per-room drone bed + the SFX set); `transitions.roomToRoom` (the one descend/climb hush-blend); `arrival` (saffron-tinted 1.4s portal); `transitions.universeToUniverse` (the dusk-mirage portal). **Never construct a 2nd ParallaxScene** — the v2.2.4 double-tick scar.

---

## 6. Dweller-lens self-audit (every box must pass)

- [x] **No score/win/beat** — nothing counts, times, or punishes. Two delight-loops, both skill-free.
- [x] **Answers ≥2 of fun/beautiful/strange** — beautiful (dusk gradient), strange (singing sand + the secret pop-magenta beads + dunes that redraw themselves), and fun (the slide).
- [x] **Pocket-escape** — calm baseline (near-empty, slow drone), peaks only on the slide / bowl / glint. Holds a 12-min ride; built to *exhale* into.
- [x] **Drift-in not lean-in** — Cosmo lives autonomously (crest-gazing, self-circling the bowl); the rooms reward passive watching (crest-redraw, ripple-shimmer, heat-wobble).
- [x] **Seeds building** — legible authorship: a builder clearly *chose* emptiness, one pop-accent, a horizontal slide instead of a vertical bounce. Plants "what mood would *I* make?"
- [x] **≥1 trampoline-analog per room** — Room A: the Slide-Crest; Room B: the Singing Bowl. Both small, juicy, repeatable, skill-free, reward watching.
- [x] **Sims-density** — breathing/reacting inhabitants (crest-redraw, glint-cycle, ripple-shimmer), background life (heat-shimmer, drifting grain), ≥1 interactable per room, 5–7 parallax layers each. Room B's single-interactable restraint is *declared* per §1.
- [x] **Brand/lang gate** — locked palette only (saffron-glow/ink-aubergine/faded-rose/mushroom-cream); one pop-accent (pop-magenta) ≤5%; calm baseline, weird only on peaks; ALL in-game text English; no emoji/placeholder/stock; Cosmo character-DNA preserved (the new `slide`/`circle-sway` clip briefs keep antenna-bulb, suction-cup hands, no tail).

---

*The Singing Dunes — held to NORTH-STAR. The world breathes; it does not shake.*
