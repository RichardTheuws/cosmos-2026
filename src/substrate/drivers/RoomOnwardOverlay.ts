/**
 * RoomOnwardOverlay — Wave 25.5 · the room-to-room layer ("Cosmo neemt je mee").
 *
 * The engine already has universe → area → room with the in-app room switch
 * wired; what was missing is the AFFORDANCE to wander DEEPER within a world.
 * Richard's chosen feel: Cosmo leads you on. When the current room has an exit,
 * a soft Cormorant prompt breathes near where Cosmo stands — "follow Cosmo · <the
 * next room>" — and tapping it flows you into that room (via the same travel
 * ceremony as the chart, so the swap is a calm dissolve, not a cut).
 *
 * It is the sibling of WayMoteOverlay (which leads UP to the chart); this one
 * leads ONWARD within a universe. Substrate-owned, mounted per-room by the
 * loader when the room declares an exit. No swipe (that is reserved + was too
 * twitchy) — a deliberate tap only.
 */
import { requestNavigate } from './TravelVeil';

export interface RoomOnwardOptions {
  /** Destination triple (same universe; the next room + its area). */
  universe: string;
  area: string;
  room: string;
  /** Human label for the destination room (English, Cormorant). */
  label: string;
}

export class RoomOnwardOverlay {
  private el: HTMLDivElement | null = null;
  private activating = false;

  constructor(private opts: RoomOnwardOptions) {
    if (typeof document === 'undefined') return;
    this.mount();
  }

  private mount(): void {
    const el = document.createElement('div');
    el.id = 'room-onward';
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `Follow Cosmo onward to ${this.opts.label}`);
    el.tabIndex = 0;
    Object.assign(el.style, {
      position: 'fixed',
      bottom: 'calc(env(safe-area-inset-bottom, 0px) + 84px)',
      left: '50%',
      transform: 'translateX(-50%)',
      maxWidth: '80vw',
      padding: '0.5rem 1.1rem',
      cursor: 'pointer',
      zIndex: '33',
      userSelect: 'none',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      fontFamily: "'Cormorant', Georgia, serif",
      fontStyle: 'italic',
      fontSize: '1.05rem',
      letterSpacing: '0.01em',
      color: 'rgba(245, 237, 216, 0.9)',
      // Soft ink-aubergine pill so it reads on any world, well under the pop budget.
      background: 'rgba(61, 46, 74, 0.46)',
      backdropFilter: 'blur(6px)',
      borderRadius: '14px',
      textShadow: '0 1px 6px rgba(0,0,0,0.5)',
    } as Partial<CSSStyleDeclaration>);
    el.textContent = `follow Cosmo to ${this.opts.label}`;

    // Breathe (the world breathes, it does not shake): a slow opacity sine.
    if (!document.getElementById('room-onward-style')) {
      const style = document.createElement('style');
      style.id = 'room-onward-style';
      style.textContent =
        '@keyframes roomOnwardBreathe{0%,100%{opacity:0.5}50%{opacity:0.85}}' +
        '#room-onward{animation:roomOnwardBreathe 6.5s ease-in-out infinite;transition:opacity .9s ease,transform .9s ease}' +
        '#room-onward:hover,#room-onward:focus-visible{opacity:1!important;outline:none}' +
        // v2.10.3 — after a few seconds the pill recedes to a mote (Richard:
        // "staat altijd heel storend in beeld"). A tap on the mote brings the
        // pill back for a few seconds; a tap on the pill travels.
        '#room-onward.is-mote{opacity:0.45!important;transform:translateX(-50%) scale(0.28);' +
        'color:transparent;text-shadow:none;background:rgba(245,237,216,0.7);border-radius:999px;' +
        'animation:roomOnwardBreathe 6.5s ease-in-out infinite;padding:0.5rem 0.5rem;width:1.1rem;height:1.1rem}';
      document.head.appendChild(style);
    }

    el.addEventListener('click', () => {
      if (el.classList.contains('is-mote')) {
        this.expand();
        return;
      }
      this.activate();
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.activate();
      }
    });

    document.body.appendChild(el);
    this.el = el;
    this.expand();
    // The overlay mounts during boot, behind the wake screen; restart the
    // six seconds on the visitor's first touch so the pill is actually seen.
    window.addEventListener('pointerdown', () => this.expand(), { once: true, passive: true });
  }

  private recedeTimer: number | null = null;

  /** Show the full pill for a few seconds, then recede to a mote. */
  private expand(): void {
    const el = this.el;
    if (!el) return;
    el.classList.remove('is-mote');
    el.setAttribute('aria-label', `Follow Cosmo onward to ${this.opts.label}`);
    if (this.recedeTimer !== null) window.clearTimeout(this.recedeTimer);
    this.recedeTimer = window.setTimeout(() => {
      el.classList.add('is-mote');
      el.setAttribute('aria-label', `Show the way onward to ${this.opts.label}`);
    }, 6000);
  }

  private activate(): void {
    if (this.activating) return;
    this.activating = true;
    requestNavigate({ universe: this.opts.universe, area: this.opts.area, room: this.opts.room });
  }

  dispose(): void {
    if (this.recedeTimer !== null) window.clearTimeout(this.recedeTimer);
    this.el?.remove();
    this.el = null;
  }
}
