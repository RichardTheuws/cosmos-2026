/**
 * InteractionDirector — Wave 27 (2026-09-05) — Chapter 1: the clearing comes alive.
 *
 * The substrate-side counterpart of the legacy Phaser `InteractionManager`.
 * It closes the loop the Wave-21 contract left open: `InteractableHandle.onUse`
 * was declared, authored by the forest, and never called by anything.
 *
 *   tap → pickOnScreen(projected anchors) → CosmoAgent.walkTo(anchor, 'use')
 *       → on arrival: handle.onUse(rig, UseApi)  (named clip + sound)
 *
 * Plus curiosity: after `CURIOSITY_IDLE_S` without input Cosmo picks an
 * interactable in the room himself and goes to use it — he lives whether or
 * not you watch (NORTH-STAR §1). This replaces the trampoline-only
 * "show, don't tell" demo loop on the substrate path.
 *
 * Ownership rules (the v2.2.4 / S3 scars):
 *   - The director never touches root.position; CosmoAgent owns it. We only
 *     call walkTo / useClip / bounce.
 *   - Interactables are re-read from the loader every tick, so a room switch
 *     mid-walk can't strand a stale handle: the arrival callback checks the
 *     handle is still mounted before calling onUse.
 */
import * as THREE from 'three';
import type { CosmoAgent } from '../phaser/entities/CosmoAgent';
import type { InteractableHandle, UseApi } from './contracts/BehaviorContract';
import { pickOnScreen, type ScreenPoint } from './pickOnScreen';
import {
  choose, createInnerState, idleWaitFor, onPet, onVisit, paceFor, tickInner, wantsSleep,
  type InnerState,
} from './innerLife';
import { restoredEnergy, restoredZin } from './clock';
import { readMemory, writeMemory } from './StatePersistence';

/** Persisted shape of the inner life (Wave 28 system 3). */
interface SavedInner {
  energy: number;
  zin: number;
  affection: number;
  savedAt: number;
}

/** Minimum gap between two self-initiated visits. */
export const CURIOSITY_COOLDOWN_S = 9;
/** First self-initiated visit after the visitor wakes Cosmo (show, don't tell). */
export const CURIOSITY_FIRST_S = 3;
/** Sleeping in place (no resting place in the room) lasts this long. */
export const SLEEP_IN_PLACE_S = 14;

export interface InteractionDirectorDeps {
  cosmoAgent: CosmoAgent;
  camera: THREE.Camera;
  /** Live read of the current room's interactables (SubstrateLoader). */
  interactables: () => readonly InteractableHandle[];
  /** SFX one-shot by name (sfxBus). Injected so tests need no Howler. */
  playSfx: (name: string) => void;
  viewportW: () => number;
  viewportH: () => number;
  /** Optional hook when a tap lands on an interactable (kaleido nudge etc). */
  onPicked?: (handle: InteractableHandle) => void;
}

export class InteractionDirector {
  private readonly deps: InteractionDirectorDeps;
  private readonly scratch = new THREE.Vector3();
  private t = 0;
  private lastInputT = 0;
  private awake = false;
  private nextCuriosityAt = Infinity;
  private lastUsedId: string | null = null;
  private readonly api: UseApi;
  /** Wave 28 — system 2. What he wants; read him from what he does. */
  readonly inner: InnerState = InteractionDirector.restoreInner();
  private sleepingInPlace = false;
  private saveAccS = 0;
  /** Wave 28.1 — when he next turns to you (affection made visible). */
  private nextGreetAt = Infinity;
  private greetedOnWake = false;

  /** He is the same Cosmo you left: energy and appetite come back with the
   *  hours you were away (never lowered), affection is remembered as-is. */
  private static restoreInner(): InnerState {
    const s = createInnerState();
    const saved = readMemory<SavedInner | null>('cosmo.inner', null);
    if (!saved) return s;
    const away = Date.now() - (saved.savedAt || Date.now());
    s.energy = restoredEnergy(saved.energy, away);
    s.zin = restoredZin(saved.zin, away);
    s.affection = saved.affection;
    return s;
  }

  private saveInner(): void {
    const { energy, zin, affection } = this.inner;
    writeMemory('cosmo.inner', { energy, zin, affection, savedAt: Date.now() } as SavedInner);
  }

  constructor(deps: InteractionDirectorDeps) {
    this.deps = deps;
    this.api = {
      playClip: (name, opts) => this.deps.cosmoAgent.useClip(name, opts),
      sfx: (name) => this.deps.playSfx(name),
    };
  }

  /** The visitor pet him (long-hold on Cosmo). */
  notePet(): void {
    onPet(this.inner);
    this.noteInput();
  }

  /** Any pointer activity — resets the curiosity clock. */
  noteInput(): void {
    this.lastInputT = this.t;
    if (!this.awake) {
      this.awake = true;
      this.nextCuriosityAt = this.t + CURIOSITY_FIRST_S;
    }
  }

  /**
   * Tap in NDC. Returns true when an interactable took the tap (the legacy
   * InteractionManager then skips its trampoline raycast).
   */
  onTap(ndcX: number, ndcY: number): boolean {
    this.noteInput();
    const handles = this.deps.interactables();
    if (handles.length === 0) return false;
    const w = Math.max(1, this.deps.viewportW());
    const h = Math.max(1, this.deps.viewportH());
    const pick = pickOnScreen(this.project(handles), ndcX, ndcY, undefined, w / h);
    if (!pick) return false;
    const handle = handles.find((x) => x.id === pick.id);
    if (!handle) return false;
    const agent = this.deps.cosmoAgent;
    if (agent.paused) return false; // onboarding owns Cosmo; let the tap fall through
    if (agent.isBusy) return true; // took the tap, but Cosmo is mid-moment
    this.deps.onPicked?.(handle);
    this.visit(handle, true);
    return true;
  }

  /** Per-frame. Inner life + the curiosity clock. */
  tick(dt: number): void {
    this.t += dt;
    const agent = this.deps.cosmoAgent;
    tickInner(this.inner, dt, agent.isBusy);
    if ((this.saveAccS += dt) > 10) { this.saveAccS = 0; this.saveInner(); }
    if (this.sleepingInPlace && !agent.isBusy) {
      // He woke up from a sleep-in-place: rested, but not as well as a nap-cap.
      this.sleepingInPlace = false;
      this.inner.asleep = false;
      this.inner.energy = Math.max(this.inner.energy, 0.6);
    }
    if (!this.awake || this.t < this.nextCuriosityAt) return;
    if (agent.paused) {
      // Onboarding still owns Cosmo (it resets his state when it hands over);
      // the first "show, don't tell" beat waits until he is really ours.
      this.nextCuriosityAt = this.t + 1;
      return;
    }
    if (agent.isBusy) {
      this.nextCuriosityAt = this.t + 2;
      return;
    }

    // Affection, made visible (Wave 28.1). He remembers you: on the first
    // free moment after waking, a Cosmo who likes you turns and waves; while
    // you stay, every ~40–70 s he looks over and winks or waves — more often
    // the more he likes you. Never a number, never a meter.
    if (!this.greetedOnWake) {
      this.greetedOnWake = true;
      if (this.inner.affection > 0.65) {
        agent.useClip('wave', { holdS: 2.2 });
        this.deps.playSfx('cosmo-coo-1');
        this.nextGreetAt = this.t + 40;
        this.nextCuriosityAt = this.t + 4;
        return;
      }
      this.nextGreetAt = this.t + 60;
    } else if (this.t >= this.nextGreetAt) {
      const a = this.inner.affection;
      if (a > 0.6 && this.t - this.lastInputT < 45) {
        agent.useClip(a > 0.8 ? 'wave' : 'wink', { holdS: a > 0.8 ? 2.2 : 1.4 });
        if (a > 0.8) this.deps.playSfx(['cosmo-coo-1', 'cosmo-coo-2', 'cosmo-coo-3'][Math.floor(Math.random() * 3)]);
        this.nextGreetAt = this.t + 70 - 30 * Math.min(1, (a - 0.6) / 0.4);
        this.nextCuriosityAt = this.t + 4;
        return;
      }
      this.nextGreetAt = this.t + 30;
    }

    const handles = this.deps.interactables();
    const candidates = handles.map((h) => ({ id: h.id, nature: h.nature ?? ('play' as const) }));

    // Sleepy: the resting place if the room has one, else sleep where he stands.
    if (wantsSleep(this.inner) && !this.inner.asleep) {
      const pick = choose(this.inner, candidates);
      const handle = pick ? handles.find((h) => h.id === pick.id) : undefined;
      if (handle) {
        this.visit(handle, false);
      } else {
        this.inner.asleep = true;
        this.sleepingInPlace = true;
        agent.useClip('petted', { loop: true, holdS: SLEEP_IN_PLACE_S });
      }
      this.nextCuriosityAt = this.t + SLEEP_IN_PLACE_S + 4;
      return;
    }

    // Only when the visitor has gone quiet (or right after waking, for the
    // first "show, don't tell" beat). How long "quiet" is depends on his zin.
    const quietFor = this.t - this.lastInputT;
    const firstBeat = this.lastUsedId === null;
    const wait = idleWaitFor(this.inner);
    if (!firstBeat && quietFor < wait) {
      this.nextCuriosityAt = this.lastInputT + wait;
      return;
    }
    const pick = choose(this.inner, candidates);
    const handle = pick ? handles.find((h) => h.id === pick.id) : undefined;
    if (!handle) {
      this.nextCuriosityAt = this.t + CURIOSITY_COOLDOWN_S;
      return;
    }
    this.visit(handle, false);
    this.nextCuriosityAt = this.t + CURIOSITY_COOLDOWN_S + Math.random() * 6;
  }

  /** Walk Cosmo to the handle and use it on arrival. */
  visit(handle: InteractableHandle, askedByYou = false): void {
    const agent = this.deps.cosmoAgent;
    if (agent.paused) return;
    const arrival = handle.arrival ?? 'use';
    const nature = handle.nature ?? 'play';
    this.lastUsedId = handle.id;
    // Tired = a trudge, eager = a hurry. Set before walkTo computes its time.
    agent.walkPace = paceFor(this.inner);
    agent.walkTo(handle.anchor.x, handle.anchor.z, arrival, () => {
      // Still mounted? (room may have switched while walking)
      if (!this.deps.interactables().includes(handle)) return;
      onVisit(this.inner, handle.id, nature, askedByYou);
      this.saveInner();
      handle.onUse(agent.rig, this.api);
    });
  }

  private project(handles: readonly InteractableHandle[]): ScreenPoint[] {
    const cam = this.deps.camera;
    return handles.map((h) => {
      // Aim a little above the anchor: items sit on the ground, fingers aim
      // at their painted body.
      this.scratch.set(h.anchor.x, h.anchor.y + 0.5, h.anchor.z).project(cam);
      return { id: h.id, x: this.scratch.x, y: this.scratch.y, z: this.scratch.z };
    });
  }
}
