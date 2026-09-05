#!/usr/bin/env node
/**
 * Wave 27 — headless visual UAT for the substrate `/play/` (phone + desktop).
 *
 * What it does: serves nothing itself — point it at a server that hosts dist/
 * under the real base path (see below), wakes Cosmo, waits for onboarding to
 * hand him over, then REALLY taps each interactable of the current room
 * through the gesture pipeline (InputController → InteractionManager →
 * InteractionDirector), screenshots the moment he uses it, and finally goes
 * quiet to confirm curiosity walks him somewhere on his own. Reports console
 * errors. Exit code 1 on any failure.
 *
 * Serve dist/ under the base path (vite preview serves base '/', which breaks
 * the /games/cosmos-2026/ asset URLs):
 *   mkdir -p /tmp/www/games && ln -sfn "$PWD/dist" /tmp/www/games/cosmos-2026
 *   python3 -m http.server 4174 --directory /tmp/www
 * Then:
 *   node scripts/uat/shots.mjs [outDir] [url]
 * Needs `playwright` (npm i -D playwright), or point PLAYWRIGHT= at another
 * project's playwright/index.mjs. Programmatic UAT can't judge pixels — open the shots.
 */
// `PLAYWRIGHT=/path/to/playwright/index.mjs` overrides resolution (e.g. a sibling project's install).
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');
import { mkdirSync } from 'node:fs';

const OUT = process.argv[2] ?? 'uat-shots';
const URL = process.argv[3] ?? 'http://localhost:4174/games/cosmos-2026/play/';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
let failures = 0;

for (const vp of [
  { width: 390, height: 844, tag: 'phone' },
  { width: 1280, height: 720, tag: 'desk' },
]) {
  const page = await browser.newPage({
    viewport: vp, deviceScaleFactor: 2, hasTouch: true, isMobile: vp.width < 500,
  });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));

  const agent = () => page.evaluate(() => {
    const a = window.__cosmosDirector?.deps.cosmoAgent;
    return a ? { state: a.state, paused: a.paused, busy: a.isBusy, x: +a.worldX.toFixed(2), z: +a.worldZ.toFixed(2) } : null;
  });
  const until = async (pred, max = 80) => { let a = null; for (let i = 0; i < max; i++) { await page.waitForTimeout(250); a = await agent(); if (a && pred(a)) break; } return a; };
  const screenOf = (id) => page.evaluate((id) => {
    const d = window.__cosmosDirector; const h = d.deps.interactables().find((x) => x.id === id);
    const cam = d.deps.camera; const v = { x: h.anchor.x, y: h.anchor.y + 0.5, z: h.anchor.z };
    const m = cam.matrixWorldInverse.elements, p = cam.projectionMatrix.elements;
    const cx = m[0]*v.x + m[4]*v.y + m[8]*v.z + m[12], cy = m[1]*v.x + m[5]*v.y + m[9]*v.z + m[13];
    const cz = m[2]*v.x + m[6]*v.y + m[10]*v.z + m[14], cw = m[3]*v.x + m[7]*v.y + m[11]*v.z + m[15];
    const px = p[0]*cx + p[4]*cy + p[8]*cz + p[12]*cw, py = p[1]*cx + p[5]*cy + p[9]*cz + p[13]*cw, pw = p[3]*cx + p[7]*cy + p[11]*cz + p[15]*cw;
    return { x: (px / pw + 1) / 2 * innerWidth, y: (1 - py / pw) / 2 * innerHeight };
  }, id);

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  if (!(await agent())) { console.log(vp.tag, 'FAIL: substrate director not mounted (legacy path or boot failure)'); failures++; await page.close(); continue; }
  // Wake with a tap at top-centre: nothing lives there, and (unlike a corner)
  // it doesn't pan the camera off-centre, which would push edge items out.
  await page.mouse.click(Math.round(vp.width / 2), 120);
  await until((a) => !a.paused);
  await page.screenshot({ path: `${OUT}/${vp.tag}-00-awake.png` });

  const ids = await page.evaluate(() => window.__cosmosDirector.deps.interactables().map((h) => h.id));
  console.log(vp.tag, 'interactables:', ids.join(', ') || '(none)');
  for (const id of ids) {
    const pt = await screenOf(id);
    const onScreen = pt.x >= 0 && pt.x <= vp.width && pt.y >= 0 && pt.y <= vp.height;
    // A tap while Cosmo is mid-moment is ignored by design (curiosity may
    // have just started a visit between our poll and the click) — retry.
    let a = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      await until((s) => !s.busy);
      await page.mouse.click(Math.round(Math.min(vp.width - 1, Math.max(0, pt.x))), Math.round(Math.min(vp.height - 1, Math.max(0, pt.y))));
      a = await until((s) => s.state === 'bouncing' || s.state === 'using', 24);
      if (a && (a.state === 'bouncing' || a.state === 'using')) break;
    }
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/${vp.tag}-${id}.png` });
    const ok = a && (a.state === 'bouncing' || a.state === 'using');
    if (!ok) failures++;
    console.log(vp.tag, ok ? 'ok  ' : 'FAIL', id.padEnd(16), `tap@(${pt.x.toFixed(0)},${pt.y.toFixed(0)})${onScreen ? '' : ' OFFSCREEN'} → ${a?.state} @ (${a?.x}, ${a?.z})`);
  }
  if (ids.length) {
    await until((a) => !a.busy);
    const before = await page.evaluate(() => window.__cosmosDirector.lastUsedId);
    const a = await until(() => false, 8); // let curiosity clock tick
    void a;
    let moved = false;
    // His idle wait scales with zin (up to ~26 s after a few visits) plus a
    // greeting beat may come first — allow a full minute.
    for (let i = 0; i < 240 && !moved; i++) {
      await page.waitForTimeout(250);
      moved = await page.evaluate((b) => window.__cosmosDirector.lastUsedId !== b || window.__cosmosDirector.deps.cosmoAgent.state === 'walking-to', before);
    }
    if (!moved) failures++;
    console.log(vp.tag, moved ? 'ok   curiosity: Cosmo went somewhere on his own' : 'FAIL curiosity: Cosmo never moved');
  }
  if (errors.length) failures++;
  console.log(vp.tag, 'console errors:', errors.length, errors.slice(0, 3));
  await page.close();
}
await browser.close();
console.log(failures ? `UAT FAILED (${failures})` : 'UAT PASS');
process.exit(failures ? 1 : 0);
