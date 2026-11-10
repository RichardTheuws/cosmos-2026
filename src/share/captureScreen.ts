/**
 * captureScreen.ts — Sprint 13C
 *
 * Compose a 1080×1920 portrait share-card by:
 *   1. Drawing the live three.js (`#scene-canvas`) frame
 *   2. Drawing the live phaser (`#game-canvas` <canvas> child) frame on top
 *   3. Painting a glassmorph overlay band with biome + track + combo +
 *      taps-this-session + watermark + URL
 *   4. Optionally compositing a Cosmo crop in the lower band
 *
 * Why a fresh OffscreenCanvas?
 *   - The on-screen canvases are sized to the viewport (varies per device).
 *     A standard 9:16 export ensures TikTok/Instagram present the card without
 *     letterboxing.
 *   - We can't `canvas.toBlob()` on the live three canvas because postprocessing
 *     uses `preserveDrawingBuffer: false` by default — the buffer is empty
 *     after `composer.render()` returns. Solution: redraw both canvases via
 *     `drawImage()` AT THE TIME OF CAPTURE, before the next rAF clears them.
 *     We rely on the caller to invoke this synchronously inside an rAF tick
 *     OR right after a peakEvent in the same animation frame.
 *
 * iPhone Safari note:
 *   Safari clamps `<canvas>` max-dimension at 4096 (≈16M-pixel area). 1080×1920
 *   is well within budget. We do, however, observe a faint banding when scaling
 *   from a high-DPR three canvas; we use `imageSmoothingQuality = 'high'` to
 *   compensate.
 */

const EXPORT_W = 1080;
const EXPORT_H = 1920;

export interface CaptureMeta {
  biomeId: string;
  biomeLabel: string;
  trackName: string;
  combo: number;
  tapCount: number;
  /** Public-facing URL to print on the card (e.g. `https://theuws.com/games/cosmos-2026/`). */
  shareUrl: string;
}

export interface CaptureResult {
  blob: Blob;
  /** Object-URL of `blob`. The caller is responsible for revoking it. */
  url: string;
  width: number;
  height: number;
}

/**
 * Capture the live composite.
 *
 * @param meta Card metadata (biome, combo etc.)
 * @param cosmoImage Optional pre-loaded Cosmo PNG to stamp into the lower band.
 *                   When `undefined`, the card just shows the gameplay frame.
 */
export async function captureScreenshot(
  meta: CaptureMeta,
  cosmoImage?: HTMLImageElement | null,
): Promise<CaptureResult | null> {
  const sceneCanvas = document.getElementById('scene-canvas') as HTMLCanvasElement | null;
  const gameMount = document.getElementById('game-canvas') as HTMLDivElement | null;
  const phaserCanvas = gameMount?.querySelector('canvas') as HTMLCanvasElement | null;

  if (!sceneCanvas) {
    // eslint-disable-next-line no-console
    console.warn('[captureScreen] no #scene-canvas');
    return null;
  }

  const out = document.createElement('canvas');
  out.width = EXPORT_W;
  out.height = EXPORT_H;
  const ctx = out.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Stretch-fit three canvas (preserve aspect via cover, not letterbox).
  drawCover(ctx, sceneCanvas, 0, 0, EXPORT_W, EXPORT_H);

  // 2. Phaser canvas on top — same cover-fit, transparent so post-FX shows through.
  if (phaserCanvas) {
    drawCover(ctx, phaserCanvas, 0, 0, EXPORT_W, EXPORT_H);
  }

  // 3. Bottom band — glassmorph translucent block + text.
  drawCard(ctx, meta);

  // 4. Cosmo crop, lower-left, optional.
  if (cosmoImage) drawCosmoBadge(ctx, cosmoImage);

  // 5. Watermark + URL across the very bottom.
  drawWatermark(ctx, meta.shareUrl);

  return new Promise<CaptureResult | null>((resolve) => {
    out.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        resolve({
          blob,
          url: URL.createObjectURL(blob),
          width: EXPORT_W,
          height: EXPORT_H,
        });
      },
      'image/png',
      0.92,
    );
  });
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

function drawCover(
  ctx: CanvasRenderingContext2D,
  src: HTMLCanvasElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): void {
  const sw = src.width;
  const sh = src.height;
  if (sw === 0 || sh === 0) return;
  const dstAspect = dw / dh;
  const srcAspect = sw / sh;
  let cropW = sw;
  let cropH = sh;
  let cropX = 0;
  let cropY = 0;
  if (srcAspect > dstAspect) {
    cropW = sh * dstAspect;
    cropX = (sw - cropW) / 2;
  } else {
    cropH = sw / dstAspect;
    cropY = (sh - cropH) / 2;
  }
  ctx.drawImage(src, cropX, cropY, cropW, cropH, dx, dy, dw, dh);
}

function drawCard(ctx: CanvasRenderingContext2D, meta: CaptureMeta): void {
  const cardX = 60;
  const cardY = EXPORT_H - 460;
  const cardW = EXPORT_W - 120;
  const cardH = 320;

  // Translucent glassmorph block — black @ 38% with 1px stroke for legibility
  // over any biome.
  ctx.save();
  ctx.fillStyle = 'rgba(12, 8, 24, 0.55)';
  roundRect(ctx, cardX, cardY, cardW, cardH, 28);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.stroke();
  ctx.restore();

  // Track name, big.
  ctx.save();
  ctx.fillStyle = '#f5edd8';
  ctx.font = '600 64px "JetBrains Mono", "Inter", system-ui, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText(meta.trackName, cardX + 36, cardY + 36, cardW - 72);

  // Biome sub-label.
  ctx.font = '400 32px "Inter", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(245, 237, 216, 0.72)';
  ctx.fillText(`Biome: ${meta.biomeLabel}`, cardX + 36, cardY + 116);

  // Combo + taps stat row.
  ctx.font = '500 44px "JetBrains Mono", monospace';
  ctx.fillStyle = '#ff8acb'; // pop-magenta
  ctx.fillText(`combo · ${meta.combo}`, cardX + 36, cardY + 180);
  ctx.fillStyle = '#f7d36a'; // saffron
  ctx.fillText(`taps · ${meta.tapCount}`, cardX + 36, cardY + 240);
  ctx.restore();
}

function drawCosmoBadge(ctx: CanvasRenderingContext2D, img: HTMLImageElement): void {
  // Small Cosmo crop top-right, ~280×280.
  const size = 280;
  const x = EXPORT_W - size - 60;
  const y = 100;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  // Glow halo
  ctx.shadowColor = 'rgba(255, 138, 203, 0.6)';
  ctx.shadowBlur = 32;
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();
}

function drawWatermark(ctx: CanvasRenderingContext2D, shareUrl: string): void {
  ctx.save();
  ctx.font = '500 28px "Inter", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(245, 237, 216, 0.88)';
  ctx.textBaseline = 'bottom';
  ctx.fillText("zorp's universe", 60, EXPORT_H - 72);
  ctx.fillStyle = 'rgba(245, 237, 216, 0.62)';
  ctx.font = '400 24px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(shareUrl, EXPORT_W - 60, EXPORT_H - 72);
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

/**
 * Lazy-load and cache the Cosmo PNG used in the share-card. Resolves once,
 * subsequent calls reuse the same `<img>` element.
 */
let cosmoImagePromise: Promise<HTMLImageElement | null> | null = null;
export function loadCosmoForCard(url: string): Promise<HTMLImageElement | null> {
  if (cosmoImagePromise) return cosmoImagePromise;
  cosmoImagePromise = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
  return cosmoImagePromise;
}
