# Cosmo v2 — Hybrid Architecture (Wave 20 spec)

**Author**: cosmo-v2-architect
**Date**: 2026-05-02
**Status**: PROPOSED — awaiting user sign-off on Section 7
**Replaces**: `public/assets/3d/cosmo.glb` (29k tris, broken hand-rig)
**Honors**: `cosmo-animation-spec.json` line 183 — *"procedural-object-transforms"* — finally as designed.

---

## 1. Skeleton (Three.js primitives)

Bones are **transform-only `THREE.Object3D`** nodes. Children carry visible primitives. No `SkinnedMesh`, no `Skeleton`, no IBM. 9 nodes total (down from 10).

```
root                       (Object3D — world driver, position+scale; jump-arc + trip-scale)
└─ body                    (Object3D + CapsuleGeometry — torso+head silhouette)
   ├─ head                 (Object3D + SphereGeometry — pearl-drop head; yaw/pitch/roll)
   │  ├─ antenna_base      (Object3D — single thin CylinderGeometry; FFT-air wiggle)
   │  │  └─ antenna_tip    (Object3D + small SphereGeometry — red-pink bulb)
   │  ├─ face_decal        (Object3D + PlaneGeometry — eyes+mouth painted as ONE texture, billboard-soft)
   │  └─ spots_decal       (optional — body-skin freckle overlay; on body if cleaner)
   ├─ disc_l               (Object3D + DiscGeometry — left suction-cup, floats free)
   └─ disc_r               (Object3D + DiscGeometry — right suction-cup, floats free)
```

**Why no legs/arms?** Reign-of-Brabant-style stoner-vibe = Cosmo *floats*. The Sprint-15A reference has discs at hand-tips; v2 makes them free-floating around the body — closer to the character-DNA + cheaper to animate.

**Why one face_decal (not eye_l + eye_r + mouth)?** A single 512×512 painted plane reproduces the Hayao×Moebius look in one stroke. Lip-sync swaps the texture URL (4 mouth states), eye-track uses a small UV offset on the eye-region only — no separate planes to keep aligned.

**Pure transforms** (no mesh): `root`, `antenna_base`. **Mesh-carriers**: everything else.

---

## 2. Visible primitives + decals

| Node | Geometry | Rough size | Material |
|---|---|---|---|
| body | `CapsuleGeometry(r=0.45, len=0.9, segs=12)` | ~1.4 high | MeshStandardMaterial + body-skin texture |
| head | `SphereGeometry(r=0.5, segs=24)` slightly squashed Y=0.92 (pearl-drop) | ~1.0 wide | same skin material as body (seamless) |
| antenna_base | `CylinderGeometry(r=0.02, h=0.25)` | thin | MeshBasicMaterial — flat green |
| antenna_tip | `SphereGeometry(r=0.07)` | bulb | MeshStandardMaterial — pink/red emissive 0.2 |
| face_decal | `PlaneGeometry(0.85, 0.55)` mounted +Z 0.46 from head center | front of head | MeshBasicMaterial transparent + alphaTest 0.1 |
| disc_l/r | `CircleGeometry(r=0.18, segs=24)` + slight extrude (`CylinderGeometry(0.18,0.18,0.04)`) | flat puck | MeshStandardMaterial dark grey, painted top |

**Decal texture set** (PNG, transparent BG except body-skin which tiles):

| File | Dim | Status | Notes |
|---|---|---|---|
| `cosmo-face-neutral.png` | 512×512 | NEW | full painted face — chameleon eyes + saffron catchlight + closed-soft mouth |
| `cosmo-face-coo.png` | 512×512 | NEW | mouth-O for Life-System "moss-petting", "cosmic-yawn" |
| `cosmo-face-blink.png` | 512×512 | NEW | eyes 5%-thin slits, mouth neutral — for blink event |
| `cosmo-face-wave.png` | 512×512 | NEW | eyes-locked-at-camera, slight uncanny smirk (Sprint 17A "wave-uncanny" tone) |
| `cosmo-body-skin.png` | 512×512 tile | REUSE crop from `cosmo-hero-lora.png` | faded-rose-spotted green, seamless wrap |
| `cosmo-disc-suction.png` | 256×256 | NEW | matte-black puck top with concentric rings (suction-cup pad) |
| `cosmo-antenna-bulb.png` | 128×128 | OPTIONAL | only if shaded sphere reads too plastic |

**Reuse signal**: `cosmo-hero-lora.png` (existing) — crop torso for body skin, head for face base. Saves 2 of 7 prompts.

---

## 3. Capability implementation pseudocode

```js
// 1. 360° rotation — pure transform, no skinning ever
head.rotation.y = motionPan.x * Math.PI;          // full ±180° head turn
head.rotation.x = motionPan.y * 0.4;              // limited pitch
body.rotation.y = motionPan.x * 0.3;              // body follows ~30%
// Result: head can spin a full circle without a single shear vertex.

// 2. Scale (psychedelic trip / growth)
const tripScale = lerp(currentScale, lifeSystem.moodCluster.trip, dt * 2);
// trip ∈ [-0.6 .. +1.5] mapped → root.scale 0.4 .. 2.5
root.scale.setScalar(1 + tripScale);
body.scale.y = 1 + breathPulse * 0.04;            // FFT-low ride on top

// 3. Jump (3-phase per cosmo-animation-spec.json:jump-up)
phase==='anticipate': body.scale.set(1.10, 0.85, 1.10); root.position.y -= 0.05;
phase==='launch':     root.position.y = arcY(t);   // parabolic, peak at t=0.5
                      body.scale.set(0.92, 1.15, 0.92);
phase==='settle':     body.scale.lerp(ONE, 0.4); root.position.y = groundY;

// 4. Climb (cling to wall — disc suction)
state.cling = true;
root.rotation.z = Math.PI / 2;                    // body-axis along wall
disc_l.position.x = sin(t * 2) * 0.05;            // alternating "footstep" pulse
disc_r.position.x = sin(t * 2 + Math.PI) * 0.05;
antenna_tip dangles freely with gravity (apply -y velocity per dt).
```

---

## 4. Replacement plan for existing systems

| System | Change |
|---|---|
| `CosmoAgent.kickOffGLBLoad()` | Replace with `buildCosmoV2()` — synchronous, no async loader. ~80 LOC. |
| `CosmoAgent.fixSkinWeights()` | **DELETE**. No skin to fix. |
| `CosmoAgent.applyAIBoneHints()` skinning branch | **DELETE** the frame-copy fallback. Keep yaw-from-AI → write straight to `head.quaternion`. |
| `CosmoAgent.applyMotion()` | Retarget `bone_head.quaternion` → `head.quaternion`, `bone_spine.x` → `body.rotation.x`. ~6 line-changes. |
| `CosmoAgent` state-machine / pet-affect / random-events | UNCHANGED — they're directive-level, rig-agnostic. |
| `CosmoAI` | UNCHANGED. |
| `MotionController` hooks | UNCHANGED — they call into CosmoAgent which routes internally. |
| `OnboardingDirector` | UNCHANGED. |
| `THREE.AnimationMixer` + GLB clips (idle/sit/wave/stretch) | **DROP**. Replace with new `CosmoAnimDirector` that drives primitive transforms procedurally per `cosmo-animation-spec.json`. ~150 LOC, all 6 clips covered (idle-breath, walk, jump-up, jump-fall, cling, wave-uncanny). |
| `public/assets/3d/cosmo.glb` | **REMOVE** from prod path (keep in `_archive/` for case-study). |
| `cosmoStage.ts` Sprint-18 invariant | UNCHANGED — still bypass post-FX composer. |

Net code delta: **~−250 LOC** (drop skin-fix + mixer wiring), **~+230 LOC** (builder + anim-director). Roughly flat.

---

## 5. Asset generation list (Wave 20a kickoff)

| # | File (output) | Dim | Tool | Prompt (1-line) | Cost |
|---|---|---|---|---|---|
| 1 | `cosmo-face-neutral.png` | 512×512 PNG transp | Flux Dev + remove-bg | "rtcosmo painted alien face, large chameleon-eyes black-iris with saffron crescent catchlight, soft-closed neutral mouth, watercolor Hayao Moebius style, transparent BG" | $0.05 |
| 2 | `cosmo-face-coo.png` | 512×512 PNG transp | Flux Dev | same as #1 but "mouth small round coo-O" | $0.05 |
| 3 | `cosmo-face-blink.png` | 512×512 PNG transp | Flux Dev | same as #1 but "eyes thin horizontal slits 5% open, eyelashes visible" | $0.05 |
| 4 | `cosmo-face-wave.png` | 512×512 PNG transp | Flux Dev | same as #1 but "eyes locked forward at camera, slight uncanny smirk, no blink" | $0.05 |
| 5 | `cosmo-body-skin.png` | 512×512 tile | nano-banana crop | crop-and-tile from `cosmo-hero-lora.png` torso | ~$0 |
| 6 | `cosmo-disc-suction.png` | 256×256 PNG transp | Recraft V3 | "matte black suction-cup pad top-down view, concentric rings, painted illustration, transparent BG" | $0.04 |
| 7 | `cosmo-antenna-bulb.png` *(optional)* | 128×128 | Flux Dev | "small pink-red glossy alien bulb, watercolor highlight" | $0.05 |

**Total ~$0.29.** Memory note (`shared/feedback_asset_rules.md`): every Flux output → BiRefNet remove-bg pass; LoRA-trigger `rtcosmo` per `cosmo_lora_v16a.md`.

---

## 6. Sprint breakdown

**Wave 20a (~6 h) — visible Cosmo v2**
1. `buildCosmoV2()` builder — skeleton + primitives + materials (1.5 h)
2. Asset gen runs (#1–#6) + BiRefNet pass + drop into `public/assets/3d/v2/` (1 h)
3. Hook decals + body-skin texture (0.5 h)
4. Retarget `applyMotion` → `head.quaternion` + 360° rotation working (1 h)
5. `root.scale` wired to Life-System mood-cluster — trip-scale visible (0.5 h)
6. Drop `kickOffGLBLoad`, `fixSkinWeights`, AnimationMixer; smoke-test (1 h)
7. Acceptance: Cosmo visible, rotates 360°, scales 0.4–2.5, no shear ever (0.5 h)

**Wave 20b (~4 h) — animation polish + integration**
1. `CosmoAnimDirector` — idle-breath + blink event + walk procedural (1 h)
2. Jump 3-phase (anticipate / launch / settle) with `arcY(t)` (0.5 h)
3. Climb-state — `root.rotation.z` flip + disc oscillation (0.5 h)
4. Eye-track via face-decal UV-shift on `motionPan` look-at (0.5 h)
5. Lip-sync — texture swap on Life-System `coo` / `wave` cues (0.5 h)
6. Verify Sprint-18 post-FX bypass still holds; Life-System integration smoke test (0.5 h)
7. DNA-check vs `cosmo-hero-lora.png` — pearl-drop, saffron catchlight, antenna, discs (0.5 h)

---

## 7. Open questions for the user

1. **Decal style** — keep Hayao×Moebius watercolor (matches LoRA, brand-consistent) or shift to bolder pop-stoner illustrations (cheaper, more readable on phone)? Recommend: **watercolor**, we already paid for the LoRA in Sprint 16A.
2. **Body shape** — taller/thinner capsule (Sprint 15A "slight uncute proportions") or rounder pearl-drop blob (character-DNA)? Recommend: **capsule len=0.9 r=0.45**, mid-ground.
3. **Discs** — separate floating objects (current sketch — Sprint 15A reference image), or fused into body silhouette like little stub-arms? Recommend: **separate floating** — cheaper to animate, weirder, matches `cosmo-preview.png`.
4. **Migration** — hard-cutover on deploy day, or `?cosmo=v2` feature-flag for parallel A/B? Recommend: **feature-flag for one sprint** (20a behind flag, 20b promotes default), so we can revert without re-deploying GLB.
5. **GLB archival** — keep `cosmo.glb` reachable for case-study URL or remove from prod entirely? Recommend: **move to `_archive/cosmo-v1-glb/`**, drop from build.

---

## 8. Risks

- **Decals always face camera = 2D feel.** Mitigation: face-decal billboards softly (deadband ±15° before re-orienting), or use a shader to fake parallax on the iris based on `motionPan`. Side benefit: small iris UV-shift inside the decal *is* eye-track without separate eye-meshes.
- **Character-DNA brand drift.** Chameleon-bulging-eyes + saffron-crescent-catchlight are signature. Mitigation: Sprint 16A LoRA (`rtcosmo`) reproduces both; the face-neutral PNG will be DNA-checked against `cosmo-hero-lora.png` at gen-time. If catchlight reads weak → re-prompt with "saffron catchlight emphasized".
- **Performance.** Replacing 29k-tri SkinnedMesh with primitives (~2k tris total: capsule 600 + sphere 700 + disc×2 360 + plane 4 + cylinder 80 + bulb 200) = ~14× tri reduction. Net WIN. No SkinnedMesh CPU skinning cost. iPhone 14 baseline easily holds 60 fps.
- **Lost expressivity.** Skeleton-rig had baked clips (idle/sit/stretch/wave). Procedural director must re-create them. Mitigation: spec already calls for procedural (anim-spec line 183) — we're shipping the originally-intended path, not a regression.
- **Asset failure mode.** If face-decal gen produces non-DNA face, we have 4 retries before falling back to: ship body+disc primitives + a placeholder neutral face from `cosmo-hero-lora.png` cropped. No emoji fallback ever (memory: `shared/feedback_asset_rules.md`).

---

**End — 879 words.**
