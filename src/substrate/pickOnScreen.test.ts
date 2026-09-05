import { describe, expect, it } from 'vitest';
import { chooseCuriosityTarget, pickOnScreen } from './pickOnScreen';

const pts = [
  { id: 'trampoline', x: 0.0, y: -0.2, z: 0.5 },
  { id: 'sunbeam', x: 0.6, y: -0.1, z: 0.5 },
  { id: 'behind', x: 0.0, y: 0.0, z: 1.2 },
];

describe('pickOnScreen', () => {
  it('picks the nearest anchor inside the radius', () => {
    expect(pickOnScreen(pts, 0.05, -0.15)?.id).toBe('trampoline');
    expect(pickOnScreen(pts, 0.55, -0.05)?.id).toBe('sunbeam');
  });
  it('returns null on a miss', () => {
    expect(pickOnScreen(pts, -0.9, 0.9)).toBeNull();
    expect(pickOnScreen([], 0, 0)).toBeNull();
  });
  it('never picks anchors outside the clip volume (behind the camera)', () => {
    // 'behind' sits exactly at the tap but z > 1 → trampoline wins instead.
    expect(pickOnScreen(pts, 0.0, 0.0)?.id).toBe('trampoline');
  });
  it('honours a custom radius', () => {
    expect(pickOnScreen(pts, 0.25, -0.15, 0.1)).toBeNull();
    expect(pickOnScreen(pts, 0.25, -0.15, 0.4)?.id).toBe("trampoline");
  });
  it('scales x by aspect so a tall phone viewport picks fairly', () => {
    // On a 0.5 aspect (portrait) an x-offset of 0.3 NDC is only 0.15 on screen.
    expect(pickOnScreen(pts, 0.3, -0.2, 0.2, 0.5)?.id).toBe('trampoline');
    expect(pickOnScreen(pts, 0.3, -0.2, 0.2, 1.0)).toBeNull();
  });
  it('ignores NaN projections', () => {
    expect(pickOnScreen([{ id: 'nan', x: NaN, y: 0, z: 0 }], 0, 0)).toBeNull();
  });
});

describe('chooseCuriosityTarget', () => {
  it('returns null with no candidates', () => {
    expect(chooseCuriosityTarget([], null)).toBeNull();
  });
  it('avoids the last target when there is a choice', () => {
    for (let i = 0; i < 20; i++) {
      expect(chooseCuriosityTarget(['a', 'b', 'c'], 'a')).not.toBe('a');
    }
  });
  it('repeats when it is the only option', () => {
    expect(chooseCuriosityTarget(['a'], 'a')).toBe('a');
  });
  it('is deterministic under an injected rng', () => {
    expect(chooseCuriosityTarget(['a', 'b', 'c'], null, () => 0.99)).toBe('c');
    expect(chooseCuriosityTarget(['a', 'b', 'c'], 'c', () => 0.99)).toBe('b');
  });
});
