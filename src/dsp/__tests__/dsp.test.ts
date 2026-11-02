import { describe, expect, it } from 'vitest';
import { DEFAULTS } from '../../devices/definitions';
import { Biquad, Crossover } from '../Biquad';
import { compressorCurve, expanderCurve } from '../curves';
import { createEffect, EFFECTS, type DeviceId } from '../effects';
import { Limiter } from '../effects/Limiter';
import { Multiband } from '../effects/Multiband';
import { dbToGain, gainToDb } from '../math';

const SR = 48000;

function sine(freq: number, seconds: number, amp = 0.5): Float32Array {
  return Float32Array.from({ length: Math.round(seconds * SR) }, (_, i) => amp * Math.sin((2 * Math.PI * freq * i) / SR));
}

const peak = (x: Float32Array, from = 0) => x.subarray(from).reduce((m, v) => Math.max(m, Math.abs(v)), 0);

describe('curves', () => {
  it('compresses above the threshold by the ratio', () => {
    expect(compressorCurve(-10, { threshold: -20, ratio: 4, knee: 0 })).toBeCloseTo(-17.5);
    expect(compressorCurve(-30, { threshold: -20, ratio: 4, knee: 0 })).toBe(-30);
  });

  it('soft knee meets the hard curve outside the knee', () => {
    const c = { threshold: -20, ratio: 4, knee: 10 };
    expect(compressorCurve(-26, c)).toBeCloseTo(-26);
    expect(compressorCurve(-14, c)).toBeCloseTo(compressorCurve(-14, { ...c, knee: 0 }));
  });

  it('expander never goes below the range', () => {
    expect(expanderCurve(-50, { threshold: -40, ratio: 100, range: 20 })).toBe(-70);
    expect(expanderCurve(-45, { threshold: -40, ratio: 2, range: 40 })).toBe(-50);
  });
});

describe('filters', () => {
  it('peaking filter hits its gain at the centre frequency', () => {
    const f = new Biquad(SR).set('peaking', 1000, 1, 6);
    expect(gainToDb(f.magnitude(1000))).toBeCloseTo(6, 1);
  });

  it('LR4 crossover is -6 dB per band at the split and sums flat', () => {
    const x = new Crossover(SR, 1000);
    expect(gainToDb(x.lowMagnitude(1000))).toBeCloseTo(-6.02, 1);
    expect(x.lowMagnitude(1000) + x.highMagnitude(1000)).toBeCloseTo(1, 3);
  });

  it('multiband with neutral settings passes a sine unchanged in level', () => {
    for (const freq of [80, 600, 3000, 9000]) {
      const mb = new Multiband(SR);
      mb.set({ ...DEFAULTS.multiband, bands: DEFAULTS.multiband.bands.map((b) => ({ ...b, active: false })) });
      const l = sine(freq, 0.5);
      const r = l.slice();
      mb.process(l, r);
      expect(gainToDb(peak(l, SR / 4))).toBeCloseTo(gainToDb(0.5), 0);
    }
  });
});

describe('effects', () => {
  it('limiter keeps peaks under the ceiling', () => {
    const lim = new Limiter(SR);
    lim.set({ threshold: -12, ceiling: -1, release: 50 });
    const l = sine(200, 0.5, 0.9);
    const r = l.slice();
    lim.process(l, r);
    expect(peak(l)).toBeLessThanOrEqual(dbToGain(-1) + 1e-6);
  });

  it.each(Object.keys(EFFECTS) as DeviceId[])('%s produces finite output on a dynamic test signal', (id) => {
    // 10 s of tones and noise bursts that jump between loud and quiet.
    let seed = 1;
    const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
    const l = Float32Array.from({ length: 10 * SR }, (_, i) => {
      const loud = Math.floor(i / (SR / 4)) % 3 === 0 ? 0.9 : 0.05;
      return loud * (0.6 * Math.sin((2 * Math.PI * 110 * i) / SR) + 0.4 * noise());
    });
    const r = l.slice();
    const fx = createEffect(id, SR);
    fx.set(DEFAULTS[id]);
    const start = performance.now();
    for (let i = 0; i < l.length; i += 256) fx.process(l.subarray(i, i + 256), r.subarray(i, i + 256));
    const ms = performance.now() - start;
    expect(l.every(Number.isFinite)).toBe(true);
    expect(peak(l)).toBeGreaterThan(0.01);
    expect(ms).toBeLessThan(2000);
  });
});
