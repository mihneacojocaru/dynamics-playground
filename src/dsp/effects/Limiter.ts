import { Effect } from '../Effect';
import { Ballistics, dbToGain, gainToDb } from '../math';

export interface LimiterParams {
  threshold: number;
  ceiling: number;
  release: number;
}

const LOOKAHEAD_MS = 1.5;

/** Brickwall limiter: drives the input by -threshold and holds peaks under the ceiling using lookahead. */
export class Limiter extends Effect<LimiterParams> {
  private size = Math.max(1, Math.round((LOOKAHEAD_MS / 1000) * this.sampleRate));
  private bufL = new Float32Array(this.size);
  private bufR = new Float32Array(this.size);
  private targets = new Float32Array(this.size);
  private pos = 0;
  private ballistics = new Ballistics();
  private p!: LimiterParams;

  set(p: LimiterParams): void {
    this.p = { ...p };
    this.ballistics.setTimes(LOOKAHEAD_MS / 3, p.release, this.sampleRate);
  }

  reset(): void {
    this.bufL.fill(0);
    this.bufR.fill(0);
    this.targets.fill(0);
    this.ballistics.reset();
  }

  process(l: Float32Array, r: Float32Array): void {
    this.beginBlock();
    const drive = dbToGain(-this.p.threshold);
    const ceiling = this.p.ceiling;
    const ceilingLin = dbToGain(ceiling);
    for (let i = 0; i < l.length; i++) {
      const xl = l[i] * drive;
      const xr = r[i] * drive;
      const level = gainToDb(Math.max(Math.abs(xl), Math.abs(xr)));
      this.targets[this.pos] = Math.min(0, ceiling - level);
      let target = 0;
      for (let k = 0; k < this.size; k++) if (this.targets[k] < target) target = this.targets[k];
      const gr = this.ballistics.next(target);
      this.track(gr, level);
      const g = dbToGain(gr);
      const dl = this.bufL[this.pos];
      const dr = this.bufR[this.pos];
      this.bufL[this.pos] = xl;
      this.bufR[this.pos] = xr;
      this.pos = (this.pos + 1) % this.size;
      l[i] = Math.max(-ceilingLin, Math.min(ceilingLin, dl * g));
      r[i] = Math.max(-ceilingLin, Math.min(ceilingLin, dr * g));
    }
  }
}
