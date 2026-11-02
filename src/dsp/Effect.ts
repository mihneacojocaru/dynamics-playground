export interface EffectMeter {
  /** Strongest gain reduction of the last block in dB (≤ 0). */
  gr: number;
  /** Level of the detector / key signal in dBFS. */
  key: number;
  /** Per-band gain reduction (multiband only). */
  bands: number[];
}

export abstract class Effect<P> {
  readonly meter: EffectMeter = { gr: 0, key: -120, bands: [] };

  constructor(protected sampleRate: number) {}

  abstract set(params: P): void;

  abstract reset(): void;

  /** Processes both channels in place. */
  abstract process(left: Float32Array, right: Float32Array): void;

  protected beginBlock(): void {
    this.meter.gr = 0;
    this.meter.key = -120;
  }

  protected track(gr: number, key: number): void {
    if (gr < this.meter.gr) this.meter.gr = gr;
    if (key > this.meter.key) this.meter.key = key;
  }
}
