import { defineStore } from 'pinia';
import { reactive, watch } from 'vue';
import { DEFAULTS, type DeviceParamMap } from '../devices/definitions';
import type { DeviceId } from '../dsp/effects';
import { load, save } from './persist';

function defineDeviceStore<K extends DeviceId>(id: K) {
  return defineStore(`device-${id}`, () => {
    const params = reactive(load(id, DEFAULTS[id])) as DeviceParamMap[K];
    watch(params, (value) => save(id, value), { deep: true });

    function reset(): void {
      Object.assign(params, structuredClone(DEFAULTS[id]));
    }

    return { params, reset };
  });
}

export const useCompressorStore = defineDeviceStore('compressor');
export const useLimiterStore = defineDeviceStore('limiter');
export const useGateStore = defineDeviceStore('gate');
export const useMultibandStore = defineDeviceStore('multiband');
export const useDeEsserStore = defineDeviceStore('deesser');
export const useEqStore = defineDeviceStore('eq');

export const DEVICE_STORES = {
  compressor: useCompressorStore,
  limiter: useLimiterStore,
  gate: useGateStore,
  multiband: useMultibandStore,
  deesser: useDeEsserStore,
  eq: useEqStore,
} as const;
