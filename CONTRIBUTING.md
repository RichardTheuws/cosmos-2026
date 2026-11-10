# Contributing to Zorp's Universe

This is an open repository, but it's authored — not committee-managed. Read [`NORTH-STAR.md`](./NORTH-STAR.md) before doing any non-trivial work. Everything below assumes you've read it.

## Is this the right project for you right now?

Read this section even if you'd rather skip it.

This is a prestige-bar project authored alongside Claude. The contracts assume real comfort with:

- TypeScript strict mode and modern Three.js (geometries, materials, scene-graph, post-FX)
- A Vite + npm workflow, including reading and modifying build configs
- Asset pipelines (Pillow, fal.ai, ElevenLabs APIs, BiRefNet alpha-clean)
- Multi-turn dialogue with Claude Code, brainstorm → plan → implement → verify
- Honest UAT (not header-grep — see [`NORTH-STAR.md`](./NORTH-STAR.md) §7)

If you have all of that, welcome. The fitness check the README quickstart asks Claude to run is mostly a formality for you.

If you don't yet, that's fine and you're still welcome — but the right first step is usually not "author a Universe". A few honest entry points:

| You are | Start with |
|---|---|
| New to Claude Code | Build something smaller in Claude Code on a side project for ~2 weeks. Get used to its rhythm. Then come back. |
| Comfortable with Claude Code, new to Three.js or game dev | Fix a runtime bug, improve a script in `scripts/`, or study `universes/forest/` as a reference implementation before authoring your own. |
| Comfortable with everything but the brand voice / authoring posture | Read `NORTH-STAR.md` end-to-end. Engage with the pivot ledger. Then propose a Universe idea in an issue before opening a PR. |
| You have a clear Universe idea + the chops + the time | Run the quickstart. Open a PR. We're looking forward to seeing what you build. |

Path 2 and 3 are not "lesser" contributions — runtime improvements, script improvements, and review engagement compound across every Universe. They're often more valuable than another Universe.

This isn't gatekeeping. It's an honest attempt to make sure your first interaction with the project is one you finish, not one you bounce off in frustration. The substrate gets weaker when contributors arrive without enough chops to make their work land; it gets stronger when contributors arrive ready.

## Posture

This project operates on the **brave-reconsideration principle** (NORTH-STAR §4). It applies to contributions too:

- We don't add features for completeness. We add features that compound.
- Sunk cost is never an argument to keep something. Hours invested don't earn a feature its place.
- Pivots are announced before the work starts (a paragraph in NORTH-STAR's Pivot Ledger).
- "Good enough" is not a quality bar. This is a **prestige project**: quality > cost on assets, quality > speed on shipped pieces.

Contributors who don't share that posture will find PR review frustrating. Contributors who do will find the bar high and the engagement deep.

## What contributions are welcome

| Type | Welcome | Notes |
|---|---|---|
| **New Universe** | Yes, please | See [`UNIVERSE-AUTHORING.md`](./UNIVERSE-AUTHORING.md) for the contract. |
| **Bug fix in runtime** | Yes | Open issue first if it's not obvious. |
| **Performance improvement** | Yes | With benchmarks before/after. |
| **New companion-AI behavior** | Yes if it fits the life-system spec | See `.claude/brainstorm/wave19/02-life-system.md`. |
| **New Zorp capability (move, scale, etc.)** | Discuss first | Capabilities affect every Universe — must compose. |
| **Cheaper/better integration alternative** | Yes, please | See [`INTEGRATIONS.md`](./INTEGRATIONS.md) for the substitution bar (equal or better quality, equal or lower cost, ≥1 Universe author validated). |
| **Asset-gen pipeline improvements** | Yes, please | Scripts in `scripts/` are first-class shared infrastructure. Smarter prompts, cheaper-model cascading, automated DNA validation, faster batch — all welcome. |
| **Agent / skill / brainstorm-template improvements** | Yes, please | `.claude/agents/`, `.claude/skills/`, `.claude/brainstorm/` are shared dev infrastructure. See [`AGENTS.md`](./AGENTS.md) for the contribution pattern — every Claude-paired contributor's workflow gets sharper when these compound. |
| **Brand-style deviation** | Document why first | Then we engage the argument. |
| **Refactor for refactor's sake** | No | Refactor when adding a feature requires it. Not before. |

## How to author a Universe

The technical contract is in [`UNIVERSE-AUTHORING.md`](./UNIVERSE-AUTHORING.md). The short version:

1. Fork the repo.
2. Create `universes/<your-name>/` with the four required artifacts:
   - Background (Three.js scene module or composition-spec.json)
   - Room-list + traversal graph
   - Asset manifest
   - Zorp-arrival hook
3. Test locally with `npm run dev` + URL `?universe=<your-name>` to enter your Universe.
4. Open a PR titled `universe: <your-name>`.
5. Engage with PR review — reviewers will check brand-fit, contract-correctness, and posture-alignment.

## How to work on the runtime

1. Open an issue describing what you want to change and why. Issues that propose a new abstraction or capability get tagged with `needs-pivot-ledger` — meaning a NORTH-STAR §6 entry must be drafted in the issue before code is written.
2. Discuss in the issue. Sometimes the right answer is "don't build it" or "build a smaller version". This is normal.
3. Implement on a branch.
4. Run `npm run build` clean. Run `bash scripts/sync-check.sh` clean.
5. Open a PR titled `feat:`, `fix:`, `docs:`, or `chore:` per Conventional Commits.
6. Do **real UAT** if your change affects the live build (per NORTH-STAR §7's deploy lessons): bundle reference, bundle reachable, bundle content has expected logic markers.

## Code style

- TypeScript strict mode. No `any` without a comment justifying it.
- Comments only when the *why* is non-obvious. The *what* should be readable from the code.
- No emoji-fallbacks anywhere. No placeholder graphics. If you can't get a clean asset, ship nothing for that slot and flag it loudly.
- File-level docstrings explain context (which sprint, which decision). Inline comments explain trapdoors.

## Brand fidelity

The brand is **locked at the current Hayao×Moebius watercolor + character-DNA palette**. See NORTH-STAR §3 / §brand. Do not propose pivots to bolder pop, anime, graphic-novel, or any other style without a PR titled `pivot:` and a NORTH-STAR §6 ledger entry as the first commit on that branch.

Universes are allowed brand-deviation **inside their own folder** if documented. The substrate (everything outside `universes/`) is not.

## How decisions get made

Architectural decisions go in the NORTH-STAR Pivot Ledger (§6). Implementation decisions go in `.claude/brainstorm/waveN/` brainstorm docs before code is written. Both are public; both are challengeable.

When you disagree with a decision: open a PR titled `pivot: <reconsider X>` with a NORTH-STAR §6 ledger entry as the proposed change. The ledger entry is the discussion. If it lands, the work that follows is downstream.

## Conduct

There's no Code of Conduct document. The expectation is professional engagement, the kind you'd want on a small ambitious team. Bring your own judgment. If something's wrong, say so directly. If you're wrong, update.

## Working with Claude

Many contributors here pair-program with Claude (Claude Code, Claude.ai, Anthropic API). That's the implicit population of this project. A few patterns we've found work:

- **Memory matters**. Hand Claude the relevant brainstorm doc + the current state of your branch. It can't search the whole repo every turn.
- **Brave reconsideration applies to Claude too**. If Claude is iterating on a fix that isn't converging, *stop*. Reconsider the whole approach. We learned this the hard way at Zorp v1.5.0/1/2 → v2.
- **Verify deploys**. Header-grep is not UAT. See NORTH-STAR §7.

You don't have to use Claude. But know that the project is *authored* in a Claude-pair workflow, and the brainstorm docs in `.claude/brainstorm/` are written for that workflow.
