/**
 * touchOverlay.ts — Sprint 13A simplified.
 *
 * The platformer-era d-pad / jump / bomb overlay is gone — BeatScene reads
 * pure gestures (tap / swipe / pinch / hold / longHold) directly off the
 * `InputController` gesture-bus, so an on-screen control surface is no longer
 * needed for input.
 *
 * What we keep is a *light disclaimer pill* that fades in once on the first
 * touch device boot, then auto-dismisses after 6 seconds. The pill explains
 * the rhythm-trip in two lines:
 *
 *      Tik Cosmo aan op het beat.
 *      Hou ingedrukt voor de schokgolf.
 *
 * No buttons, no virtual input, no DOM-lifecycle drama. Mobile/desktop both
 * see the same gesture-bus; the disclaimer only mounts on touch+narrow.
 */

import type { InputController } from '../core/inputController';
import { isTouchDevice } from '../core/deviceDetect';

// English only (NORTH-STAR §1 — all in-game text is English). This is the
// LEGACY beat-game disclaimer; in substrate/dweller mode it is not mounted at
// all (main.ts gates it), the dweller's first read is the chart's soft wenk.
const DISCLAIMER_LINES = [
  'Tap Zorp on the beat.',
  'Hold for the shockwave.',
] as const;

const AUTO_DISMISS_MS = 6000;

export class TouchOverlay {
  private root: HTMLDivElement | null = null;
  private active = false;

  /** Sprint 13A — `input` is currently unused (BeatScene reads gestures off
   *  the bus directly), but we keep the param so future `setVirtualGesture`
   *  callers can push synthetic taps through this overlay. The leading `_`
   *  satisfies tsc's noUnusedParameters. */
  constructor(_input: InputController) {
    void _input;
  }

  /** Returns `true` if the overlay actually attached. */
  attachIfTouchDevice(): boolean {
    if (this.active) return true;
    if (!isTouchDevice()) return false;
    this.attach();
    return true;
  }

  private attach(): void {
    const root = document.createElement('div');
    root.id = 'touch-overlay';
    root.setAttribute('role', 'note');
    root.setAttribute('aria-label', "Zorp's Universe onboarding hint");
    Object.assign(root.style, {
      position: 'fixed',
      left: '50%',
      bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
      transform: 'translateX(-50%)',
      padding: '10px 18px',
      maxWidth: '88vw',
      pointerEvents: 'none',
      zIndex: '60',
      background: 'rgba(61, 46, 74, 0.72)',
      color: 'rgba(245, 237, 216, 0.92)',
      backdropFilter: 'blur(6px)',
      borderRadius: '14px',
      fontFamily: '"Cormorant Garamond", Georgia, serif',
      fontStyle: 'italic',
      fontSize: '15px',
      letterSpacing: '0.01em',
      lineHeight: '1.4',
      textAlign: 'center',
      opacity: '0',
      transition: 'opacity 320ms ease-out',
    } satisfies Partial<CSSStyleDeclaration>);

    for (const line of DISCLAIMER_LINES) {
      const div = document.createElement('div');
      div.textContent = line;
      root.appendChild(div);
    }

    document.body.appendChild(root);
    this.root = root;
    this.active = true;

    requestAnimationFrame(() => {
      if (this.root) this.root.style.opacity = '1';
    });
    window.setTimeout(() => this.detach(), AUTO_DISMISS_MS);
  }

  detach(): void {
    if (!this.active || !this.root) return;
    this.root.style.opacity = '0';
    const node = this.root;
    window.setTimeout(() => node.remove(), 360);
    this.root = null;
    this.active = false;
  }
}
