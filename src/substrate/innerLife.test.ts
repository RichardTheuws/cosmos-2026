import { describe, expect, it } from 'vitest';
import {
  choose, createInnerState, idleWaitFor, isTired, onPet, onVisit, paceFor, tickInner, wantsSleep,
} from './innerLife';

const room = [
  { id: 'trampoline', nature: 'wild' as const },
  { id: 'spore-puddle', nature: 'play' as const },
  { id: 'sunbeam-patch', nature: 'calm' as const },
  { id: 'nap-cap', nature: 'rest' as const },
];

describe('innerLife', () => {
  it('starts rested and mildly curious', () => {
    const s = createInnerState();
    expect(s.energy).toBeGreaterThan(0.8);
    expect(isTired(s)).toBe(false);
    expect(wantsSleep(s)).toBe(false);
  });

  it('wild play drains energy until he is tired, then sleepy', () => {
    const s = createInnerState();
    onVisit(s, 'trampoline', 'wild', true);
    onVisit(s, 'trampoline', 'wild', true);
    expect(isTired(s)).toBe(true);
    expect(paceFor(s)).toBeLessThan(1);
    onVisit(s, 'trampoline', 'wild', true);
    expect(wantsSleep(s)).toBe(true);
  });

  it('when sleepy he chooses the resting place, or sleeps in place', () => {
    const s = createInnerState();
    s.energy = 0.05;
    expect(choose(s, room)?.id).toBe('nap-cap');
    expect(choose(s, room.filter((c) => c.nature !== 'rest'))).toBeNull();
  });

  it('rest restores energy and clears sleep', () => {
    const s = createInnerState();
    s.energy = 0.05;
    s.asleep = true;
    onVisit(s, 'nap-cap', 'rest', false);
    expect(s.energy).toBeGreaterThan(0.5);
    expect(s.asleep).toBe(false);
  });

  it('quiet time raises zin and shortens the idle wait', () => {
    const s = createInnerState();
    const before = idleWaitFor(s);
    tickInner(s, 30, false);
    expect(s.zin).toBeGreaterThan(0.6);
    expect(idleWaitFor(s)).toBeLessThan(before);
    onVisit(s, 'spore-puddle', 'play', false);
    expect(idleWaitFor(s)).toBeGreaterThan(idleWaitFor({ ...s, zin: 1 }));
  });

  it('novelty makes his own choices avoid what he just did', () => {
    const s = createInnerState();
    onVisit(s, 'trampoline', 'wild', false);
    // energy now 0.55: wild fit 0.30, play 0.55, calm 0.72, rest 0.4 — with
    // trampoline novelty 0 its weight is tiny; over many draws it is rare.
    let tramp = 0;
    for (let i = 0; i < 400; i++) if (choose(s, room, Math.random)?.id === 'trampoline') tramp++;
    expect(tramp).toBeLessThan(40);
    tickInner(s, 90, false); // novelty recovers
    expect(s.novelty['trampoline']).toBeCloseTo(1, 1);
  });

  it('is deterministic under an injected rng', () => {
    const s = createInnerState();
    expect(choose(s, room, () => 0)?.id).toBe('trampoline');
    expect(choose(s, room, () => 0.999)?.id).toBe('nap-cap');
  });

  it('you matter: taps and pets raise affection, which settles back', () => {
    const s = createInnerState();
    onVisit(s, 'spore-puddle', 'play', true);
    onPet(s);
    expect(s.affection).toBeGreaterThan(0.8);
    tickInner(s, 600, false);
    expect(s.affection).toBeLessThan(0.6);
  });
});
