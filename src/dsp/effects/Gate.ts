import { Biquad } from '../Biquad';
import { Effect } from '../Effect';
import { expanderCurve } from '../curves';
import { Ballistics, dbToGain, LevelDetector } from '../math';

export type GateMode = 'gate' | 'expander';

export interface GateParams {
  mode: GateMode;
  threshold: number;
  range: number;
  ratio: number;
  attack: number;
  hold: number;
  release: number;
  keyFilter: boolean;
  keyHpf: number;
  keyLpf: number;
}

export const GATE_RATIO = 100;

export class Gate extends Effect<GateParams> {
  private detector = new LevelDetector(this.sampleRate);
  private ballistics = new Ballistics();
  private hpf = new Biquad(this.sampleRate);
  private lpf = new Biquad(this.sampleRate);
  private holdLeft = 0;
  private p!: GateParams;

  set(p: GateParams): void {
    this.p = { ...p };
    // Opening (gain rising) uses attack, closing uses release.
    this.ballistics.setTimes(p.release, p.attack, this.sampleRate);
    this.hpf.set('highpass', p.keyHpf);
    this.lpf.set('lowpass', p.keyLpf);
  }

  reset(): void {
    this.detector.reset();
    this.ballistics.reset(-this.p?.range || 0);
    this.hpf.reset();
    this.lpf.reset();
    this.holdLeft = 0;
  }

  process(l: Float32Array, r: Float32Array): void {
    this.beginBlock();
    const { mode, threshold, range, keyFilter } = this.p;
    const curve = { threshold, range, ratio: mode === 'gate' ? GATE_RATIO : this.p.ratio };
    const holdSamples = (this.p.hold / 1000) * this.sampleRate;
    for (let i = 0; i < l.length; i++) {
      let key = (l[i] + r[i]) / 2;
      if (keyFilter) key = this.lpf.process(this.hpf.process(key));
      const level = this.detector.next(key);
      let target = expanderCurve(level, curve) - level;
      if (level >= threshold) this.holdLeft = holdSamples;
      else if (this.holdLeft > 0) {
        this.holdLeft--;
        target = 0;
      }
      const gr = this.ballistics.next(target);
      this.track(gr, level);
      const g = dbToGain(gr);
      l[i] *= g;
      r[i] *= g;
    }
  }
}
