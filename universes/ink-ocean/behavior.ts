/**
 * universes/ink-ocean/behavior.ts — Wave 24 greenfield Universe.
 *
 * Ink-Ocean is the universe that proves the substrate contract is NOT
 * forest-hardcoded. Every room is `biomeKey:null`, so there is no biome for
 * DefaultBackground to paint — instead this file ships a custom `background(ctx)`
 * that configures the SINGLE shared `ctx.parallax` (it adds ink-water layer
 * meshes to `ctx.parallax.scene`; it NEVER constructs a second ParallaxScene —
 * the v2.2.4 double-tick scar).
 *
 * Brand contract — NORTH-STAR.md §3:
 *   Hayao×Moebius watercolor. Locked palette: ink-aubergine / sky-wash /
 *   saffron-glow + ONE pop-cyan accent (≤5% of frame). No emojis. No
 *   placeholders. The sea breathes; it does not shake. All in-game text English.
 *
 * Design ground truth: `.claude/brainstorm/wave24/universe-ink-ocean.md` and
 * `.claude/brainstorm/wave24/00-design-bible.md`.
 *
 * Cosmo is weightless here. Per the canvas §9 LOCKED decision: weightlessness is
 * a PROCEDURAL hover-drift composed over the existing shipped `idle` clip (NOT a
 * new drift-swim clip — that is a documented fast-follow animation-request).
 * Interactables that conceptually want drift-swim locomotion use the existing
 * `walk` clip as the fallback (noted at each call-site). The shipped 12-clip set
 * is the only vocabulary used: idle, walk, jump, fall, duck, stretch, wink,
 * look, petted (+ bounce, dance, wave unused here).
 */

import * as THREE from 'three';
import { assetPath } from '../../src/core/assetPath';
import type {
  UniverseBehavior,
  SubstrateCtx,
  ArrivalCtx,
  ArrivalAnimation,
  BackgroundHandle,
  InhabitantHandle,
  InteractableHandle,
  UseApi,
  AudioHandle,
  TransitionCtx,
  TransitionDriver,
} from '../../src/substrate/contracts/BehaviorContract';
import { AmbientField } from '../../src/substrate/drivers/AmbientField';
import type { GlobalUniforms } from '../../src/core/globalUniforms';
import type { CosmoV2Rig } from '../../src/three/cosmoV2';

/* ── asset-path helper ─────────────────────────────────────────────────────
 *
 * Ink-Ocean references its PNGs/audio with the SAME `../../public/...`
 * convention the reference forest uses (PreloadManager's legacy allowlist
 * strips the `../../public/` prefix at runtime). At runtime inside behavior.ts
 * we resolve textures through the project `assetPath()` helper, so we strip the
 * prefix ourselves to match the resolved URL shape (e.g.
 * `../../public/assets/objects/kelp-organ.webp` → `assets/objects/kelp-organ.webp`).
 */
function inkAsset(rel: string): string {
  return assetPath(rel.replace(/^(\.\.\/)+public\//, ''));
}

/* Locked-palette hexes used by the procedural ink-water layers. No colour
 * outside these (+ the single pop-cyan accent) appears in this universe. */
const INK_AUBERGINE = 0x2a1f3d;
const INK_AUBERGINE_DEEP = 0x150f20; // trench abyss floor — aubergine toward black
const SKY_WASH = 0xbcd0e0; // pale unreachable surface-skin
const SAFFRON_GLOW = 0xe9c46a; // the three light-shafts (warm light in cool water)
const POP_CYAN = 0x3fe0e0; // the SINGLE ≤5% accent (jellyfish + lure-orb)

/* ════════════════════════════════════════════════════════════════════════
 * BACKGROUND — the whole point of this universe.
 *
 * Required because every room is `biomeKey:null`. Configures the single shared
 * `ctx.parallax` by adding ink-water layer planes to `ctx.parallax.scene`.
 * Keys off `ctx.room.id`:
 *   light-shafts → surface-skin + caustics + 3 saffron shafts + mote-field
 *                  + kelp-silhouette foreground (6–7 layers).
 *   the-trench   → faint surface-band + deep aubergine gradient + updraft
 *                  ink-streak column + deep-mote foreground (abyss variant).
 * `update(dt,u)` animates caustic scroll + shaft sway + mote drift continuously
 * (calm baseline — it breathes, it does not shake).
 * ════════════════════════════════════════════════════════════════════════ */

interface InkLayer {
  mesh: THREE.Mesh;
  /** Slow horizontal/vertical drift speed in world-units/sec. */
  driftX: number;
  driftY: number;
  /** Sine sway amplitude (world-units) + frequency (Hz) for shaft/mote breathing. */
  swayAmp: number;
  swayFreq: number;
  baseX: number;
  baseY: number;
  phase: number;
}

class InkOceanBackground implements BackgroundHandle {
  private parallaxScene: THREE.Scene;
  private layers: InkLayer[] = [];
  private timeS = 0;
  private roomId: string;

  constructor(ctx: SubstrateCtx) {
    // Paint onto the SHARED ParallaxScene's scene graph. We never instantiate a
    // second ParallaxScene — that is the v2.2.4 double-tick scar the contract
    // explicitly forbids. We only ADD meshes to the instance the substrate owns.
    this.parallaxScene = ctx.parallax.scene;
    this.roomId = ctx.room.id;

    if (this.roomId === 'the-trench') {
      this.buildTrench();
    } else {
      this.buildLightShafts();
    }
  }

  /** A flat colour backdrop plane far behind the stack (no PNG needed — pure
   *  ink-wash so gaps fall back to palette-locked colour, never the forest
   *  clear-colour). */
  private addColorPlane(hex: number, z: number, scale = 24): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(scale * 1.4, scale);
    const mat = new THREE.MeshBasicMaterial({ color: hex, depthWrite: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 0, z);
    mesh.renderOrder = -100;
    this.parallaxScene.add(mesh);
    return mesh;
  }

  /** A textured ink-water layer plane (surface skin, kelp silhouette, updraft
   *  column, etc.). Loaded from a universe-relative `../../public/...` path. */
  private addTexLayer(
    rel: string,
    z: number,
    opts: {
      width?: number;
      height?: number;
      x?: number;
      y?: number;
      opacity?: number;
      additive?: boolean;
      driftX?: number;
      driftY?: number;
      swayAmp?: number;
      swayFreq?: number;
    } = {},
  ): void {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(inkAsset(rel));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;

    const w = opts.width ?? 4.2;
    const h = opts.height ?? 3.0;
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      opacity: opts.opacity ?? 1,
      blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      // shafts/mote layers are additive (light), so no alphaTest; silhouettes
      // use a mild cut to drop BiRefNet alpha-edge halos.
      alphaTest: opts.additive ? 0 : 0.05,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const baseX = opts.x ?? 0;
    const baseY = opts.y ?? 0;
    mesh.position.set(baseX, baseY, z);
    this.parallaxScene.add(mesh);

    this.layers.push({
      mesh,
      driftX: opts.driftX ?? 0,
      driftY: opts.driftY ?? 0,
      swayAmp: opts.swayAmp ?? 0,
      swayFreq: opts.swayFreq ?? 0,
      baseX,
      baseY,
      phase: Math.random() * Math.PI * 2,
    });
  }

  /** ROOM A — The Light-Shafts. 6–7 layers, top sky-wash → ink-aubergine deep,
   *  three saffron shafts combing down, drifting motes, kelp-silhouette front. */
  private buildLightShafts(): void {
    // Backdrop ink-wash (sky-wash top blends to aubergine via two stacked planes).
    this.addColorPlane(INK_AUBERGINE, -20);
    this.addColorPlane(SKY_WASH, -19.5, 12); // upper-third surface-skin, smaller plane high in frame

    // 1) surface-skin with rippling caustic ink-lines, very pale, drifts slowly.
    this.addTexLayer('../../public/assets/backgrounds/ink-water-surface-4k.webp', -10, {
      width: 5.0,
      height: 3.4,
      opacity: 0.95,
      driftX: 0.015,
      swayAmp: 0.02,
      swayFreq: 0.12,
    });
    // 2-4) three saffron light-shafts (additive), phase-offset slow sway.
    for (let i = 0; i < 3; i++) {
      this.addTexLayer('../../public/assets/objects/light-shaft.webp', -8 + i * 0.1, {
        width: 0.9,
        height: 3.2,
        x: -1.2 + i * 1.2,
        opacity: 0.5,
        additive: true,
        swayAmp: 0.06,
        swayFreq: 0.08 + i * 0.01,
      });
    }
    // 5) drifting mote-field (additive, gentle upward drift like suspended dust).
    this.addTexLayer('../../public/assets/objects/water-motes.webp', -6, {
      width: 4.6,
      height: 3.2,
      opacity: 0.4,
      additive: true,
      driftY: 0.01,
    });
    // 6) kelp-organ silhouette foreground (the interactable's painted layer also
    //    lives here as scenery; the InteractableHandle re-uses the same asset).
    this.addTexLayer('../../public/assets/objects/kelp-organ.webp', -3, {
      width: 1.8,
      height: 2.6,
      x: 1.9,
      y: -0.4,
      opacity: 0.92,
      swayAmp: 0.03,
      swayFreq: 0.4,
    });
  }

  /** ROOM B — The Trench. Abyss-gradient variant: faint surface-band up top,
   *  deep aubergine→black, rising updraft ink-streak column, sparse deep motes. */
  private buildTrench(): void {
    this.addColorPlane(INK_AUBERGINE_DEEP, -20);
    this.addColorPlane(INK_AUBERGINE, -19.5, 16); // mid aubergine band
    this.addColorPlane(SKY_WASH, -19.2, 6); // faint distant surface memory, high + small

    // 1) abyss gradient wash (aubergine to black) — re-uses the abyss bg PNG.
    this.addTexLayer('../../public/assets/backgrounds/ink-water-abyss-4k.webp', -10, {
      width: 5.0,
      height: 3.6,
      opacity: 1,
      driftY: -0.004,
    });
    // 2) the updraft-current column (the interactable's painted layer) — tall,
    //    semi-transparent, slow upward scroll (always "running" as water).
    this.addTexLayer('../../public/assets/objects/updraft-current.webp', -5, {
      width: 1.1,
      height: 3.4,
      x: 0,
      opacity: 0.55,
      additive: true,
      driftY: 0.05, // continuous slow upward bubble-scroll (calm baseline)
      swayAmp: 0.015,
      swayFreq: 0.2,
    });
    // 3) sparse deep-particle motes, slow.
    this.addTexLayer('../../public/assets/objects/water-motes.webp', -6, {
      width: 4.6,
      height: 3.4,
      opacity: 0.22,
      additive: true,
      driftY: 0.006,
    });
  }

  update(dt: number, _u: GlobalUniforms): void {
    this.timeS += dt;
    for (const L of this.layers) {
      // continuous drift (wraps softly via modulo of a generous range so it
      // never snaps — slow water never stops, never jumps).
      const x = L.baseX + ((L.driftX * this.timeS) % 1.5);
      const y = L.baseY + ((L.driftY * this.timeS) % 1.5);
      // gentle sine sway (shafts comb, kelp breathes) — low amplitude, breathes.
      const sway = L.swayAmp > 0 ? Math.sin((this.timeS + L.phase) * L.swayFreq * Math.PI * 2) * L.swayAmp : 0;
      L.mesh.position.x = x + sway;
      L.mesh.position.y = y;
    }
    // keep the locked palette constants referenced so tree-shaking/tsc
    // unused-locals never flags them while assets are still being generated.
    void INK_AUBERGINE;
    void SAFFRON_GLOW;
    void POP_CYAN;
  }

  dispose(): void {
    for (const L of this.layers) {
      if (L.mesh.parent) L.mesh.parent.remove(L.mesh);
      L.mesh.geometry.dispose();
      const m = L.mesh.material;
      if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
      else m.dispose();
    }
    this.layers = [];
  }
}

function inkOceanBackground(ctx: SubstrateCtx): BackgroundHandle {
  return new InkOceanBackground(ctx);
}

/* ════════════════════════════════════════════════════════════════════════
 * ARRIVAL — the cool submersion portal (§4).
 * hue 0.55 (toward sky-wash/cyan) vs the forest's warm saffron 0.62. Cosmo is
 * drawn into and downward through the vortex; the substrate's default portal
 * driver runs the ceremony, hue-shifted cool. universeToUniverse transition is
 * intentionally OMITTED → substrate default portal, hue driven by this arrival.
 * ════════════════════════════════════════════════════════════════════════ */

function inkOceanArrival(_ctx: ArrivalCtx): ArrivalAnimation {
  return { kind: 'portal', duration: 1.4, hue: 0.55 };
}

/* ════════════════════════════════════════════════════════════════════════
 * INHABITANTS — autonomous lives Cosmo SEES but does not activate.
 *   light-shafts → cyan jellyfish (slow drift loop across upper-mid frame).
 *   the-trench   → deep-glow lure-orb (slow pulse far below; the single
 *                  saturated cyan point; seen-never-used; faintly uncanny).
 * Both are the universe's ≤5% pop-cyan accent — only on-screen, only small.
 * ════════════════════════════════════════════════════════════════════════ */

interface InkInhabitantSpec {
  id: string;
  room: 'light-shafts' | 'the-trench';
  textureRel: string;
  width: number;
  height: number;
  anchor: { x: number; y: number; z: number };
  /** 'drift' = jellyfish slow horizontal wander; 'pulse' = lure-orb scale throb. */
  motion: 'drift' | 'pulse';
}

const INK_INHABITANTS: readonly InkInhabitantSpec[] = [
  {
    id: 'cyan-jellyfish',
    room: 'light-shafts',
    textureRel: '../../public/assets/objects/jellyfish-cyan.webp',
    width: 0.55,
    height: 0.7,
    anchor: { x: -1.6, y: 0.8, z: -2.0 },
    motion: 'drift',
  },
  {
    id: 'deep-glow-lure',
    room: 'the-trench',
    textureRel: '../../public/assets/objects/deep-glow-lure.webp',
    width: 0.4,
    height: 0.4,
    anchor: { x: 0.6, y: -1.4, z: -2.4 },
    motion: 'pulse',
  },
];

class InkInhabitant implements InhabitantHandle {
  readonly id: string;
  readonly anchor: { x: number; y: number; z: number };
  private group: THREE.Group;
  private mesh: THREE.Mesh;
  private texture: THREE.Texture;
  private timeS = 0;
  private phase: number;
  private spec: InkInhabitantSpec;

  constructor(scene: THREE.Scene, spec: InkInhabitantSpec) {
    this.id = spec.id;
    this.anchor = spec.anchor;
    this.spec = spec;
    this.phase = Math.random() * Math.PI * 2;

    const loader = new THREE.TextureLoader();
    this.texture = loader.load(inkAsset(spec.textureRel));
    this.texture.colorSpace = THREE.SRGBColorSpace;

    const geo = new THREE.PlaneGeometry(spec.width, spec.height);
    const mat = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      depthWrite: false,
      // additive so the single cyan accent reads as bioluminescent light.
      blending: THREE.AdditiveBlending,
      alphaTest: 0,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(geo, mat);

    this.group = new THREE.Group();
    this.group.position.set(spec.anchor.x, spec.anchor.y, spec.anchor.z);
    this.group.add(this.mesh);
    scene.add(this.group);
  }

  update(dt: number, _u: GlobalUniforms): void {
    this.timeS += dt;
    if (this.spec.motion === 'drift') {
      // jellyfish: slow horizontal wander across upper-mid frame + a gentle
      // vertical pulse (the swim-bell). Wraps softly so it never snaps.
      const wander = Math.sin((this.timeS + this.phase) * 0.06 * Math.PI * 2) * 1.8;
      const bob = Math.sin((this.timeS + this.phase) * 0.5 * Math.PI * 2) * 0.06;
      this.group.position.x = this.spec.anchor.x + wander;
      this.group.position.y = this.spec.anchor.y + bob;
      // SFX #2 (jellyfish chime) fires when it crosses center — runtime-wirer
      // routes this through the AudioFFTBridge; randomised so it never feels
      // timed. (No emit hook in this contract; documented in the runbook.)
    } else {
      // lure-orb: very slow scale+opacity throb — the room's one strange
      // heartbeat. Felt more than seen. Never escalates.
      const pulse = 1 + 0.12 * Math.sin((this.timeS + this.phase) * 0.18 * Math.PI * 2);
      this.mesh.scale.setScalar(pulse);
      (this.mesh.material as THREE.MeshBasicMaterial).opacity = 0.65 + 0.25 * (pulse - 1);
    }
  }

  dispose(): void {
    if (this.group.parent) this.group.parent.remove(this.group);
    this.mesh.geometry.dispose();
    const m = this.mesh.material;
    if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
    else m.dispose();
    this.texture.dispose();
  }
}

function inkOceanInhabitants(ctx: SubstrateCtx): InhabitantHandle[] {
  const activeRoom = ctx.room.id;
  const dwellers: InhabitantHandle[] = INK_INHABITANTS.filter((s) => s.room === activeRoom).map(
    (s) => new InkInhabitant(ctx.scene, s),
  );
  // Wave 25.5 — suspended plankton: cool cyan motes rising slowly through the
  // shafts (the underwater "rijkere ambiance"). Wandering the drift is the joy.
  const a = ctx.room.anchor;
  dwellers.push(
    new AmbientField(ctx.scene, {
      id: 'ink-plankton',
      count: 170,
      color: 0x8fd9d2,
      size: 0.045,
      opacity: 0.55,
      area: { x: 6, y: 5, z: 4 },
      center: { x: a.x, y: a.y + 1.0, z: a.z - 1.5 },
      drift: { x: 0.02, y: 0.18, z: 0 },
      sway: 0.06,
      additive: true,
    }),
  );
  return dwellers;
}

/* ════════════════════════════════════════════════════════════════════════
 * INTERACTABLES — object + onUse(drives Cosmo) + calm-baseline + event-peak.
 *
 * Cosmo is weightless: his locomotion to an interactable is a PROCEDURAL
 * hover-drift (the substrate's walkTo + this universe's drift composed over the
 * shipped `idle`). Where a clip is named below, the substrate's anim director
 * owns the actual clip-drive; here (as the forest reference does) we apply a
 * thin procedural bridge on `cosmo.root` / `rollZ` / `pitchX` and NAME the clip
 * in comments so the director can take it over.
 *
 *   light-shafts → Kelp-Organ  (walkTo → stretch → wink + organ-swell SFX)
 *                + Float-Tap   (direct tap → petted + upward drift impulse)
 *   the-trench   → Updraft-Current (walkTo → jump + buoyant-arc → fall + whoosh)
 * ════════════════════════════════════════════════════════════════════════ */

/** ROOM A headline — The Kelp-Organ. onUse: drift to anchor (walk fallback for
 *  the unshipped drift-swim), then `stretch` (reach into the reed-tubes)
 *  immediately followed by `wink` (the "I made it sing" beat). The kelp-pipes
 *  brighten + organ-swell SFX (#1) blooms; one shaft warms ~1.8s (post.bloom
 *  nudge, decaying over 2s). Calm baseline: pipes sway on a slow phase-offset
 *  sine (handled by the background kelp layer). */
class KelpOrgan implements InteractableHandle {
  readonly id = 'kelp-organ';
  readonly anchor: { x: number; y: number; z: number };
  readonly range = 2.0;
  readonly nature = 'calm' as const;
  private timeS = 0;
  private bloomUntil = 0;
  private useCount = 0;

  constructor(room: SubstrateCtx['room']) {
    // Absolute stage space, inside the phone frame (v2.10.2).
    this.anchor = { x: 1.0, y: 0, z: -2.6 };
    void room;
  }

  update(dt: number, _u: GlobalUniforms): void {
    this.timeS += dt;
    void this.bloomUntil; // decay tracked by the post-FX intensity curve at runtime
  }

  onUse(_cosmo: CosmoV2Rig, api?: UseApi): void {
    // v2.10.2 — real clips: reach up into the pipes, then listen (look up).
    this.useCount += 1;
    api?.playClip(this.useCount % 2 === 1 ? 'stretch' : 'look', { holdS: 3.8 });
    api?.sfx('cling');
    this.bloomUntil = this.timeS + 1.8; // shaft-brighten window (SFX #1 organ-swell)
  }


  dispose(): void {
    /* no GPU resources owned here — the kelp PNG is a background layer. */
  }
}

/** ROOM A — Float-Tap. The project-wide direct-tap-Cosmo affordance, re-skinned
 *  by context: because Cosmo is weightless, the tap imparts a tiny upward drift
 *  impulse (procedural on root.position.y, decays) + plays `petted` (loop) +
 *  bubble-release SFX (#3). No placed object, no new asset. Anchor == Cosmo's
 *  own position; range small so only a direct tap triggers it. */
class FloatTap implements InteractableHandle {
  readonly id = 'float-tap';
  readonly anchor: { x: number; y: number; z: number };
  readonly range = 0.8;
  /** v2.10.2 — the ocean's resting place: he curls up and floats where he is. */
  readonly nature = 'rest' as const;

  constructor(room: SubstrateCtx['room']) {
    this.anchor = { x: 0, y: 0, z: 0 };
    void room;
  }

  update(_dt: number, _u: GlobalUniforms): void {
    /* baseline: no tap, nothing to animate. */
  }

  onUse(_cosmo: CosmoV2Rig, api?: UseApi): void {
    // v2.10.2 — he curls up and floats where he is (the ocean's rest).
    api?.playClip('petted', { loop: true, holdS: 5.5 });
    api?.sfx('cosmo-coo-2');
  }


  dispose(): void {
    /* nothing owned. */
  }
}

/** ROOM B headline — The Updraft-Current (the trench's trampoline-analog, the
 *  floaty counterpoint to the forest trampoline's snappy spring). onUse: drift
 *  to the column base, the current LIFTS him — `jump` (launch) layered with a
 *  procedural buoyant-arc (slow tall vertical lerp up + ease back, ~3s, much
 *  floatier than the forest bounce), and on the way down `fall` (gentle
 *  weightless descent). Updraft-ride SFX (#1) through the lift; faint post.fluid
 *  nudge. Calm baseline: the column's bubble/ink-streaks scroll up continuously
 *  (handled by the background updraft layer), no SFX, no Cosmo movement. */
class UpdraftCurrent implements InteractableHandle {
  readonly id = 'updraft-current';
  readonly anchor: { x: number; y: number; z: number };
  readonly range = 2.2;
  readonly nature = 'play' as const;
  private timeS = 0;
  private liftElapsed = -1; // -1 = idle; >=0 = mid-arc
  private liftBaseY = 0;
  private cosmoRef: CosmoV2Rig | null = null;
  private readonly liftDurationS = 3.0;
  private readonly liftHeight = 1.6; // tall, floaty — counterpoint to the snappy bounce

  constructor(room: SubstrateCtx['room']) {
    this.anchor = { x: 0, y: 0, z: -1.6 };
    void room;
  }

  update(dt: number, _u: GlobalUniforms): void {
    this.timeS += dt;
    // Drive the procedural buoyant-arc when active. The substrate anim director
    // will own this once it lands; until then this bridge makes the lift read.
    if (this.liftElapsed >= 0 && this.cosmoRef) {
      this.liftElapsed += dt;
      const t = Math.min(1, this.liftElapsed / this.liftDurationS);
      // ease-out-in arc: rise smoothly, hang, ease back down (floaty, not snappy).
      const arc = Math.sin(t * Math.PI); // 0→1→0 over the lift
      this.cosmoRef.root.position.y = this.liftBaseY + arc * this.liftHeight;
      if (t >= 1) {
        this.cosmoRef.root.position.y = this.liftBaseY;
        this.liftElapsed = -1;
        this.cosmoRef = null;
      }
    }
  }

  onUse(cosmo: CosmoV2Rig, api?: UseApi): void {
    if (this.liftElapsed >= 0) return; // already mid-ride — don't restack
    // v2.10.2 — the painted `jump` carries the lift (CosmoAgent owns
    // root.position, so the old procedural arc never showed).
    api?.playClip('jump', { holdS: 3.2 });
    api?.sfx('jump');
    this.cosmoRef = cosmo;
    this.liftBaseY = cosmo.root.position.y;
    this.liftElapsed = 0;
  }


  dispose(): void {
    this.cosmoRef = null;
  }
}

function inkOceanInteractables(ctx: SubstrateCtx): InteractableHandle[] {
  if (ctx.room.id === 'light-shafts') {
    return [new KelpOrgan(ctx.room), new FloatTap(ctx.room)];
  }
  if (ctx.room.id === 'the-trench') {
    return [new UpdraftCurrent(ctx.room)];
  }
  return [];
}

/* ════════════════════════════════════════════════════════════════════════
 * AUDIO — room-keyed submerged bed, routed through AudioFFTBridge at 0.45 base
 * volume (per the default audio driver). The per-room bed is declared in
 * rooms.json (`audioBed`), so the substrate's DefaultAudio swaps it on
 * room-enter; this handle exists so a contributor sees the registration shape
 * (mirrors the forest reference's ForestAudio no-op-bridge pattern).
 *   light-shafts → ink-ocean-shafts.mp3 (upper-water drone)
 *   the-trench   → ink-ocean-trench.mp3 (deep-abyss drone, lower register)
 * ════════════════════════════════════════════════════════════════════════ */

/* No `audio` driver is exported: the substrate's DefaultAudio swaps to the
 * room's `audioBed` (ink-ocean-shafts / -trench). A custom audio driver would
 * REPLACE DefaultAudio rather than run alongside it — the earlier no-op stub
 * silently bypassed the bed swap (live UAT 2026-06-07). Event SFX belong on the
 * SFX-emit hook, not on a music driver that shadows the bed. */

/* ════════════════════════════════════════════════════════════════════════
 * TRANSITIONS — Room↔Room only (single Area, so areaToArea omitted;
 * universeToUniverse omitted → substrate default portal, hue from arrival).
 *
 * Thin biome-blend override (2.6s, within the 1.5–3.0s window) that drives the
 * VERTICAL camera drift: down on `sink-down` (light-shafts → the-trench), up on
 * `rise-up` (the-trench → light-shafts), tinted with the area's ink-aubergine
 * pathExperience.ambient. Matches the forest's "override exactly one path"
 * ratio — override the descent flavour, inherit everything else. On rise-up the
 * surface-call SFX (#3) bridges the beds; on sink-down the sonar-ping fades in.
 * ════════════════════════════════════════════════════════════════════════ */

class DriftTransition implements TransitionDriver {
  private readonly durationS = 2.6;
  private readonly direction: 1 | -1; // -1 = sink (down), +1 = rise (up)

  constructor(_ctx: TransitionCtx, fromRoomId: string, _toRoomId: string) {
    // sink-down departs light-shafts; rise-up departs the-trench.
    this.direction = fromRoomId === 'light-shafts' ? -1 : 1;
    void _ctx;
    void _toRoomId;
  }

  run(_dt: number): Promise<void> {
    return new Promise<void>((resolve) => {
      const start = performance.now();
      const tick = (): void => {
        const elapsed = (performance.now() - start) / 1000;
        // Runtime-wirer drives the vertical camera drift from `this.direction`
        // here (down on sink, up on rise) over the biome-blend, ink-aubergine
        // tint. Cosmo's position is set at t=0.5 so he settles into neutral
        // buoyancy with the new mood already resolving (biome-blend contract).
        void this.direction;
        if (elapsed >= this.durationS) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  dispose(): void {
    /* fire-and-forget; the rAF chain unwinds on resolve. No GPU resources. */
  }
}

function inkOceanRoomToRoom(
  ctx: TransitionCtx,
  fromRoomId: string,
  toRoomId: string,
): TransitionDriver {
  return new DriftTransition(ctx, fromRoomId, toRoomId);
}

/* ── default export ──────────────────────────────────────────────────────── */

const inkOceanBehavior: UniverseBehavior = {
  background: inkOceanBackground, // REQUIRED — biomeKey:null on every room.
  arrival: inkOceanArrival,
  inhabitants: inkOceanInhabitants,
  interactables: inkOceanInteractables,
  // audio omitted — DefaultAudio swaps the room's `audioBed` (see note above).
  transitions: {
    roomToRoom: inkOceanRoomToRoom,
    // areaToArea omitted — single area.
    // universeToUniverse omitted — substrate default portal, hue from arrival (0.55).
  },
};

export default inkOceanBehavior;
