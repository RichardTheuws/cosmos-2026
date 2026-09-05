import { describe, expect, it } from 'vitest';
import { envelope, tierFor } from './escalation';

describe('tierFor', () => {
  const tramp = { tier2At: 3, tier3At: 5, every: 5 };
  it('is tier 1 on ordinary uses', () => {
    expect(tierFor(1, tramp)).toBe(1);
    expect(tierFor(2, tramp)).toBe(1);
    expect(tierFor(4, tramp)).toBe(1);
  });
  it('fires tier 2 exactly once at its threshold', () => {
    expect(tierFor(3, tramp)).toBe(2);
    expect(tierFor(6, tramp)).toBe(1);
  });
  it('fires tier 3 at its threshold and then every N', () => {
    expect(tierFor(5, tramp)).toBe(3);
    expect(tierFor(10, tramp)).toBe(3);
    expect(tierFor(15, tramp)).toBe(3);
    expect(tierFor(12, tramp)).toBe(1);
  });
  it('tier 3 without `every` fires once', () => {
    const s = { tier2At: 0, tier3At: 3 };
    expect(tierFor(3, s)).toBe(3);
    expect(tierFor(6, s)).toBe(1);
  });
  it('zero thresholds never fire', () => {
    expect(tierFor(3, { tier2At: 0, tier3At: 0 })).toBe(1);
    expect(tierFor(0, tramp)).toBe(1);
  });
});

describe('envelope', () => {
  it('ramps in, holds, ramps out', () => {
    expect(envelope(0, 10, 2, 4)).toBe(0);
    expect(envelope(1, 10, 2, 4)).toBeCloseTo(0.5);
    expect(envelope(5, 10, 2, 4)).toBe(1);
    expect(envelope(8, 10, 2, 4)).toBeCloseTo(0.5);
    expect(envelope(10, 10, 2, 4)).toBe(0);
    expect(envelope(11, 10, 2, 4)).toBe(0);
  });
});
