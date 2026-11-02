export const MIN_DB = -120;

export const dbToGain = (db: number): number => Math.pow(10, db / 20);

export const gainToDb = (gain: number): number => (gain > 1e-6 ? 20 * Math.log10(gain) : MIN_DB);

export const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

export const timeCoef = (ms: number, sampleRate: number): number =>
  ms <= 0 ? 0 : Math.exp(-1 / (ms * 0.001 * sampleRate));

/** One-pole smoothing in dB that moves towards the target with separate times for falling and rising. */
export class Ballistics {
  value = 0;
  private fall = 0;
  private rise = 0;

  setTimes(fallMs: number, riseMs: number, sampleRate: number): void {
    this.fall = timeCoef(fallMs, sampleRate);
    this.rise = timeCoef(riseMs, sampleRate);
  }

  next(target: number): number {
    const c = target < this.value ? this.fall : this.rise;
    this.value = target + c * (this.value - target);
    return this.value;
  }

  reset(value = 0): void {
    this.value = value;
  }
}

export type DetectorMode = 'peak' | 'rms';

/** Level detector returning dBFS. Peak follows instantly and decays, RMS averages over ~10 ms. */
export class LevelDetector {
  private state = 0;
  private peakDecay: number;
  private rmsCoef: number;

  constructor(sampleRate: number, public mode: DetectorMode = 'peak') {
    this.peakDecay = timeCoef(5, sampleRate);
    this.rmsCoef = timeCoef(10, sampleRate);
  }

  next(x: number): number {
    const a = Math.abs(x);
    if (this.mode === 'peak') {
      this.state = a > this.state ? a : this.state * this.peakDecay;
      return gainToDb(this.state);
    }
    this.state = x * x + this.rmsCoef * (this.state - x * x);
    return this.state > 1e-12 ? 10 * Math.log10(this.state) : MIN_DB;
  }

  reset(): void {
    this.state = 0;
  }
}
