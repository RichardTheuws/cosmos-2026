# Wave 24 — The Open Map (the hub that ties the dweller experience together *and* invites you to build)

> Design canvas for human review. NOT production code. Held to NORTH-STAR (§1 dweller-lens, §3 ROOM→AREA→UNIVERSE, §3b open-universes), the Dweller Lens (`00-design-bible.md §1`), the locked brand/visual/language gate, and the §3 substrate schema (mirrored from the live `universes/forest/` JSON + `src/substrate/`).
>
> The map is the connective tissue between the three Wave-24 universes (Forest, Ink-Ocean, Singing Dunes) and the literal embodiment of NORTH-STAR §3b — *"watch your Cosmo visit my Forest while my Cosmo visits your World. That sentence is the entire pitch."* It is also Richard's explicit near-term mandate made visual: **make the breadth + how-to-take-part visible.**
>
> The world breathes; it does not shake. No score, no win, no beat. All in-game text English. No emoji, no placeholder, no stock.

---

## 0. The core decision — what kind of map is this?

A traversal grammar already exists (`?substrate=v2&universe=&area=&room=`). The map is **not new routing tech** — it is a *painted dweller-artifact that drives the existing portal transition*. The brave-reconsideration check (NORTH-STAR §4): we are NOT building a menu, a level-select grid, a settings screen, or a "world map" minigame with progress stars. Any of those would reintroduce the score/lean-in shape we retired. The map must itself **pass the Dweller Lens** — it is a *room you can dwell in*, that happens to be the room from which other rooms are reached.

**Chosen form: a hand-inked celestial atlas — *The Spore-Chart*.** A slow-drifting, hand-painted star-chart where each Universe is a **luminous spore-bloom** suspended in a Hayao×Moebius watercolor void — part cosmic nebula-field, part the underside of a mushroom cap releasing spores into the dark. It reads as *something Cosmo (or his builder) drew by hand to remember the places he can go*. It is the one frame in the whole substrate that shows the **shape of the whole** — and it is calm + alive, not a UI.

Why a spore-chart and not a literal geographic map: the universes are not adjacent places on a continent — they're separate small worlds connected by ceremony, not by walking. A **constellation of spores adrift in a shared void** is honest to that (discrete blooms, generous negative space, a connective dotted spore-trail between them), it extends the forest's own DNA (spores, slow-bloom) into the connective tissue, and it leaves obvious **empty dark** for the "your world here" blooms-yet-to-open. A flat parchment map would imply a finished, bounded territory — the opposite of an *ever-growing* substrate (§3 "an ever-growing set of small worlds").

---

## 1. WHAT IT IS + the felt experience

**The Spore-Chart.** A single wide, slow vista: an ink-aubergine cosmic void washed with faded-rose and sky-wash nebula-clouds (Hayao skies in deep dusk), drifting almost imperceptibly. Suspended across it, three (today) **spore-blooms** — soft luminous discs of watercolor light, each painted in *its own universe's signature palette* so you can read what a place *is* before you ever go:

- **Forest bloom** — warm: mushroom-cream core, moss-sage halo, a single saffron-glow catch-glint. Reads *home, warm, welcoming.*
- **Ink-Ocean bloom** — cool: ink-aubergine core, sky-wash halo, one pop-cyan mote orbiting it slowly. Reads *submerged, strange, deep.*
- **Singing Dunes bloom** — dusk: saffron-glow core fading to ink-aubergine rim, a faded-rose alpenglow ring. Reads *vast, melancholy, still.*

Between the blooms, a faint **dotted spore-trail** (drawn ink-line, like a sailor's rhumb-line on an old chart) shows that travel between them is possible — not a road, a *drift-path*. Cosmo himself is here as a dweller: a small painted Cosmo billboard drifting slowly near the bloom you most recently visited (read from traversal-history), occasionally `look`ing toward the other blooms, occasionally `wave`ing at one — *he wants to go, whether or not you do.* This is the map passing "drift-in, not lean-in": you can sit on the chart and watch Cosmo consider his options and the nebula breathe, and that alone is a pocket-escape beat.

**How it reads as a dweller artifact:** it is explicitly *hand-made* — visible brush-grain, a faint paper-tooth wash under the void, ink-line annotations beside each bloom in **Cormorant Italic** (the poetic-copy face) giving the universe's `displayNameEn` and a one-line `summaryEn` fragment. It looks like a page from a traveler's notebook, not a software UI. That hand-made legibility is itself the seed-building hook (§3b): *a person drew this chart; a person made each of these worlds; the empty dark is waiting for the one I draw.*

**The four-questions (the map is a room and must answer ≥2):**
- *Beautiful* — yes: a breathing watercolor nebula with hand-inked blooms, the most "whole-of-the-project" frame, the one you'd screenshot to show someone what Cosmos *is*.
- *Strange* — quietly: the blooms pulse on offset slow sines (the world breathes); a spore occasionally detaches from one bloom and drifts the trail toward another (the literal "Cosmos travel between worlds"); Cosmo drifts and considers, uncanny-calm.
- *Exciting* — softly, on the peak only: choosing a bloom and watching the portal open is a small ceremony.

**What it is NOT (gates):** no progress meter, no "X/3 universes visited" counter, no lock icons, no stars/ratings, no "recommended next." Every bloom is reachable from the moment it exists. Stillness here is *declared-quiet by design* (Dweller Lens §1 exception) — the chart is deliberately sparse so it can be dwelt in, not a busy dashboard.

---

## 2. HOW YOU REACH IT + HOW YOU TRAVEL

### Reaching the map (the gesture from inside a room)
The map is **not a button-chrome overlay** (that would fight the chrome-stripped full-viewport `/play/` shell, NORTH-STAR §4 survivors). Instead it is reached by an **in-world affordance that is itself diegetic and calm**:

- **Primary gesture — the Antenna-Look-Up.** A small, always-present painted **way-mote** drifts high in every room (a single faint spore of light at the top of the frame — in the Forest it's the floating-star, in Ink-Ocean a rising bubble, in the Dunes the first faint star). Tapping it (or a single upward swipe / press of the `M` key on desktop) has Cosmo play **`look`** up, and the room **dissolves upward into the Spore-Chart** via the ceremonial portal (the room's bloom recedes into the chart as one of the constellation). The way-mote is the universe's existing top-of-frame inhabitant *promoted to a map-affordance* — no new chrome, fully on-brand, English microcopy on hover: *"Look up."*
- This is consistent across all universes (the affordance is substrate-level, the *art* of the mote is per-universe). It costs no HUD, demands no skill, and reads as "lifting your eyes to the sky to see where else you could go."

### Traveling to a universe (the ceremonial portal)
Selecting a bloom on the chart = the **Universe↔Universe portal** (the ceremonial scale, `00-design-bible.md §6`; 1.4s; the NebulaPortal precedent). On tap of a bloom:

1. The chosen bloom **swells and opens** — its watercolor disc irises outward into the full portal, tinted by *that universe's* `arrival` hue (Forest saffron `0.62`, Ink-Ocean cool `0.55`, Dunes saffron-warm). The other blooms and the void recede inward.
2. The portal resolves into the target universe's `entryRoom` (Forest→`clearing`, Ink-Ocean→`light-shafts`, Dunes→`long-dune`). State persists across the jump (`localStorage["cosmos.state.v1"]`) — a returning visitor resurfaces where they left (Ink-Ocean's stateful descent is the proof-case, `universe-ink-ocean.md §4`).
3. **The map drives the existing grammar.** Tapping a bloom is sugar over a URL write: it sets `?substrate=v2&universe=<u>&area=<defaultArea>&room=<entryRoom>` and lets `SubstrateLoader.boot()` resolve it (left-to-right fallback + `history.replaceState` self-heal already implemented in `ResolveURL.ts`). The map does NOT invent a parallel router — it is a painted front-end onto the canonical traversal grammar. A share-link to a bloom is just a share-link to that universe's entry triple; the map and a deep-link are the same thing seen two ways.

**Scope auto-selection holds:** the map↔room transition is *Universe-scale* → portal (ceremonial). Returning from a universe back to the chart is the same portal in reverse (the room recedes up into its bloom). Room↔Room and Area↔Area inside a universe never touch the map — those stay biome-blend / gradient-cut as their docs specify. The map is *only* the Universe-scale waypoint.

---

## 3. THE INVITATION TO BUILD (the becoming-places)

This is the heart of the mandate. Around the three lit blooms, the void holds **un-opened blooms** — faint, dotted ink-circles, drawn but not yet filled with color, each a place a world *could* bloom. They are not greyed-out "locked levels"; they are **invitations rendered as potential.** Visiting seeds building (§3b): you wander a builder's Forest or Ink-Ocean, you feel a person *chose* this, and then on the chart you see the empty bloom and the question lands on its own — *what would I make in mine?*

### Visual treatment
- A **dotted ink-circle** (the same hand-drawn pen-line as the spore-trail), faintly pulsing on a slow sine like the lit blooms but **uncolored** — a watercolor wash withheld. Inside it, in Cormorant Italic, the single line: ***"your world here."*** (lowercase, intimate, hand-written-feeling — not a shouting CTA).
- Around it, the faintest ghost of a spore-trail reaching from the existing blooms toward it — *the path is already drawn to your door; the world just isn't painted yet.*
- 2–3 such becoming-blooms visible at once (not dozens — the void stays calm/sparse; new ones fade in as the constellation could grow). They occupy the negative space, never crowding the lit worlds.

### What happens on tap (NON-gatekeepy, English, points to the real quickstart)
Tapping a becoming-bloom does **not** open an editor (we are not a platform with an in-game builder — NORTH-STAR §3b "not a framework with a marketing site"). It opens a quiet, painted **invitation card** that drifts up from the bloom — a single watercolor panel, Cormorant Italic for the poetic line, Inter for the practical line:

> *This place is waiting to be drawn.*
>
> Cosmos is an open world built by people who pair with Claude. Bring your own Universe — your room, your sound, your vibe — and your Cosmo can visit mine while mine visits yours.
>
> **Start here:** open Claude Code in any folder and paste the three-line prompt. It reads the charter, meets you where you are, and — if the time's right — builds a Universe with you.
>
> [ Copy the prompt ]   ·   [ Read how it works → ]

- **[ Copy the prompt ]** copies the README quickstart block verbatim (the "pair with Claude in three lines" prompt — Clone → read NORTH-STAR/UNIVERSE-AUTHORING/CONTRIBUTING → honest fitness-check → "shall we build a Universe together?"). One tap, prompt on clipboard, ready to paste into Claude Code. This is the lowest-friction possible on-ramp and it is *exactly* §3b's posture — the fitness-check is built into the prompt, so the invite itself is never gatekeepy; Claude meets the visitor where they are.
- **[ Read how it works → ]** opens the repo / `CONTRIBUTING.md` (GitHub-public from day one). For the curious-but-not-ready, this is the honest-paths table ("fix a bug, improve a script, study `universes/forest/` as a reference") — so the invite *also* serves the visitor who isn't ready to author a whole universe yet, without making them feel turned away.
- **Tone gate (locked English, brand voice):** warm, oblique, never a marketing pitch, never "SIGN UP" / "CREATE ACCOUNT" / "JOIN NOW" (there are no accounts — §3b "not a platform"). The copy is a *door left open*, not a funnel. It carries the stoner-game calm: an invitation you could take or just admire.

### Tie to "visiting seeds building"
The becoming-blooms sit *in the same frame* as the worlds you just visited — so the invitation is never an abstract "make a game" ask; it's *"you've just felt what someone made; here's the empty space beside it, and the path is already drawn to it."* The map is where the experience-loop and the participation-loop (§3b: "the experience and the participation are one thing") become literally the same picture.

---

## 4. SOUND OF THE MAP

Per `00-design-bible.md §5`: one ambient bed + 2–3 event sounds, calm baseline, peaks on events. The map's bed must read as *the connective void between worlds* — not belonging to any one universe, a quiet between-place.

**(a) Ambient bed — Suno prompt sketch:**
> "Beatless cosmic-void drone, ~44 bpm felt-pulse (no percussion), a slow swelling pad of bowed glass-harmonica + distant breathy choir-hush + a single deep sub-bloom every ~12s, weightless and suspended, faint shimmer of high air like dust catching starlight, Moebius-calm watercolor, vast but intimate, loopable seamless, headphone-intimate, no melody-hook — the sound of drifting between worlds at dusk."
> loop: yes · target LUFS: quiet (sits under SFX) · 90–120s seamless · ships to `public/assets/audio/music/spore-chart-void.mp3`.
> *Distinct from all three universe beds:* it borrows a thread of each (the choir-hush nods to the Dunes' open reverb, the sub-bloom to Ink-Ocean's pressure, the glass-harmonica to the Forest's warmth) so the chart feels like *the place all three are reachable from* — a between-room, not a fourth world.

**(b) Event sounds (ElevenLabs SFX):**
1. **Bloom-focus / hover** → "a soft warm watercolor 'bloom-swell' — a single low chord opening like a flower, ~600ms, with a faint shimmer-tail tinted toward the focused bloom's mood (warmer for Forest, cooler for Ink-Ocean), no click, all breath." (Fires when a bloom is focused/hovered — the chart acknowledging your attention.)
2. **Portal-open (travel peak)** → "a rising ceremonial chord-bloom with a soft chime-cluster, ~1.4s, gentle and momentous, no impact-hit — a held breath opening a door." (Tied to selecting a bloom → the Universe-portal. On the *target side* the universe's own arrival SFX takes over — Forest saffron-shimmer swell, Ink-Ocean submersion-suck, Dunes mirage-swell — so each world keeps its signature threshold.)
3. **Becoming-bloom touch (the invitation)** → "a single faint, hopeful ascending two-note shimmer with a long open tail, ~900ms, like a question gently asked — warm, never a notification-blip, never arcade." (Fires when a becoming-bloom is tapped and the invitation card drifts up. Deliberately the *softest, most open* sound on the chart — the invite should feel like a held breath, not an alert.)

**Calm→peak→settle:** baseline = the void drone + the occasional bloom-pulse (silent or a near-subliminal swell). Peak = focusing a bloom (small swell) or opening a portal (the 1.4s ceremony). Settle = the drone reabsorbs within ~2s. Cosmo's idle drift on the chart produces no sound; he's quietly present. **Nothing peaks unprompted** except the slow bloom-pulses, which are felt more than heard.

---

## 5. SUBSTRATE / IMPLEMENTATION SHAPE (it DISCOVERS, never hardcodes)

The map's single most important property: it must **enumerate universes by discovery**, so a builder who drops a conformant `universes/<their-slug>/` folder *appears on the chart automatically* — no map-code edit, no registry PR, no gatekeeper. This is the §3b promise made structural.

### Discovery seam (already scaffolded)
`SubstrateLoader.discoverUniverses()` today returns a hardcoded `new Set([DEFAULT_UNIVERSE])`, and its own comment names the upgrade: *"Wave 22+ will use `import.meta.glob` for hot-reload + dynamic discovery."* The map is the feature that **cashes in that seam.** Proposed shape (sketch, NOT production code):

```ts
// src/substrate/discoverUniverses.ts — the map's data source.
// Vite statically resolves the glob at build; every universes/*/manifest.json
// that exists at build-time is enumerated. A builder adds a folder → appears
// on the chart with zero map-code changes. (Same glob pattern already used for
// behavior.ts in SubstrateLoader.loadBehaviorFor.)
const manifests = import.meta.glob('/universes/*/manifest.json', { eager: true });
// → for each: read { name, displayName, displayNameEn, summaryEn, post.preset,
//   post.intensityCurve, defaultArea } + the universe's entryRoom (from rooms.json)
//   + a palette-hint for the bloom color.
```

The chart renders **one spore-bloom per discovered manifest**, palette-keyed by the universe's mood. `discoverUniverses()` is refactored to return this same enumerated set (replacing the hardcoded `Set`), so the resolver and the map share one source of truth — a universe is reachable iff it's on the chart iff its folder exists. (Runtime/CDN note: in the static `/play/` deploy, `import.meta.glob` bakes the list at build-time, which is correct for v1's "Universes are static deployables" model, §3b. A future hot-discovery of *externally-hosted* universes is a known long-horizon extension and is *not blocked* by this shape — the chart reads a list; where the list comes from can grow.)

### The minimal contract for a builder to appear on the map
A builder appears on the chart by satisfying the **existing Universe contract — nothing map-specific is added.** The map reads only fields that already exist:

| Map needs | Reads from (existing field) |
|---|---|
| Bloom label | `manifest.displayNameEn` |
| Bloom annotation (one-line) | `manifest.summaryEn` (first sentence) |
| Bloom palette/mood | `manifest.post.preset` + `post.intensityCurve` (+ optional area `moodOverrides.primary` for the core hue) |
| Where the portal lands | `manifest.defaultArea` + `rooms.entryRoom` (→ builds the `?universe=&area=&room=` triple) |
| Portal hue | `behavior.arrival().hue` if present, else preset default |
| Brand-conformance flag | `manifest.brandDeviation` (null = composes cleanly; non-null = the bloom carries a small ink-margin note "a deviation, documented" — honest, not hidden, per §3b "deviations are documented, not policed") |

So the **builder's onboarding cost for map-presence is zero beyond authoring a conformant universe** — exactly the §3b posture. No `map.json`, no opt-in flag, no separate registration. *Author a Universe → you are on the chart.* That zero-cost is itself the most powerful "seeds building" signal: the proof that participation is real and frictionless.

### Map as a substrate "place" (optional, recommended)
The chart can be modeled as a tiny reserved pseudo-universe `universes/_chart/` (or a substrate-level view, not a player-authorable world) so it reuses the portal-transition + bed-audio plumbing rather than being bespoke chrome. It is **excluded from its own enumeration** (it is the lens, not a world). This keeps "the map is itself a calm room you can dwell in" (§1) literally true in the architecture: it has a bed, inhabitants (the drifting Cosmo + the spores), and one interactable-class (the blooms), exactly like any room — it just happens to be the room you reach the others from.

---

## 6. HOW THE MAP MAKES "THE BREADTH + HOW TO TAKE PART" VISIBLE (Richard's near-term mandate)

NORTH-STAR §6 (2026-05-31 dweller entry): *"make the breadth visible — what the world already is + how to take part."* The Spore-Chart is the single artifact that does both, in one calm frame:

- **Breadth, felt not listed.** Three universes, each a bloom painted in *its own palette*, sitting in one void — a visitor sees at a glance that Cosmos is warm-Forest **and** deep-Ink-Ocean **and** vast-Dunes, that these are *distinct authored places*, and that more can bloom. It's the project's elevator pitch rendered as a watercolor you can dwell in, not a feature list. (And because the blooms are discovered, the breadth on the chart is *always current* — it can never lie about what exists.)
- **How to take part, beside what already exists.** The becoming-blooms put the build-invitation *in the same frame as the breadth* — you don't navigate to a separate "Contribute" page; the empty place is right there next to the full ones, the path already drawn to it, the three-line prompt one tap away. The experience and the participation are literally the same picture (§3b).
- **The pitch sentence, made visual.** §3b: *"watch your Cosmo visit my Forest while my Cosmo visits your World — that sentence is the entire pitch."* The chart is that sentence as an image: your Cosmo drifts among blooms others made, and the empty bloom is where yours will be for others' Cosmos to visit. Standing on the chart, the visitor *is* inside the pitch.

---

## 7. DWELLER-LENS SELF-CHECK (pass/fail, per `00-design-bible.md §1`)

- [x] **No score / no win / no beat** — the chart counts nothing, completes nothing, times nothing; no "visited X/N," no progress, no locks. Every existing bloom is reachable always.
- [x] **Answers ≥2 of fun/exciting/beautiful/strange** — *beautiful* (breathing hand-inked nebula of palette-keyed blooms), *strange* (offset bloom-pulses, spores drifting the trail, uncanny-calm Cosmo considering his options), *exciting* (the soft ceremony of opening a bloom-portal). Three of four.
- [x] **Pocket-escape** — beatless void drone, sparse calm baseline, peaks only on focus/travel/invite; holds a 12-min metro ride as a place to drift and watch Cosmo consider the sky.
- [x] **Drift-in, not lean-in** — Cosmo lives on the chart (drifts, `look`s, `wave`s at blooms) whether watched or not; the nebula breathes; sitting and watching is a complete experience.
- [x] **Seeds building** — the becoming-blooms + "your world here" + zero-friction discovery (author a folder → appear on the chart) make the participation-loop and the experience-loop the same frame. This is the *most* seed-building surface in the project.
- [x] **≥1 delight-loop (trampoline-analog)** — focusing a bloom → the warm bloom-swell + shimmer, small/juicy/repeatable/skill-free, rewards just brushing across the chart; and watching a spore detach and drift the trail is a passive repeatable delight.
- [x] **Sims-density / declared-stillness** — drifting Cosmo + pulsing blooms + detaching spores + breathing nebula + the becoming-blooms = alive; the deliberate sparseness of the void is *declared-quiet by design* (§1 exception) so the chart can be dwelt in rather than read as a busy dashboard.
- [x] **Brand / language gate** — Hayao×Moebius watercolor void, locked palette only (ink-aubergine void + faded-rose/sky-wash nebula + each bloom in its own locked palette), pop-accents ≤5% (only Ink-Ocean's orbiting cyan mote + any per-bloom signature accent, peak-only), calm baseline + weird-on-peak, Cosmo character-DNA on the drifting billboard, **all in-game text English** (Cormorant Italic poetic copy + Inter UI), no emoji/placeholder/stock. The map adds **no `brandDeviation`** — it composes inside the locked brand.

---

*Held to NORTH-STAR. The chart breathes; it does not shake. Author a Universe → you are on the chart. The experience and the participation are one picture.*
