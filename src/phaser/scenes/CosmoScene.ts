/**
 * CosmoScene — Sprint 15B + 15D
 *
 * Replaces BeatScene. The Phaser layer is now pure HUD overlay (vibe-meter ring
 * around the projected Cosmo position + tiny altitude-counter in the corner).
 * Three.js handles the 3D Cosmo render via CosmoStage; obstacles + transient
 * platforms also live in that Three.js scene.
 *
 * Architecture
 * ────────────
 *   main.ts owns:
 *     - ParallaxScene (Three.js, post-FX)
 *     - CosmoStage    (Three.js, no post-FX, on top of parallax)
 *     - CosmoAgent    (state-machine, attaches to CosmoStage.group)
 *     - ObstacleManager (spawns into CosmoStage.scene)
 *
 *   CosmoScene owns:
 *     - VibeMeter (Phaser.Graphics ring)
 *     - InteractionManager (gestures → CosmoAgent + ObstacleManager)
 *     - DeepTripMode (auto-fires on VibeMeter.fullEdge)
 *     - Altitude counter (DOM)
 *     - Sprint 15D: OnboardingDirector + NebulaPortal + HintGlyph for the
 *       first-3-seconds magic-moment. The DOM "veeg omhoog" hint is replaced
 *       by a canvas-drawn HintGlyph that anchors to the closest obstacle.
 *
 * NOTE: We keep AutoVJ-like agency *inside* CosmoAgent itself (random-event
 * tick is the equivalent of AutoVJ.notifyPlayerInteraction). The original
 * AutoVJ is stripped — its idle-driven yawn pattern doesn't suit a
 * weirdo-runner where Cosmo is ALWAYS doing something on his own.
 */
import Phaser from 'phaser';
import * as THREE from 'three';
import type { GlobalUniforms } from '../../core/globalUniforms';
import type { InputController } from '../../core/inputController';
import type { Progression } from '../../core/progression';
import type { AudioFFTBridge } from '../../audio/audioFFTBridge';
import type { CosmoAgent } from '../entities/CosmoAgent';
import type { ObstacleManager } from '../entities/ObstacleManager';
import type { CosmoStage } from '../../three/cosmoStage';
import { InteractionManager } from '../entities/InteractionManager';
import { DeepTripMode } from '../entities/DeepTripMode';
import { VibeMeter } from '../entities/VibeMeter';
import { OnboardingDirector, type OnboardingHooks } from '../entities/OnboardingDirector';
import { NebulaPortal } from '../entities/NebulaPortal';
import { HintGlyph } from '../entities/HintGlyph';
import { sfx, COSMO_COO_POOL } from '../../audio/sfxBus';
import type { TrampolineSpots } from '../entities/TrampolineSpots';

interface SceneInitData {
  input: InputController;
  uniforms: GlobalUniforms;
  audioBridge: AudioFFTBridge;
  progression: Progression;
  cosmoAgent: CosmoAgent;
  cosmoStage: CosmoStage;
  obstacles: ObstacleManager;
  /** Sprint 17D — fixed trampoline-spots in the active biome. Owned by main.ts. */
  trampolineSpots: TrampolineSpots;
  /** Sprint 17D — mutable event-bag main.ts pre-wires to forward CosmoAgent
   *  onBounce / onPet to the InteractionManager (which is constructed inside
   *  this scene's create() and didn't exist when CosmoAgent was built). */
  agentEventShim: {
    onBounce?: (info: { rollHallucination: boolean }) => void;
    onPet?: () => void;
    /** Wave 27 — substrate InteractionDirector tap claim (see InteractionManagerHooks). */
    onTap?: (ndcX: number, ndcY: number) => boolean;
  };
  version: string;
}

export class CosmoScene extends Phaser.Scene {
  private inputCtl!: InputController;
  private uniforms!: GlobalUniforms;
  private audioBridge!: AudioFFTBridge;
  private progression!: Progression;
  private cosmoAgent!: CosmoAgent;
  private cosmoStage!: CosmoStage;
  private obstacles!: ObstacleManager;
  private interactions!: InteractionManager;
  private deepTrip!: DeepTripMode;
  private trampolineSpots!: TrampolineSpots;
  private agentEventShim!: SceneInitData['agentEventShim'];

  private vibeMeter!: VibeMeter;

  // ── Sprint 15D — onboarding magic-moment ─────────────────────────────────
  private onboarding: OnboardingDirector | null = null;
  private nebulaPortal: NebulaPortal | null = null;
  private firstHint: HintGlyph | null = null;
  /** Listener-cleanup for the onboarding gesture-forward. */
  private offOnboardingGesture: (() => void) | null = null;
  /** Eased portal-arrival scale (0.1 → 1.0) applied to CosmoStage.group. */
  private cosmoArrivalScale = 1;
  private cosmoArrivalUntilT = -Infinity;
  private cosmoArrivalStartT = 0;
  /** Reusable Vector3 for obstacle-projection — avoids per-frame allocs. */
  private projTmp = new THREE.Vector3();

  constructor() {
    super({ key: 'CosmoScene' });
  }

  init(data: SceneInitData): void {
    this.inputCtl = data.input;
    this.uniforms = data.uniforms;
    this.audioBridge = data.audioBridge;
    this.progression = data.progression;
    this.cosmoAgent = data.cosmoAgent;
    this.cosmoStage = data.cosmoStage;
    this.obstacles = data.obstacles;
    this.trampolineSpots = data.trampolineSpots;
    this.agentEventShim = data.agentEventShim;
  }

  create(): void {
    // Vibe-meter (Phaser graphics) follows projected Cosmo screen position.
    this.vibeMeter = new VibeMeter(this);

    // Build the rest of the gameplay-stack now that we have a Phaser.Scene.
    // Sprint 17D — pass the TrampolineSpots + camera + viewport hooks so
    // the manager can raycast taps and project the long-hold pet target.
    this.interactions = new InteractionManager(
      this.inputCtl,
      this.cosmoAgent,
      this.obstacles,
      this.vibeMeter,
      this.cosmoStage.scene,
      {
        spots: this.trampolineSpots,
        camera: this.cosmoStage.camera,
        projectToScreen: (world, w, h) => this.cosmoStage.projectToScreen(world, w, h),
        viewportW: () => this.scale.width,
        viewportH: () => this.scale.height,
        onPetEngaged: () => {
          // Pet always reads as a saffron flush + bonus chirp — visible reward
          // for the player who lingered. The pet-affect visuals (blush + antenne
          // tilt) are handled inside CosmoAgent; the host adds the audio/post-FX.
          this.uniforms.kaleidoTrigger = Math.min(1, this.uniforms.kaleidoTrigger + 0.25);
          sfx.play('bonus');
        },
        onSpotTapped: () => {
          // Light kaleido nudge so the player feels the tap landed before
          // Cosmo even finishes walking to the spot.
          this.uniforms.kaleidoTrigger = Math.min(1, this.uniforms.kaleidoTrigger + 0.1);
        },
        // Wave 27 — the shim is filled in by main.ts once the substrate
        // director exists; read it late so the wiring order doesn't matter.
        tapInterceptor: (x, y) => this.agentEventShim.onTap?.(x, y) ?? false,
      },
    );
    this.deepTrip = new DeepTripMode(
      this.uniforms,
      this.audioBridge,
      this.cosmoAgent,
      this.vibeMeter,
    );

    // Sprint 17D — now that the InteractionManager exists, wire the
    // agent-event shim so each onBounce flows into notifyBounce (vibe-gain +
    // 5-bounce DeepTripMode trigger). main.ts already applies the
    // kaleido-spike + maybe-hallucination on the same event.
    this.agentEventShim.onBounce = () => {
      this.interactions.notifyBounce(this.uniforms.time);
    };
    this.agentEventShim.onPet = () => {
      // Pet vibe-gain is awarded inside InteractionManager.armPetTimer;
      // no extra work needed here. Hook reserved for future polish.
    };

    // Wave 21.1 — buildHUD() retired. /play/ is the canonical full-viewport game
    // surface; no version-pill, no altitude-counter, no chrome of any kind.
    // Close the tab to leave; there is no menu.

    // Sprint 15D — magic-moment onboarding. State-machine drives boot-overlay
    // fade, NebulaPortal expand, Cosmo arrival-tween, wave-uncanny + audio
    // stinger, and the first HintGlyph. Pauses ObstacleManager + CosmoAgent
    // until the player completes the first swipe (or auto-demo at 8s).
    this.onboarding = new OnboardingDirector(this.buildOnboardingHooks());
    this.onboarding.start();

    // Forward gestures to the OnboardingDirector first so first-touch +
    // first-swipe drive its state-machine. After COMPLETE the director
    // ignores them; InteractionManager keeps its own gesture-listener for
    // gameplay actions (it attaches independently below).
    this.offOnboardingGesture = this.inputCtl.onGesture((e) => {
      if (this.onboarding?.isActive()) {
        this.onboarding.notifyGesture(e.name, e.dy);
      }
    });
    this.interactions.attach();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup());
  }

  override update(_time: number, deltaMs: number): void {
    const dt = Math.min(0.05, deltaMs / 1000);
    const tNow = this.uniforms.time;

    this.progression.tick();

    // Sprint 15D — drive onboarding state-machine + portal + hint each frame.
    this.onboarding?.update(dt);
    this.nebulaPortal?.update(dt);
    this.firstHint?.update(dt);
    this.applyCosmoArrivalTween(tNow);

    // Per-frame collision + transient-platform fade. We tick these even
    // during onboarding — InteractionManager's gameplay-side spawn happens
    // on swipe (no spawn during AWAIT_TOUCH because gestures go to the
    // director first). Collision-eval cost is sub-microsecond at empty pool.
    this.interactions.update(tNow, this.cosmoAgent.worldX, this.cosmoAgent.worldY);
    // DeepTripMode auto-engages on VibeMeter.fullEdge.
    this.deepTrip.update(dt);

    // Project Cosmo's world-position to screen pixels for the HUD ring.
    const worldPos = this.cosmoAgent.worldPositionVec();
    const screen = this.cosmoStage.projectToScreen(
      worldPos,
      this.scale.width,
      this.scale.height,
    );

    this.vibeMeter.update(screen.x, screen.y, dt);

    // Push uniforms — drives shaders + Three.js camera + post-FX bias.
    this.uniforms.cosmoX = screen.x;
    this.uniforms.cosmoY = screen.y;

    // Wave 21.1 — HUD updates retired (no altitude-counter, no version-pill).
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  // Wave 21.1 — buildHUD/updateAltitude/updateVersionPill retired. The play
  // surface is the canonical full-viewport game; no chrome of any kind.

  private cleanup(): void {
    this.offOnboardingGesture?.();
    this.offOnboardingGesture = null;
    this.interactions.detach();
    this.vibeMeter?.destroy();
    // Sprint 15D — onboarding teardown.
    this.nebulaPortal?.dispose();
    this.nebulaPortal = null;
    this.firstHint?.dispose();
    this.firstHint = null;
    this.onboarding = null;
    // Reset CosmoStage.group scale in case shutdown lands mid-tween.
    this.cosmoStage.group.scale.setScalar(1);
    this.cosmoAgent.paused = false;
    this.obstacles.paused = false;
    this.interactions.paused = false;
    void this.audioBridge;
  }

  // ───────────────────────────────────────────────────────────────────────
  // Sprint 15D — onboarding glue
  // ───────────────────────────────────────────────────────────────────────

  /** Closure-bag passed to OnboardingDirector. Each hook is graceful — if a
   *  collaborator (15A wave-uncanny clip, 15B CosmoAgent, 15C ObstacleManager)
   *  isn't fully wired the hook is a visible-only no-op. */
  private buildOnboardingHooks(): OnboardingHooks {
    return {
      showAwaitTouchUI: () => {
        // /play/index.html paints "tik om te ontwaken" via .is-awaiting class
        // (set 0.6s after page-paint). Director only needs to pause gameplay.
        this.cosmoAgent.paused = true;
        this.obstacles.paused = true;
        // Sprint 17D — also gate trampoline interactions until BONDING ends.
        this.interactions.paused = true;
        // Sprint 17G — keep CosmoAI's no-input timer frozen during the magic
        // moment so the 8s companion-mode countdown does not start running
        // before the player has even touched the screen.
        if (this.cosmoAgent.ai) this.cosmoAgent.ai.paused = true;
      },
      hideBootOverlay: () => {
        document.getElementById('boot')?.classList.add('hidden');
      },
      openPortal: (durationMs) => {
        // The NebulaPortal is the forest-runner's wake-arrival flourish. In
        // substrate dweller-universes there is no forest gameplay (trampoline
        // disposed) and the onboarding state-machine doesn't run the walk/obstacle
        // flow that would close it again — so the rings would open and linger
        // (they leaked across travels via the long-lived CosmoScene, live UAT
        // 2026-06-07). Arrival into dweller-universes is the TravelVeil's job.
        if (this.trampolineSpots.count() === 0) return;
        if (!this.nebulaPortal) {
          this.nebulaPortal = new NebulaPortal(this);
        }
        this.nebulaPortal.open(durationMs);
      },
      closePortal: () => {
        this.nebulaPortal?.close(800);
      },
      spawnCosmoFromPortal: (durationMs) => {
        // Tween CosmoStage.group from scale 0.1 → 1.0 over durationMs. Z-axis
        // tween is approximated by scale (perspective camera makes a small
        // mesh read as "further away") — visually equivalent for the intro.
        this.cosmoArrivalScale = 0.1;
        this.cosmoArrivalStartT = this.uniforms.time;
        this.cosmoArrivalUntilT = this.uniforms.time + durationMs / 1000;
        this.applyCosmoArrivalTween(this.uniforms.time);
      },
      playWaveUncanny: () => {
        // 15A wave-uncanny clip: CosmoAgent.triggerWave plays the 'wave'
        // animation and forces 'looking' state (eyes on camera). This is
        // intentionally too-slow and held — that's the WEIRDO-brief energy:
        // "alsof Cosmo wakker wordt en JOU ontdekt".
        // Temporarily un-pause so the wave clip can tick.
        this.cosmoAgent.paused = false;
        this.cosmoAgent.triggerWave();
      },
      emitHallucinationTrail: () => {
        // 1.0s saffron flush around Cosmo via the existing kaleido-trigger.
        // Post-FX stack handles the chromatic-aberration + bloom for free.
        this.uniforms.kaleidoTrigger = Math.min(1, this.uniforms.kaleidoTrigger + 0.4);
      },
      playGibberishCoo: () => {
        // Sprint 16D fix — 3-syllable kid-alien babble via dedicated
        // ElevenLabs sound-generation variants (cosmo-coo-{1,2,3}). The
        // earlier Sprint 15D mapping reused the Hint-Globe Dutch voice
        // (`globe-l1-1`) — full Dutch sentence, wrong character, broke the
        // WEIRDO-brief. We now pick from a 3-variant pool at random so the
        // BONDING moment never fatigues. See scripts/sprint16d/.
        const pick = COSMO_COO_POOL[Math.floor(Math.random() * COSMO_COO_POOL.length)];
        sfx.play(pick);
      },
      playCosmicChirp: () => {
        // Short cosmic chirp. pickup-bonus is bright, saffron-coloured,
        // ~250ms — fits the brief perfectly.
        sfx.play('bonus');
      },
      pauseObstacleSpawn: () => {
        this.obstacles.paused = true;
        // Sprint 17D — also gate trampoline-tap interactions during the
        // pre-bonding states so the player can't accidentally bounce Cosmo
        // before the magic-moment onboarding completes.
        this.interactions.paused = true;
        if (this.cosmoAgent.ai) this.cosmoAgent.ai.paused = true;
      },
      resumeObstacleSpawn: () => {
        this.obstacles.paused = false;
        this.interactions.paused = false;
        // Sprint 17G — release the AI gate when the WALKING_FIRST_HINT phase
        // begins so CosmoAI starts its no-input watchdog from a clean t=0.
        if (this.cosmoAgent.ai) this.cosmoAgent.ai.paused = false;
      },
      startCosmoWalk: () => {
        // Un-pause the agent so its state-machine can advance into 'walking'
        // on its own (intro 1.2s look already consumed during BONDING wave).
        this.cosmoAgent.paused = false;
        // Sprint 17G — AI watchdog can now begin; mirrors the agent un-pause
        // so applyAI() and the no-input timer come online together.
        if (this.cosmoAgent.ai) this.cosmoAgent.ai.paused = false;
      },
      showFirstHint: () => {
        // The "swipe up" glyph teaches forest-runner gameplay (swipe to clear
        // obstacles). Substrate dweller-universes have no obstacles or
        // trampoline (main.ts disposes the spots for non-forest universes), so
        // the hint must not render — it leaked onto Cosmo's face in
        // dunes/ink-ocean/chart (live UAT 2026-06-07).
        if (this.trampolineSpots.count() === 0) return;
        if (!this.firstHint) {
          this.firstHint = new HintGlyph(this, () => this.firstHintTarget(), 'swipe up');
        }
        this.firstHint.show();
      },
      hideFirstHint: () => {
        this.firstHint?.hide(400);
        this.time.delayedCall(450, () => {
          if (this.firstHint && !this.firstHint.isActive()) {
            this.firstHint = null;
          }
        });
      },
      intensifyHint: () => {
        this.firstHint?.intensify();
      },
      triggerAutoDemoSwipe: () => {
        // AutoVJ-equivalent for first-time players who don't engage. The
        // ObstacleManager already runs at WALKING_FIRST_HINT and CosmoAgent
        // has random-agency, so the world keeps moving. Nothing extra to
        // do — the brief's "demo-swipe-every-4s" is satisfied by the
        // existing 2.8s ObstacleManager cadence + Cosmo's eigen-jump RNG.
      },
      rewardFirstSwipe: () => {
        // VibeMeter +20% + saffron-glow ring pulse + kaleido flush as the
        // visible reward for the first-swipe success.
        this.vibeMeter.gain(0.2);
        this.uniforms.kaleidoTrigger = Math.min(1, this.uniforms.kaleidoTrigger + 0.5);
      },
      spawnCosmoSkipPortal: () => {
        // Return-visit: Cosmo appears directly at full scale, walking-state.
        this.cosmoArrivalScale = 1;
        this.cosmoArrivalUntilT = -Infinity;
        this.cosmoStage.group.scale.setScalar(1);
        this.cosmoAgent.paused = false;
        this.obstacles.paused = false;
        // Sprint 17D — return-visit player gets immediate trampoline access.
        this.interactions.paused = false;
        // Sprint 17G — AI starts fresh on return-visit too.
        if (this.cosmoAgent.ai) this.cosmoAgent.ai.paused = false;
        // Hide the boot-overlay since no portal-stage is showing.
        document.getElementById('boot')?.classList.add('hidden');
      },
      flashMiniPortal: (durationMs) => {
        // Sprint 16F: return-user mini-portal flash. Re-uses NebulaPortal but
        // with a much shorter open-duration. Auto-closes at ~60% so the
        // fade-out overlaps the WALKING_FIRST_HINT entry — feels like a
        // single burst rather than open→hold→close.
        if (!this.nebulaPortal) {
          this.nebulaPortal = new NebulaPortal(this);
        }
        this.nebulaPortal.open(durationMs);
        const closeAfterMs = Math.max(50, durationMs * 0.6);
        const fadeMs = Math.max(120, durationMs * 0.4);
        this.time.delayedCall(closeAfterMs, () => {
          this.nebulaPortal?.close(fadeMs);
        });
      },
    };
  }

  /** Per-frame ease for the portal-arrival scale tween. */
  private applyCosmoArrivalTween(tNow: number): void {
    if (tNow >= this.cosmoArrivalUntilT) {
      if (this.cosmoArrivalScale !== 1) {
        this.cosmoArrivalScale = 1;
        this.cosmoStage.group.scale.setScalar(1);
      }
      return;
    }
    const dur = Math.max(0.001, this.cosmoArrivalUntilT - this.cosmoArrivalStartT);
    const elapsed = tNow - this.cosmoArrivalStartT;
    const t = Math.max(0, Math.min(1, elapsed / dur));
    // Ease-out-cubic.
    const eased = 1 - Math.pow(1 - t, 3);
    const scale = 0.1 + 0.9 * eased;
    this.cosmoArrivalScale = scale;
    this.cosmoStage.group.scale.setScalar(scale);
  }

  /** Target-provider for the HintGlyph — anchors to the closest live
   *  obstacle ahead of Cosmo. Returns null → glyph parks above Cosmo. */
  private firstHintTarget(): { x: number; y: number } | null {
    const obstacles = this.obstacles.liveObstacles();
    let closest: { x: number; group: THREE.Group } | null = null;
    for (const o of obstacles) {
      if (o.x <= this.cosmoAgent.worldX) continue;
      if (!closest || o.x < closest.x) {
        closest = { x: o.x, group: o.group };
      }
    }
    if (closest) {
      this.projTmp.set(
        closest.group.position.x,
        closest.group.position.y + 0.6,
        0,
      );
      const screen = this.cosmoStage.projectToScreen(
        this.projTmp,
        this.scale.width,
        this.scale.height,
      );
      return { x: screen.x, y: screen.y };
    }
    // Fallback: float just above Cosmo's projected position.
    const cosmoWorld = this.cosmoAgent.worldPositionVec();
    const cosmoScreen = this.cosmoStage.projectToScreen(
      cosmoWorld,
      this.scale.width,
      this.scale.height,
    );
    return { x: cosmoScreen.x, y: cosmoScreen.y - 80 };
  }
}
