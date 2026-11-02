export type FilterType = 'lowpass' | 'highpass' | 'bandpass' | 'peaking' | 'lowshelf' | 'highshelf' | 'allpass';

export const BUTTERWORTH_Q = Math.SQRT1_2;

/** RBJ cookbook biquad with independent state for two channels. */
export class Biquad {
  private b0 = 1;
  private b1 = 0;
  private b2 = 0;
  private a1 = 0;
  private a2 = 0;
  private z1 = [0, 0];
  private z2 = [0, 0];

  constructor(private sampleRate: number) {}

  set(type: FilterType, freq: number, q = BUTTERWORTH_Q, gainDb = 0): this {
    const f = Math.min(Math.max(freq, 1), this.sampleRate * 0.49);
    const w = (2 * Math.PI * f) / this.sampleRate;
    const cos = Math.cos(w);
    const alpha = Math.sin(w) / (2 * q);
    const A = Math.pow(10, gainDb / 40);
    const s = 2 * Math.sqrt(A) * alpha;
    let b0: number, b1: number, b2: number, a0: number, a1: number, a2: number;

    switch (type) {
      case 'lowpass':
        [b0, b1, b2, a0, a1, a2] = [(1 - cos) / 2, 1 - cos, (1 - cos) / 2, 1 + alpha, -2 * cos, 1 - alpha];
        break;
      case 'highpass':
        [b0, b1, b2, a0, a1, a2] = [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2, 1 + alpha, -2 * cos, 1 - alpha];
        break;
      case 'bandpass':
        [b0, b1, b2, a0, a1, a2] = [alpha, 0, -alpha, 1 + alpha, -2 * cos, 1 - alpha];
        break;
      case 'allpass':
        [b0, b1, b2, a0, a1, a2] = [1 - alpha, -2 * cos, 1 + alpha, 1 + alpha, -2 * cos, 1 - alpha];
        break;
      case 'peaking':
        [b0, b1, b2, a0, a1, a2] = [1 + alpha * A, -2 * cos, 1 - alpha * A, 1 + alpha / A, -2 * cos, 1 - alpha / A];
        break;
      case 'lowshelf':
        b0 = A * (A + 1 - (A - 1) * cos + s);
        b1 = 2 * A * (A - 1 - (A + 1) * cos);
        b2 = A * (A + 1 - (A - 1) * cos - s);
        a0 = A + 1 + (A - 1) * cos + s;
        a1 = -2 * (A - 1 + (A + 1) * cos);
        a2 = A + 1 + (A - 1) * cos - s;
        break;
      case 'highshelf':
        b0 = A * (A + 1 + (A - 1) * cos + s);
        b1 = -2 * A * (A - 1 + (A + 1) * cos);
        b2 = A * (A + 1 + (A - 1) * cos - s);
        a0 = A + 1 - (A - 1) * cos + s;
        a1 = 2 * (A - 1 - (A + 1) * cos);
        a2 = A + 1 - (A - 1) * cos - s;
        break;
    }

    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = a1 / a0;
    this.a2 = a2 / a0;
    return this;
  }

  process(x: number, ch = 0): number {
    const y = this.b0 * x + this.z1[ch];
    this.z1[ch] = this.b1 * x - this.a1 * y + this.z2[ch];
    this.z2[ch] = this.b2 * x - this.a2 * y;
    return y;
  }

  /** Linear magnitude of the transfer function at the given frequency. */
  magnitude(freq: number): number {
    const w = (2 * Math.PI * freq) / this.sampleRate;
    const c1 = Math.cos(w);
    const s1 = Math.sin(w);
    const c2 = Math.cos(2 * w);
    const s2 = Math.sin(2 * w);
    const nr = this.b0 + this.b1 * c1 + this.b2 * c2;
    const ni = -(this.b1 * s1 + this.b2 * s2);
    const dr = 1 + this.a1 * c1 + this.a2 * c2;
    const di = -(this.a1 * s1 + this.a2 * s2);
    return Math.sqrt((nr * nr + ni * ni) / (dr * dr + di * di));
  }

  reset(): void {
    this.z1 = [0, 0];
    this.z2 = [0, 0];
  }
}

/** Linkwitz-Riley 24 dB/oct split. Low + high sums to a 2nd-order allpass, so bands add up flat. */
export class Crossover {
  private lp: Biquad[];
  private hp: Biquad[];

  constructor(sampleRate: number, freq = 1000) {
    this.lp = [new Biquad(sampleRate), new Biquad(sampleRate)];
    this.hp = [new Biquad(sampleRate), new Biquad(sampleRate)];
    this.setFrequency(freq);
  }

  setFrequency(freq: number): void {
    this.lp.forEach((f) => f.set('lowpass', freq));
    this.hp.forEach((f) => f.set('highpass', freq));
  }

  low(x: number, ch: number): number {
    return this.lp[1].process(this.lp[0].process(x, ch), ch);
  }

  high(x: number, ch: number): number {
    return this.hp[1].process(this.hp[0].process(x, ch), ch);
  }

  lowMagnitude(freq: number): number {
    return this.lp[0].magnitude(freq) ** 2;
  }

  highMagnitude(freq: number): number {
    return this.hp[0].magnitude(freq) ** 2;
  }

  reset(): void {
    [...this.lp, ...this.hp].forEach((f) => f.reset());
  }
}
