/**
 * shareCardOverlay.ts — Sprint 13C
 *
 * DOM-based modal overlay that appears when a synesthesia-peak fires (or when
 * the user explicitly hits "share". The overlay is built with vanilla DOM —
 * Phaser deliberately doesn't render it because:
 *   • we want native iOS share-sheet integration (not pixel-perfect);
 *   • copy-to-clipboard requires a real <button> inside a user-gesture event;
 *   • dismiss-on-tap-outside is much cheaper as a global click listener than
 *     re-implementing it in Phaser.
 *
 * Styling: glassmorph, matches the v0.8.0 HUD palette (faded-rose +
 * pop-magenta + saffron). All styles inlined so we don't drag a CSS file
 * dependency into the rebuild.
 *
 * Auto-dismiss: 8 s no-interaction → fade out + remove.
 */

import type { CaptureResult } from './captureScreen';

export interface ShareCardData {
  capture: CaptureResult;
  trackName: string;
  biomeLabel: string;
  combo: number;
  /** Final share URL (already includes `?seed=` from urlSeed.ts). */
  shareUrl: string;
  /** Suggested filename for "Save to Photos". */
  filename: string;
}

const AUTO_DISMISS_MS = 8000;

let activeOverlay: HTMLElement | null = null;
let dismissTimer = 0;

export function showShareCard(data: ShareCardData): void {
  // Idempotent — replace any existing card with the new data.
  hideShareCard();

  const root = document.createElement('div');
  root.setAttribute('data-cosmos-share-card', '');
  applyStyles(root, {
    position: 'fixed',
    inset: '0',
    display: 'grid',
    placeItems: 'center',
    zIndex: '9999',
    background: 'rgba(8, 4, 18, 0.55)',
    backdropFilter: 'blur(8px)',
    fontFamily:
      '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    color: '#f5edd8',
    opacity: '0',
    transition: 'opacity 280ms ease',
  });

  // Click-on-backdrop dismiss (but ignore clicks bubbling from inner card).
  root.addEventListener('click', (ev) => {
    if (ev.target === root) hideShareCard();
  });

  const card = document.createElement('div');
  applyStyles(card, {
    width: 'min(92vw, 380px)',
    background: 'linear-gradient(160deg, rgba(38, 22, 60, 0.92), rgba(20, 10, 32, 0.92))',
    borderRadius: '24px',
    border: '1px solid rgba(245, 237, 216, 0.18)',
    boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255, 138, 203, 0.18)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  });

  // Preview image
  const img = document.createElement('img');
  img.src = data.capture.url;
  img.alt = `Zorp's Universe peak — ${data.trackName}`;
  applyStyles(img, {
    width: '100%',
    aspectRatio: '9 / 16',
    objectFit: 'cover',
    borderRadius: '14px',
    background: '#1a1330',
  });
  card.appendChild(img);

  // Header row — track + biome
  const header = document.createElement('div');
  applyStyles(header, { display: 'flex', flexDirection: 'column', gap: '4px' });
  const trackEl = document.createElement('div');
  applyStyles(trackEl, {
    fontWeight: '600',
    fontSize: '18px',
    letterSpacing: '-0.01em',
  });
  trackEl.textContent = data.trackName;
  const biomeEl = document.createElement('div');
  applyStyles(biomeEl, {
    fontSize: '13px',
    opacity: '0.7',
    fontVariantNumeric: 'tabular-nums',
  });
  biomeEl.textContent = `${data.biomeLabel} · combo ${data.combo}`;
  header.appendChild(trackEl);
  header.appendChild(biomeEl);
  card.appendChild(header);

  // Buttons row.
  const buttons = document.createElement('div');
  applyStyles(buttons, {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  });

  const saveBtn = makeButton('Save to Photos', 'primary');
  saveBtn.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = data.capture.url;
    a.download = data.filename;
    a.click();
  });

  const copyBtn = makeButton('Copy share link', 'ghost');
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(data.shareUrl);
      flashLabel(copyBtn, 'Copied!');
    } catch {
      // Fallback: show the URL in the button so user can long-press copy.
      flashLabel(copyBtn, data.shareUrl);
    }
  });

  buttons.appendChild(saveBtn);
  buttons.appendChild(copyBtn);
  card.appendChild(buttons);

  // Dismiss row.
  const dismiss = makeButton('Dismiss', 'subtle');
  applyStyles(dismiss, { width: '100%' });
  dismiss.addEventListener('click', hideShareCard);
  card.appendChild(dismiss);

  root.appendChild(card);
  document.body.appendChild(root);
  activeOverlay = root;

  // Trigger the fade-in on the next paint.
  requestAnimationFrame(() => {
    root.style.opacity = '1';
  });

  // Auto-dismiss timer; reset every time the user touches the card so
  // engagement extends the visible time.
  scheduleDismiss();
  card.addEventListener('pointerdown', scheduleDismiss);
}

export function hideShareCard(): void {
  if (!activeOverlay) return;
  const node = activeOverlay;
  activeOverlay = null;
  clearTimeout(dismissTimer);
  node.style.opacity = '0';
  setTimeout(() => {
    node.parentNode?.removeChild(node);
  }, 320);
}

/**
 * Tiny "Day X in de trip" pill — used by dailyStreak.ts for non-modal feedback.
 * Auto-removes after `displayMs`.
 */
export function showStreakPill(text: string, displayMs = 4000): void {
  const pill = document.createElement('div');
  pill.setAttribute('data-cosmos-streak-pill', '');
  applyStyles(pill, {
    position: 'fixed',
    top: '12px',
    left: '50%',
    transform: 'translateX(-50%) translateY(-8px)',
    background: 'rgba(20, 10, 32, 0.78)',
    border: '1px solid rgba(255, 138, 203, 0.28)',
    color: '#f5edd8',
    padding: '8px 16px',
    borderRadius: '999px',
    fontFamily:
      '"JetBrains Mono", "SF Mono", monospace',
    fontSize: '13px',
    letterSpacing: '0.04em',
    backdropFilter: 'blur(6px)',
    zIndex: '9998',
    opacity: '0',
    transition: 'opacity 280ms ease, transform 280ms ease',
    pointerEvents: 'none',
  });
  pill.textContent = text;
  document.body.appendChild(pill);
  requestAnimationFrame(() => {
    pill.style.opacity = '1';
    pill.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    pill.style.opacity = '0';
    pill.style.transform = 'translateX(-50%) translateY(-8px)';
    setTimeout(() => pill.parentNode?.removeChild(pill), 320);
  }, displayMs);
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

function scheduleDismiss(): void {
  clearTimeout(dismissTimer);
  dismissTimer = window.setTimeout(hideShareCard, AUTO_DISMISS_MS);
}

function makeButton(label: string, variant: 'primary' | 'ghost' | 'subtle'): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  const base: Record<string, string> = {
    border: '0',
    borderRadius: '12px',
    padding: '12px 14px',
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 200ms ease, transform 120ms ease',
  };
  if (variant === 'primary') {
    Object.assign(base, {
      background: 'linear-gradient(140deg, #ff8acb, #f7d36a)',
      color: '#160a26',
      fontWeight: '600',
    });
  } else if (variant === 'ghost') {
    Object.assign(base, {
      background: 'rgba(245, 237, 216, 0.08)',
      color: '#f5edd8',
      border: '1px solid rgba(245, 237, 216, 0.22)',
    });
  } else {
    Object.assign(base, {
      background: 'transparent',
      color: 'rgba(245, 237, 216, 0.6)',
    });
  }
  applyStyles(btn, base);
  btn.addEventListener('pointerdown', () => {
    btn.style.transform = 'scale(0.97)';
  });
  btn.addEventListener('pointerup', () => {
    btn.style.transform = 'scale(1)';
  });
  btn.addEventListener('pointerleave', () => {
    btn.style.transform = 'scale(1)';
  });
  return btn;
}

function flashLabel(btn: HTMLButtonElement, text: string): void {
  const original = btn.textContent;
  btn.textContent = text;
  setTimeout(() => {
    btn.textContent = original;
  }, 1500);
}

function applyStyles(el: HTMLElement, styles: Record<string, string>): void {
  for (const [k, v] of Object.entries(styles)) {
    (el.style as unknown as Record<string, string>)[k] = v;
  }
}
