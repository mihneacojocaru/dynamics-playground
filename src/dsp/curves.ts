/** Static input→output curves in dB. They drive the DSP and draw the transfer graphs. */

export interface CompressorCurve {
  threshold: number;
  ratio: number;
  knee: number;
}

export function compressorCurve(x: number, { threshold, ratio, knee }: CompressorCurve): number {
  const over = x - threshold;
  if (knee > 0 && Math.abs(over) <= knee / 2) {
    return x + ((1 / ratio - 1) * (over + knee / 2) ** 2) / (2 * knee);
  }
  return over > 0 ? threshold + over / ratio : x;
}

export interface ExpanderCurve {
  threshold: number;
  ratio: number;
  range: number;
}

/** Downward expander; a gate is an expander with a very steep ratio. */
export function expanderCurve(x: number, { threshold, ratio, range }: ExpanderCurve): number {
  if (x >= threshold) return x;
  return Math.max(threshold + (x - threshold) * ratio, x - range);
}

export function limiterCurve(x: number, drive: number, ceiling: number): number {
  return Math.min(x + drive, ceiling);
}
