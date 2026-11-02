import { Biquad, BUTTERWORTH_Q, type FilterType } from '../Biquad';
import { Effect } from '../Effect';

export interface EqBand {
  freq: number;
  gain: number;
  q: number;
  shelf: boolean;
  active: boolean;
}

export interface EqualizerParams {
  hpfOn: boolean;
  hpf: number;
  lpfOn: boolean;
  lpf: number;
  bands: EqBand[];
}

export function bandType(index: number, band: EqBand, count: number): FilterType {
  if (band.shelf && index === 0) return 'lowshelf';
  if (band.shelf && index === count - 1) return 'highshelf';
  return 'peaking';
}

/** Builds the active filter chain; used both for processing and for drawing the response. */
export function buildFilters(p: EqualizerParams, sampleRate: number): Biquad[] {
  const filters: Biquad[] = [];
  if (p.hpfOn) filters.push(new Biquad(sampleRate).set('highpass', p.hpf, BUTTERWORTH_Q));
  p.bands.forEach((b, i) => {
    if (b.active) filters.push(new Biquad(sampleRate).set(bandType(i, b, p.bands.length), b.freq, b.q, b.gain));
  });
  if (p.lpfOn) filters.push(new Biquad(sampleRate).set('lowpass', p.lpf, BUTTERWORTH_Q));
  return filters;
}

export class Equalizer extends Effect<EqualizerParams> {
  private filters = Array.from({ length: 6 }, () => new Biquad(this.sampleRate));
  private enabled: boolean[] = [];

  set(p: EqualizerParams): void {
    // Coefficients are updated in place so the filter state survives parameter moves without clicks.
    const [hpf, b1, b2, b3, b4, lpf] = this.filters;
    hpf.set('highpass', p.hpf);
    lpf.set('lowpass', p.lpf);
    [b1, b2, b3, b4].forEach((f, i) => {
      const b = p.bands[i];
      f.set(bandType(i, b, p.bands.length), b.freq, b.q, b.gain);
    });
    this.enabled = [p.hpfOn, ...p.bands.map((b) => b.active), p.lpfOn];
  }

  reset(): void {
    this.filters.forEach((f) => f.reset());
  }

  process(l: Float32Array, r: Float32Array): void {
    this.beginBlock();
    this.filters.forEach((f, k) => {
      if (!this.enabled[k]) return;
      for (let i = 0; i < l.length; i++) {
        l[i] = f.process(l[i], 0);
        r[i] = f.process(r[i], 1);
      }
    });
  }
}
