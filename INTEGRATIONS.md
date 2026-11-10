# Integrations & Costs

A radically transparent inventory of every external service this project uses, what it costs, and where the entry-points live. Forks are encouraged to **improve and replace these integrations**, then upstream the improvements so every Zorp's-Universe contributor benefits.

If you find a cheaper, faster, or higher-quality alternative for any service below, that is a **welcome PR**. The asset-gen pipeline scripts in `scripts/` are first-class artifacts of this project — they're as shareable and improvable as the runtime code.

> **Last verified**: 2026-05-03. Pricing changes. Always check the provider's current rates before committing budget.

---

## Paid services

### fal.ai — image generation
- **What we use it for**: most assets in `public/assets/` (sprites, backgrounds, UI). Models we hit: Flux Dev (sprites), Flux Pro v1.1 (backgrounds), Recraft V3 (logos + clean illustrations), Real-ESRGAN (upscaling), BiRefNet (background removal).
- **Pricing model**: per-call, no subscription. Flux Dev ≈ $0.025/image, Flux Pro v1.1 ≈ $0.05/image, Recraft V3 ≈ $0.04/image, BiRefNet ≈ $0.01/image, Real-ESRGAN ≈ $0.02/image.
- **API key**: `FAL_AI_KEY` in `~/Documents/games/.env` (project-local override: `.env` at repo root).
- **Wrapper**: `scripts/generate-asset.sh` — covers the common cases. Custom calls in `scripts/sprint*/` and `scripts/wave*/` for specific batches.
- **Project total spent so far** (rough): ~$8–12 across all sprints. Per-wave budget cap noted in each brainstorm doc.
- **Improvement opportunities for forks**: smarter prompt iteration, automatic DNA-validation, cheaper-model-first cascading (try Flux Dev → fall back to Flux Pro only on failure), async batch optimization.

### Suno (via sunoapi.org wrapper) — music generation
- **What we use it for**: ambient music beds + biome loops. Title-theme, slow-bloom-loop, inkpool-loop, hallucination-peaks.
- **Pricing model**: subscription via sunoapi.org (third-party wrapper around Suno's official service). Roughly $10/mo for ~500 generations.
- **API key**: `SUNO_API_KEY` in `~/Documents/games/.env`.
- **Direct alternative**: suno.com has its own UI for manual generation; we used that earlier. Sprint 16+ moved to API for reproducibility.
- **Memory file**: `~/.claude/projects/.../memory/games/cosmos-cosmic-adventure-2026/suno_api.md` documents the wrapper quirks.
- **Improvement opportunities**: a free Tone.js / Web Audio synth fallback for forks that don't want a Suno subscription, with documented quality trade-offs.

### ElevenLabs — voice + sound generation
- **What we use it for**: all SFX (`cosmo-coo-{1,2,3}`, jump, hurt, bomb, pickups), occasional voice lines. Sound Generation API (not the Voice API for these).
- **Pricing model**: subscription tiers; we use the $5/mo tier which gives ~30k characters voice + ~250 sound-generations.
- **API key**: `ELEVEN_LABS_KEY` in `~/Documents/games/.env`.
- **Wrapper**: ad-hoc in `scripts/sprint*/` (no consolidated wrapper yet — that would be a welcome PR).
- **Improvement opportunities**: free alternatives (Web Audio synthesized SFX, freesound.org licensed library), batch consolidation, sample-pack reuse system so multiple Universes share an SFX library.

### Meshy v6 — 3D model generation (currently retired)
- **What we used it for**: Sprint 15A first 3D Zorp via image-to-3D. The result had a broken auto-rig (alien anatomy too non-humanoid) which led to v1.5.x rig-melt → Wave 20 hybrid rebuild.
- **Pricing model**: per-task, ~$0.20/image-to-3D run.
- **Status**: not currently in active use. CosmoV2 (Wave 20) replaced the GLB approach with primitive skeleton + decals.
- **API key**: `MESHY_API_KEY` in `~/Documents/games/.env` — kept for future Universe authors who want to use it.
- **Memory file**: `~/.claude/projects/.../memory/shared/reference_meshy_pipeline.md`.

### Cloudflare — CDN + cache purge
- **What we use it for**: theuws.com is on Cloudflare. After every deploy we purge specific paths (or `purge_everything` after big shifts).
- **Pricing model**: free tier covers everything we do.
- **API key**: `CLOUDFLARE_API_TOKEN` in `~/Documents/server-mini-development/credentials/cloudflare.md` (out-of-repo, not committed).
- **Zone ID**: `92e9c3562b2d34ecd5bd188d3fb21a49` (theuws.com — substrate-author-specific; forks need their own zone).
- **Memory**: `~/.claude/projects/.../memory/shared/reference_cloudflare_api.md`.

### nano-banana — alternative image generation
- **What we use it for**: occasional asset-gen via Gemini Flash 3.1 / Pro through a local CLI. Cheaper than fal.ai for some tasks (multi-frame sprite-sheets, low-res variants).
- **Pricing model**: Gemini API rates — roughly $0.039/image at Pro tier.
- **API key**: depends on local install; check `~/.claude/projects/.../memory/shared/reference_asset_gen.md`.
- **When we prefer it over fal.ai**: 8-frame particle sets (cheaper batch), reference-image style transfers.

### FTP hosting
- **What we use it for**: production deploys to `theuws.com/games/cosmos-2026/`.
- **Pricing model**: included in existing hosting (Plesk).
- **Credentials**: `FTP_USER`/`FTP_PASS` in `~/Documents/games/.env`.
- **Deploy script**: `~/Documents/games/deploy-ftp.sh` (parent-level shared script across the games portfolio).
- **Forks**: bring your own host. The substrate is static after `npm run build` — any static host works (Netlify, Vercel, GitHub Pages, Cloudflare Pages).

---

## Free / open-source dependencies

### Runtime
| Library | What | Why |
|---|---|---|
| Three.js | 3D scene, primitive rig, post-FX | Industry-standard, mature, well-documented |
| Phaser 4 | HUD overlay, scene management | Zorp started as a 2D platformer; Phaser still owns the HUD layer |
| Tone.js + GrainPlayer | Procedural audio morphs | DMT-peak grain effects, FFT bridge |
| Howler.js | Audio playback engine | Robust cross-browser audio for SFX |
| Vite 6 | Build tooling | Fast dev server + multi-entry production builds |
| TypeScript 5 | Type system | Strict mode; no `any` without justification |

### Dev tooling
| Tool | Purpose |
|---|---|
| Node 20+ | Runtime for build + scripts |
| npm | Package management |
| Python 3 + Pillow | Asset post-processing (compositing, sprite-sheets, BiRefNet pipeline) |
| ImageMagick (optional) | Quick image inspection / format conversion |

### Pair-development
| Tool | Purpose |
|---|---|
| [Claude Code](https://claude.com/claude-code) | The CLI that authored most of this codebase, with Richard. |
| [Claude.ai](https://claude.ai) | Brainstorming + design conversations. |
| Anthropic Claude API | (optional) For contributor agents who want to build their own automation. |

The repo assumes you're pair-programming with Claude. It will run without — but the brainstorm docs in `.claude/brainstorm/` are written for that workflow, and the working method (NORTH-STAR §5) presumes a development companion.

---

## Per-asset cost transparency

Sample of what specific asset-gen sprints cost:

| Sprint | What | Cost |
|---|---|---|
| 7D | 9 enemies + 2 bombs + cracked-wall + 2 SFX | ~$0.84 |
| 11C | 9 painted tiles + ladder + grass-strip | ~$0.68 |
| 15A | 3D Zorp via Meshy image-to-3D | ~$0.20 |
| 15C | 8 weirdo objects | ~$1.85 |
| 16A | Zorp LoRA training (2000 steps, 10 images) | ~$3–5 |
| 16D | 3 cosmo-coo SFX (ElevenLabs) | ~$0.20 |
| Wave 20a | 4 face-decals + 1 disc + body-skin (crop) | $0.265 |

**Project total asset-gen spend (estimated)**: ~$10–15 across all of v0.x → v1.5.x. The substrate is cheap. Quality > cost holds because the costs are small.

---

## Reusable scripts

The `scripts/` directory contains the asset-gen pipelines from each sprint. Each folder is self-documenting. Patterns we've developed:

- **`generate-asset.sh`** (parent-level wrapper, in `~/Documents/games/`): the common case for one-shot fal.ai gens.
- **Per-sprint folders** (`scripts/sprint*/`, `scripts/wave*/`): specialized pipelines, retained for reproducibility. Forks can copy these as starting points.
- **`scripts/wave20a/p1_gen_decals.py`**: representative example — reads decal-spec, calls fal.ai, runs BiRefNet, validates output, logs telemetry to `_logs/`.

Improvements to these scripts (better DNA validation, cheaper-model cascading, async batch, smarter retry) are **welcome PRs**. They benefit every Universe author.

---

## How forks excel together

The substrate is **the runtime + the contracts + the integrations**. When a fork improves:

- **An integration** (cheaper alternative, faster batch, better validation) → upstream PR, every fork benefits.
- **A script** (more robust asset gen, smarter retry logic) → upstream PR, every fork benefits.
- **A piece of the runtime** (companion-AI behavior, performance, mobile feel) → upstream PR, every fork benefits.
- **A Universe** → ships under `universes/<your-name>/`, doesn't need to upstream — but you can also extract reusable bits to upstream if they generalize.

The forks aren't competing. They're each carving out their own corner of the imagination, on shared infrastructure. The infrastructure gets better when any one of them improves it.

---

## Reporting cost or integration changes

If a service we use changes pricing or terms, open an issue tagged `integration-change` so we can update this doc and notify Universe authors. If a service goes away, we triage with priority — losing fal.ai, for instance, would require finding a replacement quickly.

If you discover a cheaper or higher-quality alternative for any integration above, open an issue or PR. The bar for replacing an integration is: (a) equal or better output quality on the brand contract, (b) equal or lower cost, (c) at least one Universe author has used it successfully. We don't switch on speculation.
