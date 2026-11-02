import type { DeviceId } from '../dsp/effects';

export const BIN = 256;

export interface Analysis {
  seq: number;
  device: DeviceId;
  sampleRate: number;
  duration: number;
  /** Per bin of BIN samples: input and output peak (linear), gain reduction and key level (dB). */
  input: Float32Array;
  output: Float32Array;
  gr: Float32Array;
  key: Float32Array;
  bands: Float32Array[];
}

export type AnalysisRequest =
  | { type: 'source'; sampleRate: number; left: Float32Array; right: Float32Array }
  | { type: 'run'; seq: number; device: DeviceId; params: unknown };
