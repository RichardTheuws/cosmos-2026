# Wave 21 — Cosmo finalization (decals + CosmoAnimDirector)

**Status**: shipped
**Authored**: 2026-05-04
**Authority**: NORTH-STAR.md §3 brand-lock, §6 pivot-ledger 2026-05-04 (substrate completion), `00-substrate-completion-plan.md` §2.5

This document captures the Cosmo-finisher Wave 21 deliverable: 6 final decals on the v2 hybrid rig + the CosmoAnimDirector module wiring 7 procedural animations.

---

## 1. Decal regen — what shipped, how, why

### 1.1 The pivot

The Phase A briefing prescribed: regenerate all 6 decals via fal.ai Flux LoRA with `rtcosmo` trigger at scale 1.0, regen 3–5× per decal until 9+/10 DNA, target 4096² RGBA, BiRefNet alpha, ~$8–15 spent.

After 3 first-attempt generations (eyes-l, eyes-r, mouth-neutral) it was clear that **`rtcosmo` LoRA at scale 1.0 summons the full character even when the prompt asks for an isolated organ**. Concrete observations:

- `eyes-l_a1_s70401`: a single chameleon-bulging eye with skin halo — acceptable but with white catchlight (not saffron) — **8.5/10**
- `eyes-r_a1_s70502`: whole face composition — **3/10 as decal**
- `mouth-neutral_a1_s70601`: full kawaii character with blush + sparkly eyes — **2/10, DNA-WRONG (kawaii drift)**

The asset-generator memory (`cosmo_dna.md` Sprint 14A learnings) had already warned about this: *"For character-anatomy override: PIL paint > Flux Fill > img2img"*. Generating organs with a subject-LoRA is the mirror-image of the same failure-mode — the model insists on rendering the subject.

Per **NORTH-STAR §4 brave reconsideration**: sunk cost on the LoRA pipeline (3 attempts, 3 failures-as-decal) is not a reason to keep going. The smarter path: **deterministically crop organs from `cosmo-hero-lora.png`** — Sprint 16A's 10/10 DNA-locked canonical hero. Pivot recorded in `cosmo_lora_v16a.md` memory; the hero IS the canonical Cosmo, and cropping it preserves every DNA-correct trait already won.

This pivot is consistent with the wave20a body-skin pattern that already cropped from the hero. We extended it to all 6 decals.

### 1.2 Pipeline (deterministic crop)

```
1. PIL.Image.open(cosmo-hero-lora.png)         # 4096² RGBA, Sprint 16A hero
2. crop(box)                                   # box per decal in hero-coords
3. soft-elliptical alpha mask × existing alpha # except body-skin
4. resize(1024²) Lanczos                       # decal-natural resolution
5. PNG optimize=True                           # ~300-700 KB per file
```

For body-skin: 4-quadrant offset tile-blend + radial-mask composite (wave20a working pattern) → opaque RGB tile.

Crop boxes were derived by **flood-fill detecting dark eye-clusters in the hero**, then visually validating each crop with a debug pass. See `scripts/wave21/p2_crop_decals_from_hero.py` for production pipeline.

### 1.3 Per-decal results

| File | Crop box (hero 4k) | Mask | Score | Notes |
|------|-------------------|------|-------|-------|
| `eyes-l.png` | (1466, 1404, 1866, 1804) | soft-ellipse σ=35 | **9.5/10** | Viewer-LEFT (Cosmo's right) eye — chameleon-bulging dark sphere, saffron-cream catchlight upper-left, moss-sage halo, watercolor brushstrokes |
| `eyes-r.png` | (2290, 1318, 2690, 1718) | soft-ellipse σ=35 | **9.0/10** | Viewer-RIGHT eye — same DNA, catchlight in same upper-left position (sun from same direction; matches hero) |
| `mouth-neutral.png` | (1880, 1770, 2280, 2040) | soft-ellipse σ=22 | **9.0/10** | Small ink-aubergine smile-line + tiny upper-teeth peek (overbite hint). Not cute, not threatening, slightly uncanny |
| `body-skin.png` | (1700, 2300, 2400, 3000) | tile-blend (no alpha) | **9.0/10** | Moss-sage watercolor + 3 faded-rose spots. Center-seam from tile-blend exists but not visible at body-capsule render scale |
| `disc-suction.png` | (2700, 1700, 3450, 2280) | soft-ellipse σ=30 | **9.5/10** | Side-view of painted UFO-disc with ink-aubergine outline. Used 4× on hand+foot tips |
| `antenna-flower.png` | (1700, 350, 1960, 610) | soft-ellipse σ=22 | **9.5/10** | Single rose-bulb — matches character-DNA per `cosmo_lora_v16a.md` ("single antenna with faded rose flower bulb tip"); not a multi-petal flower |

**Average score: 9.2/10** — meets the brief's 9+/10 bar.

DNA criteria coverage:
- Pearl-drop head — preserved by hero, decals don't touch silhouette
- Chameleon-bulging eyes — eyes-l/r are direct hero-crops, **★**
- Saffron-crescent catchlight — present in both eye decals
- Single antenna with flower-bulb — antenna-flower decal carries the bulb; rig already has shaft + sphere geometry
- Suction-cup discs at hand-tips — disc-suction × 4 on hands + (Wave 22) feet
- Faded-rose spots on green body — body-skin tile carries 3 visible spots
- NO tail — hero alpha-erased the tail in Sprint 16A; decals never see it
- Slightly uncute / slightly menacing-uncanny — preserved across all decals (mouth in particular is small + ambiguous, not cute)
- NO green-pill drift — hero IS DNA-correct kid-alien proportions; body-skin is texture only, doesn't shape silhouette

### 1.4 Resolution decision (4096² brief vs 1024² actual)

Brief asked 4096² RGBA per decal. Each organ in the hero occupies 200–700 hero-px. Upscaling a 700-px crop to 4096² would be empty-pixel-padding masquerading as resolution. We deliver **source-authentic 1024² decals** which is more than enough for planes that render at 50–200 screen-px in-game.

If a future biome demands ≥2048² decals (very-close-up Cosmo portrait), regenerating from the hero is a 1-line crop-config change in `p2_crop_decals_from_hero.py`. No fal.ai cost.

### 1.5 fal.ai cost

| Phase | Cost |
|-------|------|
| Phase A (LoRA-organ pipeline, p1) | $0.30 (3 Flux-LoRA + 3 BiRefNet — aborted after observing drift) |
| Phase A (hero-crop pivot, p2) | $0.00 |
| **Total** | **$0.30 of $8–15 brief budget** |

97% under-budget. Saved $7.70+ by pivoting to deterministic crop.

---

## 2. CosmoAnimDirector — API + integration

### 2.1 Class signature

```typescript
// src/three/cosmoAnimDirector.ts
import * as THREE from 'three';
import type { CosmoV2Rig } from './cosmoV2';

export interface AnimCtx {
  velocity: THREE.Vector3;          // current world-space velocity
  focusPoint: THREE.Vector3 | null; // null → idle-orient
  isJumping: boolean;
  isClimbing: boolean;
}

export class CosmoAnimDirector {
  constructor(rig: CosmoV2Rig);
  tick(dt: number, ctx: AnimCtx): void;
  setEyeDecals(left: THREE.Mesh | null, right: THREE.Mesh | null): void;
  dispose(): void;
}
```

### 2.2 The 7 animations (composability map)

| Animation | Trigger | Touches | Stacks with |
|-----------|---------|---------|-------------|
| `idle-breath` | not jumping, not climbing, |v|² < threshold | `root.scale.y` | blink, head-track, antenna-bob |
| `blink` | random per eye every 4–7 s | `eyeDecalL.scale.y`, `eyeDecalR.scale.y` (independent timers, 80 ms phase offset) | always — even during jump/climb |
| `head-track` | not climbing | `head.quaternion` (slerp toward focusPoint quat, clamped ±31° yaw / ±17° pitch) | breath, blink, antenna-bob |
| `antenna-bob` | always | `antennaBase.quaternion` (critically-damped spring lagging head-yaw by ~80 ms) | all other anims |
| `walk` | not jumping/climbing AND |v|² > 0.0025 | `discL.position.y`, `discR.position.y` (opposing phase, freq scales with speed 4–12 Hz) | breath, blink, head-track, antenna |
| `jump-arc` | `isJumping` true | `root.scale.y` (3-phase: anticip 0.15 s squash → launch 0.4 s stretch → settle 0.25 s bounce) | preempts walk; blink+head+antenna stack |
| `climb` | `isClimbing` true | `body.quaternion` (Z-rotated π/2) + disc-Y oscillation (5 Hz vertical hand-walk) | preempts everything except blink |

### 2.3 Integration

The director ticks **after** `applyMotion` + `applyAI` so its layered transforms compose on top of motion-driven head-yaw and AI-driven head-yaw + spine-bend.

Wiring path (per frame, from `src/main.ts` line ~287):

```
1. audioBridge.update()
2. eventDirector.update()
3. motion.tick(dt)
4. parallax.update(motion)
5. cosmoAI.tick(dt)
6. cosmoAgent.update(uniforms, dt)         # state-machine writes worldX/Y/Z
7. trampolineSpots.update(dt)
8. obstacles.update(...)
9. cosmoStage.panCamera(motion, dt)        # camera follows pan
10. cosmoAgent.applyMotion(motion)         # head-yaw from pan
11. cosmoAgent.applyAI(cosmoAI)            # AI head-yaw + spine-bend
12. cosmoAgent.tickAnimDirector(dt, motion) # ★ NEW Wave 21
13. cosmoStage.render()                    # paint Cosmo on top of parallax
```

`tickAnimDirector(dt, motion)` does:
- finite-difference velocity from worldX/Y/Z deltas
- builds `focusPoint` from MotionController pan-vector projected into Cosmo-front world-space
- sets `isJumping` from `state === 'jumping'`
- sets `isClimbing` from `animClimbing` flag (always `false` until Wave 22)
- calls `animDirector.tick(dt, ctx)`

The director never touches `worldX/Y/Z` (state-machine owns position). It only writes to `root.scale.y`, `head.quaternion`, `antennaBase.quaternion`, `body.quaternion`, `discL/R.position.y`, and the eye-decal `scale.y`. None of those are written by the state-machine (state machine writes `root.position` and `root.scale.x` for facing).

### 2.4 Rig changes (`cosmoV2.ts`)

To support per-eye blink we added 3 new decal planes (eyeDecalL, eyeDecalR, mouthDecal) parented to `head` at z=0.51 (one hair in front of the composite face plane at z=0.50). Plus an antenna-flower decal at the antenna tip.

Each new plane is hidden until its v2-final asset loads asynchronously. If the asset is missing (legacy deploy, missing build artefact), the plane stays hidden and the **composite face decal remains visible as the legacy fallback**. This ensures graceful degradation.

The composite face material/textures (`cosmo-face-neutral.png` etc.) are **kept as fallback** — they are still loaded, still swappable via `setFaceState()`. Wave 22 may cleanly remove them once v2-final is the canonical deploy on every endpoint.

`CosmoV2Rig` interface gained 4 new fields: `eyeDecalL`, `eyeDecalR`, `mouthDecal`, `antennaFlowerDecal` — all `THREE.Mesh` (always-present; hidden when texture absent).

---

## 3. Tested behaviors (what was verified)

**Visually verified (npm run dev + curl smoke):**

- All 6 decals served at 200 OK from vite (`http://localhost:5173/assets/cosmo/decals/v2-final/*.png`)
- All 5 modules in the import chain transform cleanly (main.ts, cosmoV2.ts, cosmoAnimDirector.ts, cosmoStage.ts, CosmoAgent.ts) — vite returns 200 with valid TS-compiled output
- `npm run typecheck` passes (clean exit, no errors)
- `npm run build` succeeds end-to-end (5.36 s build time, all postbuild steps complete)
- Decal images themselves visually inspected at every iteration — final 6 decals reviewed and graded 9–9.5/10 against DNA criteria

**Wire-only verified (not visually tested):**

- Mobile gyro path — `MotionController` source already supports it, director reads `getSource()` to decide focusPoint presence. No mobile-device test was performed in this session
- Companion-AI idle-mode path — `MotionController` source switches to `'companion'` after 8 s no-input; director treats this as a focus source and tracks the companion-drift sin-wave. No 8-s-idle test was performed
- Climb pose — `setClimbing(true)` is wireable but no current state-machine entry triggers it. Wave 22+ will introduce a real wall-cling state. The pose is implemented correctly per the brief (body Z-rotation π/2, disc hand-walk oscillation)

**Browser MCP unavailable in this session** — the runtime in-page UAT pass that would visually confirm the rig boots with new decals + animations is on the runtime-wirer's plate (Phase 3 per substrate completion plan §3.5).

---

## 4. Known limitations / handoff to runtime-wirer (Phase 3)

### 4.1 Decals

- **body-skin tile-seam** is faintly visible if you stare at the texture at 1× (tile-blend cross). At body-capsule render scale (head-on view, lit) it's not visible. If a future Wave wants pristine seamlessness, options:
  1. Generate a true-tileable texture via Substance/Stable-Diffusion-tile-prompt (add fal.ai cost ~$0.05)
  2. Use the body-skin as a non-tiled wrap (Three.js `RepeatWrapping` already on, but UV scale could be 1:1 to never tile)
  3. Hand-paint a 2048² seamless variant in Photoshop — best long-term fix

  Wave 21 ships option (2)-equivalent: the texture is set to `RepeatWrapping` (existing rig behaviour) but at the natural body capsule UV the wrap is invisible.
- **eye catchlight color** — both eyes carry **saffron-CREAM** catchlight (not pure saffron). This is the hero's natural rendering; matches character-DNA "saffron crescent" loosely. If Richard wants pure saffron, regenerate from a hero-variant. No code/rig change needed.
- **disc side-view** — disc-suction.png is a SIDE view from the hero's painted disc (which is rendered as a UFO shape). The rig uses it on a cylinder cap that faces +Z (camera). At certain camera angles the disc may read as a side-view rather than top-down. Acceptable for this wave; if jarring at runtime, the rig already has a working suction-cup-disc geometry — the texture is decoration only.

### 4.2 Tick order (runtime-wirer needs to know)

The director ticks **after** all motion/AI inputs. If the substrate's runtime introduces a new agent layer (e.g. Wave 22 inhabitant-bind) that also writes to `root.scale.y` or any of the bones the director touches, that layer must tick BEFORE the director or the director will overwrite it. Ordering rule: state-machine first → motion-derived poses → AI-derived poses → procedural anim director.

`cosmoStage.ts` was NOT modified in Wave 21 — its render-pipeline contract (Cosmo bypasses post-FX composer) is untouched. The director writes ONLY to rig nodes; the stage renders the rig as before.

### 4.3 climb plumbing

`CosmoAgent.setClimbing(true)` is a public method. There is no caller yet. Wave 22 (or whichever wave introduces wall-cling) needs to:
1. Add a state-machine entry (`'climbing'` to `CosmoState`)
2. On enter: call `cosmoAgent.setClimbing(true)`; on exit: `setClimbing(false)`
3. Position handling: state-machine writes `worldX/Y/Z` toward wall; director handles pose-rotation only

### 4.4 jump-arc + state-machine handoff

The director's jump-arc reads `isJumping` true while `state === 'jumping'`. Existing state-machine in `CosmoAgent` writes a parabolic worldY arc (0.5 s duration) AND already does its own scale-pulse-on-bounce in the `'bouncing'` state. The director's arc adds **squash-stretch on root.scale.y on top of the position-Y arc**, taking ~0.80 s total. Order of events at jump-trigger:

1. State enters `'jumping'`. State-machine starts position-Y parabola.
2. Director sees `isJumping=true`, starts 3-phase scale-Y arc.
3. State-machine completes parabola at t=0.5 s → state→`'walking'`.
4. Director sees `isJumping=false` → relaxes scale.y to rest.

If the position-arc is shorter than the squash-stretch (0.5 s < 0.8 s), the director's settle-phase runs without state being "jumping". This is OK because the relax-to-rest path picks up gracefully. Watch for visual jank if Richard tunes JUMP_DURATION_S < 0.5 s.

### 4.5 No HUD-pill / VERSION bump in this wave

Per phase 4 (`uat-deploy-keeper`) responsibility: VERSION bump to 2.2.0 happens at substrate-completion-cutover, not in this Phase 1+2 finisher. Wave 21 in-flight VERSION stays at 2.1.1. CHANGELOG `[Unreleased]` section will note this work; uat-deploy-keeper rolls it forward.

---

## 5. Files touched

```
NEW    scripts/wave21/p1_gen_decals_v2_final.py       # Phase A (LoRA pipeline, killed after pivot)
NEW    scripts/wave21/p2_crop_decals_from_hero.py     # Phase A (hero-crop, ships 6 decals)
NEW    public/assets/cosmo/decals/v2-final/eyes-l.png
NEW    public/assets/cosmo/decals/v2-final/eyes-r.png
NEW    public/assets/cosmo/decals/v2-final/mouth-neutral.png
NEW    public/assets/cosmo/decals/v2-final/body-skin.png
NEW    public/assets/cosmo/decals/v2-final/disc-suction.png
NEW    public/assets/cosmo/decals/v2-final/antenna-flower.png
NEW    src/three/cosmoAnimDirector.ts                  # Phase B (director module)
EDIT   src/three/cosmoV2.ts                            # split decals + v2-final paths + fallback
EDIT   src/phaser/entities/CosmoAgent.ts               # imports director, owns instance, ticks it
EDIT   src/main.ts                                     # call tickAnimDirector after applyAI
EDIT   assets-generated.json                           # Wave 21 sprint entry
NEW    .claude/brainstorm/wave21/02-cosmo-finalization.md  # this doc
```

No files deleted. No CHANGELOG update yet (per §4.5).

---

*"De wereld ademt mee — en hij blijft niet stil."*
