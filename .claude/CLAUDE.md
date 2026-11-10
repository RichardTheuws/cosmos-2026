# Project Context — Zorp's Universe

## READ FIRST

Before any planning, coding, or even diagnosis in this project, **read `NORTH-STAR.md` in the project root**. It contains:

1. The vision (a psychedelic companion in an ever-growing world)
2. The principle of brave reconsideration (we change our minds when the future asks us to)
3. The pivot ledger (what changed, why)
4. The working method (holistic — vision check, smallest-piece-that-compounds, then plan)

**This applies to every agent spawned in this project too.** Briefings sent to subagents must reference NORTH-STAR.md or carry its essence in the prompt.

## Working method (in this project specifically)

This is a **prestige project**. It is no longer a proof-of-concept. That means:

- **Quality > cost on assets.** No emojis, no placeholders, no "good enough" graphics. Regenerate 3-5x if needed. **Do not use the `rtcosmo` LoRA for new Zorp images**: it was trained on the old look (with suction-cup hands) and stays retired until a new Zorp LoRA is trained. New Zorp gens wait for that LoRA.
- **Quality > speed on every shipped piece.** One biome that's fully alive beats three half-alive ones.
- **Co-authorship, not request-execute.** Strategic direction is set with Richard. Execution is mine to drive autonomously inside that direction. When direction is unclear, ask once with structured options — don't guess.
- **The vision is editable.** If something Richard says (or something we discover building) would change NORTH-STAR.md, edit NORTH-STAR.md before doing the work.

## Brave reconsideration in practice

If you (Claude or an agent) find yourself:
- About to write the third patch on a system that wasn't fixed by the first two →  **stop. Reconsider the whole system.**
- About to ship a feature that no longer matches the vision → **stop. Update vision or kill feature.**
- About to defend a design because of hours invested → **sunk cost is not a reason. Apply the rules in NORTH-STAR §4.**

When you decide a pivot is needed: **add a paragraph to the Pivot Ledger in NORTH-STAR.md (§6) BEFORE doing the new work.**

## Brand contract (these never bend without a NORTH-STAR pivot entry)

- **Visual language**: Hayao×Moebius watercolor + cosmic-luminous palette + saturated pop-accents (≤5%). No emojis. No Roblox-style placeholders. No standard stock graphics.
- **Voice**: Cormorant Italic for poetic copy, Inter for UI. Stoner-game vibe, never tacky drug-references. Zorp and his world are our own: no references to other games, studios or years of origin, not even oblique ones.
- **Language (locked, NORTH-STAR §1)**: **ALL in-game text and interaction is English** — every UI label, hint, onboarding line, system message, button, tooltip, any word the player reads in `/play/` — *even though Richard writes to you in Dutch*. Dutch is allowed ONLY for external marketing/site copy and internal working docs, never in-game. A Dutch string in-game is a bug. (Same discipline as English code/comments.) When you write or touch any player-facing string, it is English.
- **Zorp himself** (renamed from Cosmo on 2026-11-10, NORTH-STAR §6): character-DNA — pearl-drop head, chameleon-bulging eyes, saffron-crescent catchlight, single antenna with flower-bulb, soft fingerless mitten-hands with faintly saffron-glowing palms (no suction cups), faded-rose spots on green body, NO tail, slightly uncute proportions, slightly menacing-uncanny. Internal names (`CosmoAgent`, `cosmo.glb`), localStorage keys and the `/games/cosmos-2026/` path keep the old name on purpose: saves and links must keep working.
- **The world breathes, doesn't shake.** Calm baseline + event-driven peaks. Anything that pushes constant-trippy back to the foreground is an anti-pattern.

## Wave structure (current)

- **Wave 18** ✓ shipped (v1.4.0): smoothness + calm baseline
- **Wave 19a** ✓ shipped (v1.5.0 → 1.5.2): rig-fix attempts + lore pivot away from the spoof framing
- **Wave 19b** *paused*: Life System (15 activities + mic-input) — will rebuild on Cosmo v2
- **Wave 20** *next*: Cosmo v2 hybrid rebuild (primitive skeleton + painted decals) — see `.claude/brainstorm/wave20/01-cosmo-v2-architecture.md`
- **Wave 21+**: world expansion — first new biome beyond the forest. Direction TBD per NORTH-STAR §3.

## Brainstorm pattern

For any non-trivial wave, write brainstorm docs in `.claude/brainstorm/waveN/` BEFORE coding. One doc per concern, ≤900 words each. Spawn parallel agents for independent concerns. Synthesize into a wave plan together with Richard. Then implement.

## Memory

Persistent memory lives at `~/.claude/projects/-Users-richardtheuws-Documents-games/memory/games/cosmos-cosmic-adventure-2026/`. The `next_session.md` is the handoff between sessions. The `INDEX.md` is the routing table. Everything else is topical context.

Memory rules:
- After every wave, update `next_session.md` so the next session resumes in seconds.
- New non-trivial decisions get a topical `*.md` next to it.
- The Pivot Ledger in NORTH-STAR.md is the *project-level* record; topical memory files cover *implementation-level* learnings.

## Deploy + UAT

After every deploy:
1. **Real UAT, not header-grep**. Check: bundle reference in HTML matches deployed bundle name; bundle is reachable via curl; bundle content contains expected logic-marker (string from new code); changed pages all serve new content; CF-cache is purged.
2. Cloudflare cache purge — selective for small changes, `purge_everything` after big shifts.
3. Update HUD-pill version + CHANGELOG `[Unreleased]` + memory.

The pattern was learned the hard way (v1.5.0 deploy thought "verified" but only HUD-pill was checked — bundle never tested).
