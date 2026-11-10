# Agents, Skills & Shared Dev Infrastructure

> *Every Claude-paired workflow that builds this project also produces tooling. We share it.*

This document describes how the development infrastructure of Zorp's Universe is organised, how to contribute improvements to it, and why we believe the dev-tooling improvements compound across the contributor community as much as the runtime code does.

Read [`NORTH-STAR.md`](./NORTH-STAR.md) §3b for the underlying posture.

## What lives where

```
cosmos-cosmic-adventure-2026/
├── .claude/
│   ├── agents/                 ← reusable subagent definitions (markdown)
│   │   └── cosmos-tracker.md   ← project sync-check agent
│   ├── skills/                 ← reusable skills (slash-command-style)
│   ├── brainstorm/             ← per-wave planning artifacts
│   │   ├── wave19/             ← rig diagnosis, life-system, lore migration, asset pipeline
│   │   └── wave20/             ← Zorp v2 architecture, decal-gen report
│   ├── plans/                  ← active in-flight plan documents
│   ├── commands/               ← project-specific slash-commands
│   └── CLAUDE.md               ← project instructions for any Claude session
├── scripts/                    ← asset-gen pipelines + dev-tooling
│   ├── sprint*/                ← per-sprint asset pipelines (reproducible)
│   ├── wave*/                  ← per-wave asset pipelines
│   ├── changelog-to-html.mjs   ← /updates/ page generator
│   ├── postbuild-*.mjs         ← Vite postbuild rewrites
│   └── sync-check.sh           ← pre-commit sync verification
```

These directories are **shared development infrastructure**. Improvements are welcome PRs.

## Why this matters

Pair-programming with Claude is a high-leverage workflow when the agent has the right context. Every contributor who improves a brainstorm-template, sharpens an asset-gen script, or authors a useful subagent makes the *next* contributor's work faster and better. Over time, the `.claude/` directory becomes a documented, evolving toolkit — one that any Claude-paired developer can pull from when they start their own Universe (or even unrelated projects).

The compounding is real. The Wave 19a rig-diagnostic agent that confirmed the GLB weight-bleed with hard data was prompted in 600 words; that prompt structure is a template anyone authoring a 3D-rig fix in a future Universe can fork. The Wave 20a decal-gen agent that handled fal.ai + BiRefNet + Pillow with DNA-validation and 3-retry logic is reusable for any Universe authoring painted character assets. The brainstorm-doc structure (sections, word-counts, deliverable contracts) is a convention that scales.

We want this collective sharpening to be visible and frictionless from the start, not an afterthought we organise later.

## Contribution patterns

### A. Improving an existing agent or skill
1. Open an issue describing what you'd improve (better DNA validation, smarter retry, faster batch, cleaner prompt structure).
2. Fork, edit `.claude/agents/<agent>.md` or `.claude/skills/<skill>.md` in place.
3. Test by running it on a real task (in your fork or a side project).
4. Open a PR titled `agent: <agent-name>` or `skill: <skill-name>` with before/after notes.

### B. Authoring a new agent or skill
1. Open an issue describing what gap it fills. Reviewers will engage on whether it generalises (good candidate for shared infra) or is project-specific (fine — but lives in your Universe folder, not `.claude/`).
2. Author it as a markdown file with a clear purpose, prompt template, and example invocation.
3. Add a short entry under "What lives where" in this file.
4. Open a PR titled `agent: add <agent-name>` or `skill: add <skill-name>`.

### C. Improving an asset-gen pipeline
1. Pipelines live in `scripts/sprint*/` or `scripts/wave*/`. They're often Python or shell, sometimes both.
2. Common improvements: cheaper-model cascading, smarter retry, automated DNA validation, faster batch, telemetry/logging, error reporting.
3. Open a PR titled `scripts: <improvement>` referencing the pipeline you touched.

### D. Improving the brainstorm-doc structure
1. The format in `.claude/brainstorm/` (section headers, word-budgets, deliverable contracts) is convention not enforcement.
2. If you find a structure that produces clearer outputs (better section ordering, more useful agent briefings, parseable hand-off between parallel agents), open a discussion or a PR titled `brainstorm: <change>`.

## Mono-repo now, sibling repo later (maybe)

Today everything lives in this one repository. That's the simplest contributor workflow: clone, improve, PR. No submodule complexity. No version skew between the runtime and its tools.

If at some point the agents/skills mature into something genuinely portable beyond Zorp's Universe — meaning multiple unrelated projects want to depend on them — we'll extract them into a sibling repo at that moment. The split won't be speculative; it'll be in response to real demand. The brave-reconsideration principle (NORTH-STAR §4) governs the timing.

Until then: fork, improve, upstream. The collective workflow gets sharper.

## Quality bar for shared infrastructure

Same as runtime code. Specifically:

- **No emojis, no placeholders, no "good enough".** Same bar as the visual brand.
- **Reproducibility**: scripts must run on a fresh checkout with documented env variables. Pipelines log telemetry to `_logs/` so future contributors can see what worked.
- **Failure modes**: agents and scripts log loud failures; they never silently swallow errors and produce nothing.
- **Cost transparency**: any pipeline that hits a paid API documents the per-run cost and a budget cap.
- **Brand fit**: agents that produce assets must respect the brand contract (LoRA `rtcosmo` for Zorp, palette-locked colors, watercolor style) by default.

## Where agents shine in this workflow

A few patterns we've found work especially well in this project. They're suggestions, not rules.

- **Parallel diagnostic agents** for unclear bugs: 4 agents looking at audio / post-FX / gameplay / visual-coherence simultaneously, each in their own scope, producing focused reports. Worked beautifully for Wave 18 smoothness pass.
- **Architect agents for redesigns**: write a brainstorm doc *before* code, with deliverables structured for downstream agents to consume. Wave 20a's Zorp v2 architecture spec was an architect-agent output that the implementation agents then consumed.
- **Asset-gen agents with DNA validation**: the costly part of fal.ai work isn't the API call, it's iterating prompts. An agent that runs the gen, validates against a reference, and retries with prompt iteration saves hours.
- **Honest fitness-check at first contact**: the README quickstart asks Claude to evaluate whether a new contributor is ready before suggesting they author a Universe. Care, not gatekeeping.

## What's NOT here yet

- A canonical asset-gen agent definition extracted into `.claude/agents/asset-gen.md`. Today the asset-gen logic lives ad-hoc in `scripts/wave*/`. Extracting and generalising it is a welcome Wave 21 task.
- A linter / validator for new Universes that checks the four-part contract automatically.
- A CI step that runs the brainstorm-doc structure validator.

These are open invitations.
