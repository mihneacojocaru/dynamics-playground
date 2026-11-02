import { Crossover } from '../../dsp/Biquad';

export const BANDS = [
  { name: 'LF', color: '#d6339f' },
  { name: 'LM', color: '#17c4bd' },
  { name: 'HM', color: '#3e6fff' },
  { name: 'HF', color: '#ff5a1f' },
];

/** Linear magnitude of each band of the LR4 split, for drawing. */
export function bandMagnitudes(low: number, mid: number, high: number): (f: number) => number[] {
  const [a, b, c] = [low, mid, high].map((f) => new Crossover(48000, f));
  return (f) => {
    const hp1 = a.highMagnitude(f);
    const hp2 = b.highMagnitude(f);
    return [a.lowMagnitude(f), hp1 * b.lowMagnitude(f), hp1 * hp2 * c.lowMagnitude(f), hp1 * hp2 * c.highMagnitude(f)];
  };
}
