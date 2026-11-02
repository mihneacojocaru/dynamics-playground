import { Biquad, Crossover } from '../Biquad';
import { Effect } from '../Effect';
import { compressorCurve } from '../curves';
import { Ballistics, dbToGain, LevelDetector } from '../math';

export interface BandParams {
  threshold: number;
  ratio: number;
  gain: number;
  active: boolean;
}

export interface MultibandParams {
  low: number;
  mid: number;
  high: number;
  attack: number;
  release: number;
  bands: BandParams[];
}

export const BAND_COUNT = 4;

/** Four-band compressor. Lower bands pass the allpasses of the higher splits so the sum stays flat. */
export class Multiband extends Effect<MultibandParams> {
  readonly crossovers = [0, 1, 2].map(() => new Crossover(this.sampleRate));
  // Band 1 needs the allpasses of split 2 and 3, band 2 the one of split 3; each needs its own state.
  private ap = [0, 1, 2].map(() => new Biquad(this.sampleRate));
  private detectors = Array.from({ length: BAND_COUNT }, () => new LevelDetector(this.sampleRate));
  private ballistics = Array.from({ length: BAND_COUNT }, () => new Ballistics());
  private p!: MultibandParams;
  private band = new Float64Array(BAND_COUNT * 2);

  set(p: MultibandParams): void {
    this.p = { ...p, bands: p.bands.map((b) => ({ ...b })) };
    [p.low, p.mid, p.high].forEach((f, i) => this.crossovers[i].setFrequency(f));
    this.ap[0].set('allpass', p.mid);
    this.ap[1].set('allpass', p.high);
    this.ap[2].set('allpass', p.high);
    this.ballistics.forEach((b) => b.setTimes(p.attack, p.release, this.sampleRate));
  }

  reset(): void {
    this.crossovers.forEach((c) => c.reset());
    this.ap.forEach((a) => a.reset());
    this.detectors.forEach((d) => d.reset());
    this.ballistics.forEach((b) => b.reset());
  }

  process(l: Float32Array, r: Float32Array): void {
    this.beginBlock();
    const bands = this.p.bands;
    const makeup = bands.map((b) => dbToGain(b.gain));
    const curves = bands.map((b) => ({ threshold: b.threshold, ratio: b.ratio, knee: 6 }));
    this.meter.bands = new Array(BAND_COUNT).fill(0);
    const [x1, x2, x3] = this.crossovers;
    const [ap2, ap3, ap3b] = this.ap;
    const b = this.band;

    for (let i = 0; i < l.length; i++) {
      for (let ch = 0; ch < 2; ch++) {
        const x = ch === 0 ? l[i] : r[i];
        const rest1 = x1.high(x, ch);
        const rest2 = x2.high(rest1, ch);
        b[ch] = ap3.process(ap2.process(x1.low(x, ch), ch), ch);
        b[2 + ch] = ap3b.process(x2.low(rest1, ch), ch);
        b[4 + ch] = x3.low(rest2, ch);
        b[6 + ch] = x3.high(rest2, ch);
      }
      let outL = 0;
      let outR = 0;
      for (let k = 0; k < BAND_COUNT; k++) {
        const bl = b[k * 2];
        const br = b[k * 2 + 1];
        const level = this.detectors[k].next(Math.max(Math.abs(bl), Math.abs(br)));
        let g = 1;
        if (bands[k].active) {
          const gr = this.ballistics[k].next(compressorCurve(level, curves[k]) - level);
          if (gr < this.meter.bands[k]) this.meter.bands[k] = gr;
          this.track(gr, level);
          g = dbToGain(gr) * makeup[k];
        }
        outL += bl * g;
        outR += br * g;
      }
      l[i] = outL;
      r[i] = outR;
    }
  }
}
