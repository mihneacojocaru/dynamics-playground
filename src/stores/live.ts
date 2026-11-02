import { defineStore } from 'pinia';
import { reactive } from 'vue';
import { readAt } from '../analysis/read';
import { playhead } from '../audio/clock';
import { useAnalysisStore } from './analysis';
import { useTransportStore } from './transport';

const FALL_DB_PER_S = 24;

/** Meter values at the playhead, updated every animation frame. */
export const useLiveStore = defineStore('live', () => {
  const live = reactive({ time: 0, input: -120, output: -120, gr: 0, key: -120, bands: [0, 0, 0, 0] });
  let last = performance.now();

  function tick(): void {
    const now = performance.now();
    const fall = ((now - last) / 1000) * FALL_DB_PER_S;
    last = now;
    const transport = useTransportStore();
    live.time = playhead(transport.duration);
    const r = readAt(useAnalysisStore().result, live.time);
    live.input = Math.max(r.input, live.input - fall);
    live.output = Math.max(r.output, live.output - fall);
    live.key = Math.max(r.key, live.key - fall);
    live.gr = r.gr;
    r.bands.forEach((v, i) => (live.bands[i] = v));
  }

  return { live, tick };
});
