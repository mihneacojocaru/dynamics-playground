import { Biquad, Crossover } from '../Biquad';
import { Effect } from '../Effect';
import { compressorCurve } from '../curves';
import { Ballistics, dbToGain, LevelDetector } from '../math';

export type DeEsserMode = 'wide' | 'split';
export type DeEsserFilter = 'highpass' | 'bandpass';

export interface DeEsserParams {
  frequency: number;
  threshold: number;
  range: number;
  response: number;
  mode: DeEsserMode;
  filter: DeEsserFilter;
  listen: boolean;
}

export const DEESSER_RATIO = 8;

export class DeEsser extends Effect<DeEsserParams> {
  private key = new Biquad(this.sampleRate);
  private listen = [new Biquad(this.sampleRate), new Biquad(this.sampleRate)];
  private split = new Crossover(this.sampleRate);
  private detector = new LevelDetector(this.sampleRate);
  private ballistics = new Ballistics();
  private p!: DeEsserParams;

  set(p: DeEsserParams): void {
    this.p = { ...p };
    const q = p.filter === 'bandpass' ? 1.4 : Math.SQRT1_2;
    [this.key, ...this.listen].forEach((f) => f.set(p.filter, p.frequency, q));
    this.split.setFrequency(p.frequency);
    this.ballistics.setTimes(0.5, p.response, this.sampleRate);
  }

  reset(): void {
    [this.key, ...this.listen].forEach((f) => f.reset());
    this.split.reset();
    this.detector.reset();
    this.ballistics.reset();
  }

  process(l: Float32Array, r: Float32Array): void {
    this.beginBlock();
    const { threshold, range, mode, listen } = this.p;
    const curve = { threshold, ratio: DEESSER_RATIO, knee: 6 };
    for (let i = 0; i < l.length; i++) {
      const level = this.detector.next(this.key.process((l[i] + r[i]) / 2));
      const gr = this.ballistics.next(Math.max(-range, compressorCurve(level, curve) - level));
      this.track(gr, level);
      if (listen) {
        l[i] = this.listen[0].process(l[i]);
        r[i] = this.listen[1].process(r[i]);
        continue;
      }
      const g = dbToGain(gr);
      if (mode === 'wide') {
        l[i] *= g;
        r[i] *= g;
      } else {
        l[i] = this.split.low(l[i], 0) + this.split.high(l[i], 0) * g;
        r[i] = this.split.low(r[i], 1) + this.split.high(r[i], 1) * g;
      }
    }
  }
}
