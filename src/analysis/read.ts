import { gainToDb, MIN_DB } from '../dsp/math';
import { BIN, type Analysis } from './types';

export interface Reading {
  input: number;
  output: number;
  gr: number;
  key: number;
  bands: number[];
}

export const SILENT: Reading = { input: MIN_DB, output: MIN_DB, gr: 0, key: MIN_DB, bands: [0, 0, 0, 0] };

/** Peak levels (dB) over a short window ending at time t, like a meter would show them. */
export function readAt(a: Analysis | null, t: number, windowMs = 30): Reading {
  if (!a) return SILENT;
  const bins = a.input.length;
  const end = Math.floor((t * a.sampleRate) / BIN) % bins;
  const span = Math.max(1, Math.round((windowMs / 1000) * (a.sampleRate / BIN)));
  let input = 0;
  let output = 0;
  let gr = 0;
  let key = MIN_DB;
  const bands = [0, 0, 0, 0];
  for (let k = 0; k < span; k++) {
    const i = (end - k + bins) % bins;
    input = Math.max(input, a.input[i]);
    output = Math.max(output, a.output[i]);
    gr = Math.min(gr, a.gr[i]);
    key = Math.max(key, a.key[i]);
    for (let j = 0; j < 4; j++) bands[j] = Math.min(bands[j], a.bands[j][i]);
  }
  return { input: gainToDb(input), output: gainToDb(output), gr, key, bands };
}
