import { watch } from 'vue';
import { engine } from '../audio/AudioEngine';
import type { DeviceId } from '../dsp/effects';
import { useAnalysisStore } from '../stores/analysis';
import { DEVICE_STORES } from '../stores/devices';
import { useTransportStore } from '../stores/transport';

/** Pushes store changes to the audio worklet and the analysis worker. */
export function useSync(): void {
  const transport = useTransportStore();
  const analysis = useAnalysisStore();
  const ids = Object.keys(DEVICE_STORES) as DeviceId[];
  const paramsOf = (id: DeviceId) => DEVICE_STORES[id]().params;
  const rerun = () => analysis.run(transport.device, paramsOf(transport.device));

  watch(() => transport.source, (s) => {
    if (!s) return;
    analysis.setSource(s);
    rerun();
  }, { immediate: true });

  watch(() => transport.device, rerun);

  for (const id of ids) {
    watch(() => paramsOf(id), (p) => {
      engine.setParams(id, p);
      if (transport.device === id) analysis.run(id, p);
    }, { deep: true, immediate: true });
  }
}
