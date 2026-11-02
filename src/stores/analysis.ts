import { defineStore } from 'pinia';
import { markRaw, shallowRef } from 'vue';
import type { AudioSource } from '../audio/sources';
import type { DeviceId } from '../dsp/effects';
import type { Analysis, AnalysisRequest } from '../analysis/types';

/** Runs the active effect offline over the whole loop in a worker; the displays read from the result. */
export const useAnalysisStore = defineStore('analysis', () => {
  const result = shallowRef<Analysis | null>(null);
  const worker = new Worker(new URL('../analysis/analysis.worker.ts', import.meta.url), { type: 'module' });
  let seq = 0;

  worker.onmessage = (e: MessageEvent<Analysis>) => {
    if (e.data.seq > (result.value?.seq ?? -1)) result.value = markRaw(e.data);
  };

  function post(msg: AnalysisRequest): void {
    worker.postMessage(msg);
  }

  function setSource(s: AudioSource): void {
    post({ type: 'source', sampleRate: s.sampleRate, left: s.left, right: s.right });
  }

  function run(device: DeviceId, params: unknown): void {
    post({ type: 'run', seq: ++seq, device, params: JSON.parse(JSON.stringify(params)) });
  }

  return { result, setSource, run };
});
