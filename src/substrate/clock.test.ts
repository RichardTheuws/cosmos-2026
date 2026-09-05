import { describe, expect, it } from 'vitest';
import { currentHour, dayKey, gardenOnArrival, phaseFor, restoredEnergy, restoredZin } from './clock';

describe('phaseFor', () => {
  it('is plain day at noon', () => {
    expect(phaseFor(12)).toEqual({ night: 0, dusk: 0, dawn: 0 });
  });
  it('is full night at 2am and wraps negative/overflow hours', () => {
    expect(phaseFor(2).night).toBe(1);
    expect(phaseFor(26).night).toBe(1);
    expect(phaseFor(-1).night).toBe(1);
  });
  it('dusk rises through the evening and hands over to night', () => {
    expect(phaseFor(18).dusk).toBeCloseTo(0.5);
    expect(phaseFor(19).dusk).toBe(1);
    expect(phaseFor(21.5).night).toBeGreaterThan(0.4);
    expect(phaseFor(21.5).dusk).toBeLessThan(0.3);
  });
  it('dawn is pale and never sums past 1 with night', () => {
    for (const h of [5, 5.5, 6, 6.5, 7, 8]) {
      const p = phaseFor(h);
      expect(p.night + p.dusk + p.dawn).toBeLessThanOrEqual(1.0001);
    }
    expect(phaseFor(7).dawn).toBeGreaterThan(0.9);
  });
});

describe('dayKey / currentHour', () => {
  it('keys a local calendar day', () => {
    expect(dayKey(new Date(2026, 8, 5, 23, 59))).toBe('2026-09-05');
  });
  it('honours the ?hour= override, else the local hour', () => {
    expect(currentHour(new Date(2026, 8, 5, 7, 30), '?hour=22')).toBe(22);
    expect(currentHour(new Date(2026, 8, 5, 7, 30), '')).toBeCloseTo(7.5);
    expect(currentHour(new Date(2026, 8, 5, 7, 30), '?hour=abc')).toBeCloseTo(7.5);
  });
});

describe('being away restores him', () => {
  it('energy comes back with the hours, capped, never lowered', () => {
    expect(restoredEnergy(0.2, 2 * 3_600_000)).toBeCloseTo(0.5);
    expect(restoredEnergy(0.9, 10 * 3_600_000)).toBe(1);
    expect(restoredEnergy(0.4, -5)).toBe(0.4);
  });
  it('zin too', () => {
    expect(restoredZin(0, 5 * 3_600_000)).toBeCloseTo(0.5);
  });
});

describe('gardenOnArrival', () => {
  it('grows one sprout per new day, not twice a day, capped', () => {
    expect(gardenOnArrival(0, null, '2026-09-05')).toEqual({ sprouts: 1, grew: true });
    expect(gardenOnArrival(1, '2026-09-05', '2026-09-05')).toEqual({ sprouts: 1, grew: false });
    expect(gardenOnArrival(1, '2026-09-05', '2026-09-06')).toEqual({ sprouts: 2, grew: true });
    expect(gardenOnArrival(7, '2026-09-05', '2026-09-06')).toEqual({ sprouts: 7, grew: false });
  });
});
