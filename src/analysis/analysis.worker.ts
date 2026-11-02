import { createEffect } from '../dsp/effects';
import { BIN, type Analysis, type AnalysisRequest } from './types';

let source: { sampleRate: number; left: Float32Array; right: Float32Array } | null = null;
let pending: Extract<AnalysisRequest, { type: 'run' }> | null = null;
let busy = false;

self.onmessage = (e: MessageEvent<AnalysisRequest>) => {
  if (e.data.type === 'source') source = e.data;
  else pending = e.data;
  schedule();
};

// Parameter drags fire faster than a full pass takes, so only the latest request is computed.
function schedule(): void {
  if (busy || !pending || !source) return;
  busy = true;
  setTimeout(() => {
    const req = pending!;
    pending = null;
    const result = analyse(req);
    (self as unknown as Worker).postMessage(result, [result.input.buffer, result.output.buffer, result.gr.buffer, result.key.buffer, ...result.bands.map((b) => b.buffer)]);
    busy = false;
    schedule();
  }, 0);
}

function analyse(req: Extract<AnalysisRequest, { type: 'run' }>): Analysis {
  const { sampleRate, left, right } = source!;
  const effect = createEffect(req.device, sampleRate);
  effect.set(req.params);
  const l = left.slice();
  const r = right.slice();
  const bins = Math.ceil(l.length / BIN);
  const input = new Float32Array(bins);
  const output = new Float32Array(bins);
  const gr = new Float32Array(bins);
  const key = new Float32Array(bins);
  const bands = [0, 1, 2, 3].map(() => new Float32Array(bins));

  for (let b = 0; b < bins; b++) {
    const start = b * BIN;
    const end = Math.min(start + BIN, l.length);
    let peak = 0;
    for (let i = start; i < end; i++) peak = Math.max(peak, Math.abs(l[i]), Math.abs(r[i]));
    input[b] = peak;
    effect.process(l.subarray(start, end), r.subarray(start, end));
    peak = 0;
    for (let i = start; i < end; i++) peak = Math.max(peak, Math.abs(l[i]), Math.abs(r[i]));
    output[b] = peak;
    gr[b] = effect.meter.gr;
    key[b] = effect.meter.key;
    effect.meter.bands.forEach((v, k) => (bands[k][b] = v));
  }

  return { seq: req.seq, device: req.device, sampleRate, duration: l.length / sampleRate, input, output, gr, key, bands };
}
