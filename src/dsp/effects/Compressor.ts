import { Effect } from '../Effect';
import { compressorCurve } from '../curves';
import { Ballistics, dbToGain, LevelDetector, type DetectorMode } from '../math';

export interface CompressorParams {
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
  gain: number;
  softKnee: boolean;
  detector: DetectorMode;
  mix: number;
}

export const SOFT_KNEE_DB = 10;

export class Compressor extends Effect<CompressorParams> {
  private detector = new LevelDetector(this.sampleRate);
  private ballistics = new Ballistics();
  private p!: CompressorParams;

  set(p: CompressorParams): void {
    this.p = { ...p };
    this.detector.mode = p.detector;
    this.ballistics.setTimes(p.attack, p.release, this.sampleRate);
  }

  reset(): void {
    this.detector.reset();
    this.ballistics.reset();
  }

  process(l: Float32Array, r: Float32Array): void {
    this.beginBlock();
    const { threshold, ratio, softKnee, gain, mix } = this.p;
    const curve = { threshold, ratio, knee: softKnee ? SOFT_KNEE_DB : 0 };
    const makeup = dbToGain(gain);
    const wet = mix / 100;
    for (let i = 0; i < l.length; i++) {
      const level = this.detector.next(Math.max(Math.abs(l[i]), Math.abs(r[i])));
      const gr = this.ballistics.next(compressorCurve(level, curve) - level);
      this.track(gr, level);
      const g = 1 - wet + wet * dbToGain(gr) * makeup;
      l[i] *= g;
      r[i] *= g;
    }
  }
}
