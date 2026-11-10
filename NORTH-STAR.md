# North Star — Zorp's Universe

**Status**: living document
**Ratified**: 2026-05-03 (Wave 19 → Wave 20 strategic pivot)
**Read order**: this file FIRST in every new session, ALWAYS, before any other planning doc.

---

## 1. Vision

> **A psychedelic companion in an ever-growing world that keeps expanding in any way imaginable.**

Zorp is a being. Not a character in a game.
The world begins in a forest.
Where the world goes from there is uncertain — *anything is possible*.

What we are building is **not a level-based platformer**, **not a runner**, **not a rhythm game**, **not a parody, remake, or homage**. Those were earlier attempts to give it a shape. They served their purpose and were discarded the moment they no longer matched what the work wanted to become.

What we *are* building:

- **A companion** that has its own life on screen, regardless of whether anyone is watching.
- **A world** that surrounds Zorp and breathes with him.
- **An expansion vector** — every release adds a new biome, a new set of activities, a new way Zorp can be encountered. The world grows without ever resetting.
- **A trip** in the original sense — slow, weird, hypnotic, occasionally funny, always alive.
- **A dweller's experience** (sharpened 2026-05-31) — you don't score and you don't win; you *visit*. Zorp dwells, and so do you: you drift through the rooms and universes other builders have made and feel what each one *is* — its sound, its vibe, its interactions. Is it fun here? Exciting? Beautiful? Strange? You gather **experiences**, not points.
- **A pocket-escape** — something to disappear into with your AirPods in: the waiting room, the metro ride. Calm enough to drift, alive enough to hold you.
- **An invitation to build** — wandering someone else's world quietly plants the question *what would I make in mine?* Visiting and building are the same loop seen from two sides (§3b). The experience and the participation are one thing.

The near-term work is to make this **visible**: the breadth of what the world already is, and how a person can take part. We design **the first chapters of this experience together**, hand-authored and felt, until it is good enough to scale.

## 2. Origin

Zorp is loosely based on a real personal memory — a being someone glimpsed on a night they don't have to specify. He has no plot, no quest, no enemies. He's just *here*, painted thirty years later in watercolor, on a planet that exists only while you're looking at it.

This origin is intentionally abstract. We do not name it directly in marketing. The work points at it; readers who recognize the wavelength will understand. Others can simply enjoy a small green being who lives on their screen.

## 3. The growing world

### Spatial model: ROOM → AREA → UNIVERSE

The world is structured in three nested scales. This is the canonical model; everything we build slots into it.

- **ROOM** — the focused scene Zorp inhabits right now. One screen, fully alive. Zorp can be at full presence here, walking, jumping on a trampoline, exploring small interactables. Sims-like density: a single room is *packed* with little side-quests, side-activities, things to discover. The current view of the mushroom forest *is* a Room, but with full movement instead of a fixed framing.
- **AREA** — a cluster of Rooms connected by a psychedelic path. The path itself is its own experience (not a loading screen). Walking the path is a thing you do, with its own feel, lighting, sounds. An Area has a coherent mood; its Rooms vary that mood.
- **UNIVERSE** — a top-level container holding multiple Areas. Each Universe has its own identity, palette, rules. The mushroom-forest Universe is the first.

### Future scale: open universes
Long-horizon: **other (Claude) devs are invited to hook in and add their own Universes.** This is a deliberate architectural commitment that shapes how we build now — internal data models, world-loading, transitions, and the Zorp rig itself stay generic enough to host third-party Universes without invasive changes. We're not building a game; we're building a substrate for an ever-growing set of small worlds with one companion who can travel between them.

### The forest (current)
- Watercolor cosmic-mushroom forest, soft pastel cosmic horizon — the entry Room of the entry Area of the entry Universe.
- This is **the entry point**, not the destination.

### What "expansion" means
Expansion happens at every scale:
- **Inside a Room**: more side-quests, more interactables, more small lives. Density.
- **Inside an Area**: more Rooms + the psychedelic paths between them.
- **Inside the Universe**: more Areas + how Zorp moves between them (traveling itself is content).
- **Beyond**: Universes from other authors, plugged into the same Zorp + companion-AI scaffolding.

The forest will not be replaced. Zorp will simply learn to walk farther.

### Primary interaction loop (locked)
**The trampoline.** A regular trampoline, in the room. Zorp can walk to it and jump on it. He loves it. The user loves watching him love it. They keep coming back. This is the canonical "delight loop" — every Room should have at least one of these (not always literally a trampoline, but its analog: a small, juicy, repeatable joy).

### What's possible (seeds, not roadmap)
- Canopy / sky-Room above the forest
- An Area of an ink-ocean
- A village Universe with multiple small beings
- A dream-Area Zorp enters when he sleeps
- Seasons / moods that wash over existing Rooms
- A second companion who joins him in a specific Room
- Universes contributed by other authors

We hold none of these as roadmap. They are seeds. The future will tell us which ones grow.

### Visual language (locked, do not re-ask)
The current vibe and color palette are exactly right and **not subject to re-asking**:
- Hayao×Moebius watercolor base
- Mushroom-cream / moss-sage / sky-wash / faded-rose / ink-aubergine / saffron-glow / forest-deep
- Pop-accents (max 5%): pop-magenta / pop-lime / pop-cyan
- Calm baseline + weirdness on event-pieken

Do not propose pivots to "bolder pop", "graphic novel", "anime", or any style shift. The brand answers the brief. Future questions about visuals must be **implementation-concrete** (which crop, which dimension, which decal-region) — not "which mood".

### Language (locked, do not re-ask)
**All in-game text and interaction is English.** Every UI label, hint, onboarding line, system message, button, tooltip, and any word the player reads inside `/play/` is English — **even though Richard and Claude converse in Dutch while building.** Dutch is permitted *only* for external marketing/site copy and internal working docs; it must never reach anything the player sees in-game. Rationale: the game is built openly for a global builder + player audience (§3b) — a Dutch string in-game is a bug, not a choice. (This is the same discipline as code/comments being English.)

## 3b. The collaboration substrate (open-universes)

This project is **deliberately authored as a substrate** for other developers to plug into. The repo is GitHub-public from day one and structured for external contribution.

### Who we're building this with
**Claude game devs** — developers who, like Richard, build alongside Claude as their pair-development companion. This population is real and growing. The project is an open invitation: bring your own Universe, plug it in, watch your Zorp visit my Forest while my Zorp visits your World. *That sentence is the entire pitch.*

This is not floaty. It is a concrete technical proposition:
- **Zorp is portable.** His rig (`CosmoV2Builder`) and state (mood, inventory, traversal-history) live in a shared module. Any Universe can host him.
- **Universes are pluggable.** Each Universe is a self-contained module that satisfies a documented contract (background, room-list, traversal-rules, asset-pack). Universes can be authored, deployed, and shared independently.
- **Travel between Universes is a first-class mechanic.** Not "load a different game" — Zorp walks (or drifts, or dreams) from one Universe into another, his state preserved.

### What "P2P" means here (initially)
The first version of cross-Universe travel is **asynchronous + content-portable**: Universes are static deployables, Zorp carries his state (localStorage or signed token) when he travels between them. No realtime peer-to-peer required for v1.

True realtime P2P (your Zorp and my Zorp in the same Room at the same time) is on the long horizon as a possibility, not a near-term commitment. We design the substrate so it's *not blocked* by adding it later (state model is serializable; rooms can support multiple Zorp instances).

### What contributors get + give

**Get**:
- The CosmoV2 rig + companion-AI + life-system as a dependency they don't have to build
- A documented Universe contract with examples
- A canonical brand-lock so their work composes visually with the rest
- The `brave-reconsideration` working method as a shared posture

**Give**:
- A Universe that satisfies the contract
- Adherence to the brand contract (or a documented intentional deviation, with rationale)
- The same posture: pivots are announced, sunk cost is not an argument, vision is editable

### What we are NOT
- Not a platform with TOS and content moderation. The repo enforces brand contract via PR review; Universes that don't compose are forked, not policed.
- Not a marketplace. Universes are not monetized through us.
- Not a "framework" with a marketing site. It's an open repository with clear documents.

### Radical integration transparency
Every paid service this project uses is documented in [`INTEGRATIONS.md`](./INTEGRATIONS.md): what it does, what it costs, where the API key lives, and what alternatives exist. The asset-generation pipelines in `scripts/` are **first-class shared infrastructure**, not internal tooling. Forks are explicitly invited to improve and replace integrations, and to upstream those improvements so every contributor benefits. The forks aren't competing — they're each carving out their own corner of the imagination on shared infrastructure that gets better when any one of them improves it.

### Collective agent evolution
The Claude-paired workflow that builds this project also produces tooling: **agents, skills, brainstorm patterns, asset-gen scripts**. These live in `.claude/agents/`, `.claude/skills/`, `.claude/brainstorm/`, and `scripts/`. They are **shared development infrastructure** on the same footing as the runtime code: improvements upstream via PR, every contributor's Claude pair-programming workflow gets sharper with every merge.

The arrangement starts mono-repo (everything in this single repository) for the same reason the Universes start mono-repo: simplicity wins until it doesn't. If agents/skills mature into something genuinely portable across non-Cosmos projects, we'll extract them into a sibling repo (`cosmos-2026-agents` or similar) at that moment — the brave-reconsideration principle (§4) governs the split. Until then, the easiest path is: fork, improve `.claude/`, upstream what's general.

See [`AGENTS.md`](./AGENTS.md) for the contribution pattern.

## 4. The principle of brave reconsideration

This is the operating principle of this project:

> **We dare to reconsider any decision the moment the future asks for something else.**

This is not flakiness or thrash. It is the discipline that:
- Already turned a level-based platformer (v0.x) into a rhythm-trip (v1.0), into a motion-companion world (v1.3), into a calm + alive forest (v1.4 → 1.5), and is now turning that into a true expanding world (v2.0+).
- Already killed a spoof framing the moment it stopped fitting (v1.5.0 lore migration).
- Already abandoned three patches to a broken rig (v1.5.0/1/2) and committed to a hybrid rebuild the moment patching stopped converging.

### Rules for reconsideration

1. **Sunk cost is never an argument to keep something.** Hours invested in code, assets, or framing do not buy that thing a future. Only fitness for the current vision does.
2. **A pivot is announced, not snuck in.** When we decide a reconsideration is needed, it gets a one-paragraph entry in this file's Pivot Ledger (§6) so future readers can trace why.
3. **Pivots happen at the smallest scope that solves the problem.** A failing mechanic gets a redesign. A failing redesign gets a paradigm-shift. We do not blow up everything when only one layer is broken.
4. **The pivot before the work, not the work before the pivot.** If we sense we're about to pour effort into a frame that no longer fits, we stop and re-examine *first*. Never finish a feature just because it was started.
5. **What survives a pivot is documented.** When we leave something behind, we note what about it stays — the LoRA-locked DNA survived multiple pivots; the calm-baseline post-FX survives still; the brand voice ("Een aquarel-trip die zichzelf voortzet als jij stilzit") survived three rig attempts.

## 5. Working method (holistic mode)

Each session opens with this question, in order:

1. **Does the vision (§1) still hold?** If anything Richard or Claude has said since the last session would alter §1, edit §1 first.
2. **What is the smallest piece of the world we can grow next?** Not the most spectacular — the smallest that compounds.
3. **What survives, what pivots, what gets discarded?** Apply the brave-reconsideration rules (§4) to anything in flight.
4. **Then plan the wave.** Brainstorm docs in `.claude/brainstorm/waveN/` before code, parallel agents where independent, single-thread where the work braids.
5. **Always honor the brand**: trippy-cosmic-watercolor + character-DNA + calm baseline + weirdness on event-pieken. Never cheap stoner clichés. Never emojis. Never placeholders. Never level-list framing.

### Investment posture
We are no longer in proof-of-concept mode. This is **a prestige project**. That changes:
- Quality > cost on assets (already locked in `budget_policy`).
- Quality > speed on every shipped piece of the world. We'd rather ship one biome that's fully alive than three half-alive ones.
- Cooperation between Richard and Claude is now **co-authorship**, not "user requests, Claude executes". Strategic direction is set together; execution is mine to drive autonomously inside that direction.

## 6. Pivot Ledger

Every accepted pivot gets a one-paragraph entry. Newest first.

### 2026-11-10 — Rebrand: Cosmo becomes Zorp
The character is renamed **Zorp**, the project **Zorp's Universe**. Reason: trademark and copyright — the name and the design have to be fully our own. Same standard as the Burgfall rebrand: no borrowed names, no borrowed character traits, nothing in public that points elsewhere. The design changes with the name: **no more suction-cup hands**. Zorp has soft, fingerless mitten hands with palms that glow a soft saffron. That means the `rtcosmo` LoRA (trained on the old look) can no longer anchor new art; a **new LoRA has to be trained** before new Zorp images are generated. Internal names (`CosmoAgent`, `cosmo.glb`), localStorage keys and the `/games/cosmos-2026/` URL stay, so saves and links keep working. Older ledger entries below keep the name Cosmo: they are history, and Richard's quotes stay word for word.

### 2026-05-31 — Vision crystallized: Cosmo is a "dweller" — a pocket-escape you visit, that seeds the urge to build
Same evening as the beat-retirement and painted-frames ship, the vision sharpened into one word: **dweller**. Richard: *"Cosmo moet een 'dweller' zijn — een game waarin je ervaringen opdoet, rooms en universes bezoekt en daar ziet wat de bouwer voor je bedacht heeft: welke sound, welke vibe, welke interactie. Is het hier leuk? Spannend? Mooi? Een game waar je met je AirPods in even in kunt verdwijnen, die je metrorit leuk maakt, terwijl je zelf nadenkt over wat jij in jouw wereld gaat maken."* This is not a new direction so much as the **felt purpose** behind everything we already chose — it makes §1 concrete. The player is a **visitor who gathers experiences, not points**: they drift through builder-authored rooms/universes and sense what each one *is* (sound, vibe, interaction, mood). The target feel is a **pocket-escape** — AirPods-in, waiting-room / metro, calm enough to drift but alive enough to hold you. And visiting **seeds building**: wandering someone's world plants *what would I make in mine?* — the experience and the open-substrate participation (§3b) are one loop. §1 updated to carry this. The near-term mandate that follows: **make the breadth visible** (what the world already is + how to take part — this drives the public-site/docs refresh Richard asked for), and **co-design the first "chapters" of the experience together**, hand-authored and felt, before scaling. This reframes the world-expansion work (the prior entry's point d) as *authoring chapters of an experience*, not just adding biomes.

### 2026-05-31 — The beat-mechanic is retired; the model is free movement + builder-authored interaction + world expansion
Live phone UAT of v2.4.0 (painted-frames Cosmo): *"op telefoon is dit echt te gek — Cosmo is gaaf, de wereld is gaaf, de trampoline is gaaf."* The painted-frames pivot is validated. Two things surfaced, and they turned out to be one. **(1)** The on-screen "timer-circle" (the `VibeMeter` saffron/rose ring drawn around Cosmo) reads as distracting clutter. **(2)** The music interaction is "niet heel duidelijk of merkbaar — misschien ook niet nodig." Both are the same dying system: the gamified *do-something-on-the-beat / combo-score* loop (vibe meter → DeepTripMode-on-peak), the last vestige of the rhythm-trip era (already half-retired at Sprint 17). Per §4, we stop defending it. **Decision (Richard, 2026-05-31): retire the beat/score interaction model entirely.** What replaces it: **(a) Cosmo moves freely in every world** — no scoring, no beat-timing; the delight is presence + motion + exploration. **(b) Each world-builder authors their own interactable items** for their world (the trampoline becomes example #1 of a general builder-authored interaction surface, not a hardcoded special case). **(c) A cross-builder animation-request flow** — a builder can request that a movement/animation be added to "their own Cosmo" (i.e., a new painted-frame clip contributed into the shared clip set), so interaction richness grows collaboratively. This sharpens §3b (the open substrate) from "plug in a Universe" to "plug in a Universe *with its own interactables*, and grow Cosmo's vocabulary together." **(d) Focus shifts to world expansion as planned (§3 ROOM→AREA→UNIVERSE)** — the next real work is building beyond the one clearing to actually demonstrate and *feel* how transitions + traversal between rooms/areas/universes work, and what a builder can make possible in a world. What survives untouched: painted-frames Cosmo (12-clip set), the brand contract, the substrate + Universe contract, and the **calm-baseline ambient audio cosmetics** (the subtle FFT bloom/breath is calm-baseline texture, §3 — it is *not* the gamified beat-action and stays). What goes: the `VibeMeter` ring + score/combo logic + DeepTripMode-on-vibe-peak + any "tap on the beat" affordance. Immediate step shipped: the vibe ring is hidden (v2.4.1); the full score-logic teardown + the free-movement / builder-interactable / world-expansion program are the next waves, sequenced with Richard.

### 2026-05-31 — Cosmo's locomotion: the billboard is a presence, not a mover — spike two real-motion rebuilds
Richard's UAT after shipping v2.2.11 (the walk-anim foundation): *"ik heb er echt geen gevoel bij dat we progressie maken richting wat ik wil."* The honest diagnosis: we were three procedural patches deep on a single flat billboard plane — clobber-fix → step-bob → (next) trampoline spins — and a flat plane that sways, bobs and rotates is still a *sticker that wobbles*, not a being that walks and goes wild on a trampoline. The Wave-21.2 billboard pivot was right for *presence* (a 10/10 painted Cosmo that always reads correct), but it is a ceiling for *locomotion + tricks* — exactly the things Richard has asked for repeatedly (§3's locked delight-loop: "a regular trampoline Cosmo walks to and joyfully jumps on"). Per §4 rule 4 we stop before the fourth patch and reconsider the system. **Scope (rule 3): this pivot is the smallest that solves it — it reconsiders only Cosmo's *motion representation*, not his presence, not the substrate, not the brand.** What survives untouched: the LoRA-locked character-DNA hero painting (the `rtcosmo` asset is the anchor for whichever path wins), the brand contract (Hayao×Moebius watercolor, calm baseline), the substrate + Universe contract, and the billboard *as a fallback / static-presence mode*. Decision made with Richard (2026-05-31): we do **not** pick the new representation by my estimation — we **spike both and compare live**. (A) *Painted frames*: generate real walk/idle/trick motion from the LoRA hero via fal.ai image-to-video, extract a frame atlas, play it on the camera-facing plane — every frame stays a full watercolor painting (max brand fidelity, zero rig-stiffness), at the cost of generation+curation+per-frame alpha work. (B) *2.5D cut-out puppet*: slice the hero into rigged parts (head / torso / limbs+discs / antenna) and animate joints procedurally — fully code-controlled and gen-free, at the risk of needing clean seam-inpainted parts (the failure mode that killed the 21.2 decal paradigm) and of reading stiff/paper-doll. Both spikes are scratch artifacts in `spike/`, anchored on the existing hero PNG, judged side-by-side on *feel*; the loser is discarded, the winner becomes the Cosmo-locomotion wave. The v2.2.11 post-lookAt anim-layer is a genuine bugfix regardless (dead walk-sway revived) and stays until the chosen path retires or absorbs it. **RESOLVED 2026-05-31 (Richard, live UAT of the spike): painted frames win — *"Painted Frames zijn geweldig, die wil ik."*** The fal.ai image-to-video gen from the LoRA hero produced motion the procedural puppet can't touch — weight-shift, leg-lift, head-tilt, a spontaneous smile, with the character-DNA consistent across every frame. The puppet (and its seam/stiffness problems) is discarded. Cosmo's motion representation becomes **painted-frame clips generated per animation-state from the LoRA hero, alpha-cut per frame, played on the camera-facing billboard**; the v2.2.11 rollZ/pitchX layer survives and is repurposed to add procedural trick-spins on top of a bounce clip (frames + procedural compose). The billboard stays as the carrier (and as static fallback); only its texture goes from one still to an animated frame-sequence. The asset-gen reality is accepted under the locked quality>cost posture: each state is a gen + curation + per-frame BiRefNet pass. This becomes the next wave (painted-frames Cosmo); see its plan doc + the promoted gen pipeline (`scripts/`).

### 2026-05-30 — Wave 22: the deferred substrate cutover executes (hard), and a second Universe proves the pitch
A 7-team strategic audit (overall vision-fit 5.5/10) surfaced the single largest execution-vs-vision divergence: the entire ROOM→AREA→UNIVERSE spatial model (§3) and the open-substrate pitch (§3b) are **fully coded but dead in production** — `/play/` never sets `?substrate=v2` (verified at `src/main.ts:51-53`), so live visitors get the legacy auto-cycling biome path with no rooms, no traversal, no pluggable universes. The Wave-21 "hard cutover at wave-close" was silently never executed; six consecutive patches (21.1→21.2.4) went into Cosmo's pixels and `/play/` chrome instead. Per §4, deferring it again would be sunk-cost defense of the legacy path. Decisions made with Richard (2026-05-30): **(1) Hard cutover.** Wave 22 makes the substrate the production path by *deleting* the legacy biome-cycle, not flag-gating it. The working pieces the legacy path still owns (trampoline tap→walk→bounce loop, CosmoScene HUD wiring, calm post-FX, parallax) are **migrated into the substrate's clearing Room first; legacy is removed only after parity** — there is no `?legacy` escape hatch, so the visual-UAT gate is the only safety net and migration-before-deletion is non-negotiable. **(2) A second Universe ships in the same wave — Ink-Ocean** (chosen 2026-05-30 from three scored candidates; a Moebius-ink underwater Universe inside the locked palette — ink-aubergine / sky-wash / saffron-glow + one pop-cyan). We do *not* wait for "spine-first, content-later": a second Universe is the only real proof the contract is generic (not forest-hardcoded), it is the literal demonstration of "your Cosmo visits my world" (§3b), it forces D4 (the substrate must own its own background — un-no-op the v2.2.4 ForestBackground stub), and it exercises the portal-transition + StatePersistence for real. **(3) A real test + visual-UAT gate stands up in parallel** (Vitest for the substrate resolvers ResolveURL/ResolveMood/manifest-validation; a committed Playwright screenshot-UAT as a required pre-deploy human-review artifact). The 21.2.x cascade proved programmatic UAT can't see pixels; a hard cutover with no escape hatch makes the gate load-bearing. What survives untouched and must NOT be reopened: the brand contract (watercolor + character-DNA), the billboard-Cosmo pivot (Wave 21.2), the 4 transform-based anims, the chrome-stripped full-viewport `/play/` shell, and the substrate architecture itself — it is well-factored and contract-clean; the problem was that it was unreachable, not that it was wrong. We turn it on; we do not rebuild it.

### 2026-05-05 — Wave 21.2: skeleton-rig retired, Cosmo becomes a hero-PNG billboard
Live UAT of v2.2.1 (Wave 21.1 real-LoRA-regen ship) showed the third consecutive Cosmo-skin failure: the regenerated decals were rendered as 1024² Flux frames with mushroom-scene backgrounds attached, not alpha-cut isolated organs. The on-screen Cosmo became a collage of rectangles + black ovoids stacked on a primitive capsule. Three attempts did not converge: Sprint 16A LoRA hero (worked, single image), Wave 21 PIL-crop decals (failed — flat regions), Wave 21.1 fal.ai-regen decals (failed — full-frame paintings with organ inside). NORTH-STAR §4 rule: when patches don't converge, stop patching and reconsider the system. **The system is the decal-on-capsule paradigm.** It assumed we could paint one organ per decal-plane without painting the world around the organ. Diffusion models trained on whole scenes don't isolate cleanly even with negative prompts and BiRefNet. We retire the paradigm. Cosmo becomes **a single textured plane carrying `cosmo-hero-lora.png`** — the canonical 10/10 character-DNA painting that already exists, used as a billboard quad in the Three.js scene. Skeleton-rig (capsule + sphere head + 6 decal planes + 4 disc-arms) is retired. The CosmoAnimDirector loses what depended on bones (head-track, antenna-bob, blink) and keeps what depends on transforms (idle-breath via plane.scale.y, walk via translate, jump-arc, climb via rotation). The pure-3D ambition (Meshy v6 + auto-rig + texture-projection) is reserved for a future wave when we can solve skinning end-to-end. Ship a working visually-correct Cosmo today; rebuild toward 3D later when the path is clear.

### 2026-05-05 — Wave 21.1: crop-shortcut retired, /play/ becomes full-screen
First live UAT of v2.2.0 surfaced two failures the programmatic UAT could not catch. **(1)** The Cosmo on screen is a green pill — the deterministic PIL-crop decal-pivot from cosmo-finisher (Wave 21, $0.30 budget-saver) failed to land DNA-correct on the live rig: body-skin doesn't read as Hayao×Moebius watercolor, suction-discs render as black bat-wings, antenna-bulb is a brown ball instead of saffron-glow flower, the capsule mesh wins visually wherever a decal isn't strong enough. Sunk cost is not an argument; we retire the crop pivot. **(2)** The `/play/` page still wears the marketing-pages chrome — Dutch nav ("Home / Het Verhaal / Updates"), version-pill in-frame, the canvas pinched into a center column with black bars on the sides. NORTH-STAR §3 says the world breathes; right now the browser chrome breathes around it. The play surface becomes full-viewport game, no nav, no back-to-menu links — close the tab to leave. Wave 21.1 ships as v2.2.1 with two parallel cycles: real fal.ai Flux LoRA regen of all six decals (no crop fallback, regen until 9.5+/10 DNA per decal even if it takes 30+ attempts) + capsule-mesh hidden when body-skin texture loads, and `/play/` chrome stripped to full-canvas game. Quality bar set explicitly: this is what should have shipped in Wave 21. We didn't see it because programmatic UAT can't see pixels.

### 2026-05-04 — Substrate completion (Wave 21): Area layer surfaced + hybrid contract + layered transitions
Three months of substrate work shipped a Universe→Room contract that silently dropped the **Area** layer that NORTH-STAR §3 has always declared. The gap is now closed. Wave 21 promotes Area to a first-class authoring tier with its own `areas.json` manifest (id, displayName, mood-overrides, room-list, path-experience), and the runtime traversal grammar becomes `?universe=<u>&area=<a>&room=<r>` with sensible defaults at each level. The Universe contract becomes **hybrid**: a JSON manifest spine (declarative — derden + Claude-Code paste-in work without writing code) plus an **optional `behavior.ts`** escape hatch for power-users (programmatic background, custom arrival, dynamic inhabitants). Transitions are **layered per scale** to honor "the world breathes, doesn't shake": Room↔Room is biome-blend (continuous), Area↔Area is gradient-cut (brief, meaningful), Universe↔Universe is portal (event, ceremonial — matches existing nebula-portal precedent). Cosmo gets his finishing pass in the same wave: visual decals regenerated to final Hayao×Moebius watercolor quality (RTcosmo LoRA-locked), eye-region smear from v1.5.2 era resolved, plus `CosmoAnimDirector` shipped (idle-breath / blink / head-track / antenna-bob / walk / jump-arc / climb). Rollout is **feature-flag `?substrate=v2` during build, hard-cutover at wave-close** when reference-forest + Cosmo-finish + authoring-docs all pass UAT — substrate is invasive and derden need to test against v2 before it lands on `/play/`. The Wave 20b plan (CosmoAnimDirector + first trampoline + universes/forest extraction) is fully absorbed into Wave 21; Wave 22 becomes "first non-forest Universe to prove the substrate".

### 2026-05-03 — Collective agent evolution (shared `.claude/` infrastructure)
Recognised mid-Wave-20a wrap-up that the Claude-paired workflow producing this project is *itself* generative: every contributor sharpens their dev-agents, skills, brainstorm patterns, and asset-gen scripts in the process of building. We commit to treating `.claude/agents/`, `.claude/skills/`, `.claude/brainstorm/`, and `scripts/` as **shared development infrastructure on the same footing as the runtime code**. PR-improvements compound. Mono-repo for now (agents alongside Universes); extract to sibling repo (`cosmos-2026-agents`-style) only if/when portability beyond cosmos-2026 becomes a real demand. See `AGENTS.md`.

### 2026-05-03 — Public substrate for Claude-dev collaboration
Project promoted from "Richard's game" to **a substrate any Claude-dev can plug a Universe into**. Cosmo + companion-AI + room-runtime are shared dependencies; Universes are external authored modules satisfying a documented contract. The pitch is one sentence: *your Cosmo can visit my forest, my Cosmo can visit your world*. P2P scope for v1 is **asynchronous + content-portable** (state travels with Cosmo, Universes are static deployables) — true realtime co-presence is reserved as a future possibility but not a near-term commitment. Repository becomes GitHub-public-first: README rewrite, CONTRIBUTING.md, UNIVERSE-AUTHORING.md, Universe contract spec, issue templates. We are not a platform; we enforce brand contract via PR review, not policy.

### 2026-05-03 — World model: ROOM → AREA → UNIVERSE
Vision sharpened mid-Wave-20a. The world is now formally a three-scale nested model: **ROOM → AREA → UNIVERSE**. A Room is the immediate Sims-dense scene Cosmo inhabits, full-movement, packed with side-quests; an Area is a cluster of Rooms connected by traversable psychedelic paths; a Universe is a top-level container holding Areas. Long-horizon: **other Claude devs invited to author their own Universes**, plugged into the same Cosmo + companion-AI scaffolding — we are no longer building a game, we are building a substrate. Primary delight-loop locked: a regular trampoline Cosmo walks to and joyfully jumps on (and you watch him want to keep doing it). Visual language locked at the current Hayao×Moebius watercolor + character-DNA palette — future questions about visuals must be implementation-concrete, not mood-shifting. Wave 20a (CosmoV2 builder) is unaffected — Cosmo himself is the same being. Wave 20b adds the first Room with the trampoline. Wave 21+ formalizes Area-paths and the Universe plug-in interface.

### 2026-05-03 — Cosmo v2 hybrid rebuild (Wave 20)
After three consecutive rig-fix attempts (v1.5.0/1.5.1/1.5.2) failed to fully eliminate Cosmo's eye-melting, we reconsidered the *entire* rig. The Meshy-imported GLB had structurally bad weights and out-of-place eye-bones; patching it was Sisyphean. Decision: replace the GLB with a primitive-skeleton (Three.js Object3D bones) wearing painted-texture decals (fal.ai watercolor PNGs). Honors the existing `cosmo-animation-spec.json` line that always said `"implementation": "procedural-object-transforms"` — we just hadn't actually built it that way. Architecture in `.claude/brainstorm/wave20/01-cosmo-v2-architecture.md`. Wave 19b (Life System + mic-input) is paused; it will build on the new rig.

**Locked choices (2026-05-03)**:
- *Cutover*: hard cutover on Wave 20a deploy. v1 GLB-rig is removed; no parallel feature-flag.
- *Silhouette*: capsule body, kid-alien proportions — preserves Sprint 16A LoRA-locked DNA.
- *Decal-style*: strict Hayao×Moebius watercolor — full visual continuity with v1.5.x lore + landing pages.

These choices favor brand integrity over experimentation. They are revisitable per §4 if a future wave shows them limiting.

### 2026-05-03 — Spoof framing retired (Wave 19a)
The game began as a retro-inspired alien adventure with a spoof framing. It had drifted too far for that frame to fit. We migrated five HTML pages, killed the press-kit (redirect to /lore/), and re-anchored the brand on a 146-word backstory. New tagline: *"Een aquarel-trip die zichzelf voortzet als jij stilzit."* Logo swap to LoRA-locked hero. Game-code itself was already spoof-free.

### 2026-05-02 — Smoothness + calm baseline (Wave 18)
The game had become **constantly distorted**: every effect always-on, breathing sines locked in lockstep, a placeholder synth fluitje forever audible. We reconsidered the post-FX philosophy from "always trippy" to "calm baseline + event-driven peaks". Bloom -44%, fluid -55%, kaleido ambient → 0, event cadence 18-30s. Plus the placeholder synth was killed, the gyro deadband fixed, the AI mixer-clobber-bug fixed. The world now breathes; it doesn't shake.

### 2026-04-29 — Rhythm-trip → motion-explorer (Sprint 17)
The "tap on the beat" framing was always a button-game in disguise. It was replaced with a motion-controlled world-explorer + 8s-idle companion AI. Cosmo stopped being something you score against and started being something you keep company.

### 2026-04 — Level-based platformer → rhythm-trip (v1.0)
The earliest framing was a 10-level platformer. It was retired the moment we realized we cared about the *being* more than the *levels*.

---

## 7. What this document is, and isn't

It is **not** a roadmap. Roadmaps live in brainstorm docs and the memory `next_session.md`. They change wave by wave.

It is **not** a PRD. PRDs become snapshots. This document stays alive.

It **is** the contract between Richard and Claude about what we are building together, why, and how we change our minds.

If the work ever stops matching this document, **the document is the one that gets challenged first**, not the work.

---

*Adem mee. Hij blijft niet stil.*
