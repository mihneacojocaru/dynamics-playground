import { defineStore } from 'pinia';
import { computed, ref, shallowRef, watch } from 'vue';
import { engine } from '../audio/AudioEngine';
import { hold, playhead, seek } from '../audio/clock';
import { loadSource, sourceFromFile, type AudioSource, type SourceId } from '../audio/sources';
import { DEVICES } from '../devices/definitions';
import type { DeviceId } from '../dsp/effects';
import type { Text } from '../i18n';
import { UI } from '../i18n/ui';
import { load, save } from './persist';

export const useTransportStore = defineStore('transport', () => {
  const saved = load('transport', { device: 'compressor' as DeviceId, source: '' as SourceId | '', volume: -6 });
  const fromHash = location.hash.slice(1) as DeviceId;
  const known = (id: string) => DEVICES.some((d) => d.id === id);
  const device = ref<DeviceId>(known(fromHash) ? fromHash : known(saved.device) ? saved.device : 'compressor');
  // One signal for all devices: switching the device keeps what you are listening to.
  const selected = ref<SourceId>(saved.source || DEVICES.find((d) => d.id === device.value)!.source);
  const volume = ref(saved.volume);
  const playing = ref(false);
  const frozen = ref(false);
  const loading = ref(false);
  const bypass = ref(false);
  const fileSource = shallowRef<AudioSource | null>(null);
  const fileName = ref('');
  const error = ref<Text | ''>('');

  watch([device, selected, volume], () => save('transport', { device: device.value, source: selected.value, volume: volume.value }));

  const info = computed(() => DEVICES.find((d) => d.id === device.value)!);
  const sourceId = computed<SourceId>(() => (selected.value === 'file' && !fileSource.value ? 'mix' : selected.value));
  const source = shallowRef<AudioSource | null>(null);
  const duration = computed(() => (source.value ? source.value.left.length / source.value.sampleRate : 1));

  watch(sourceId, async (id) => {
    if (id === 'file') {
      source.value = fileSource.value;
      return;
    }
    loading.value = true;
    error.value = '';
    try {
      const s = await loadSource(id);
      if (sourceId.value === id) source.value = s;
    } catch (e) {
      error.value = UI.errorLoad;
      console.error(e);
    } finally {
      loading.value = false;
    }
  }, { immediate: true });

  async function play(): Promise<void> {
    if (!source.value) return;
    error.value = '';
    if (frozen.value) setFrozen(false);
    try {
      await engine.play(source.value, playhead(duration.value));
      playing.value = true;
    } catch (e) {
      error.value = UI.errorAudio;
      console.error(e);
    }
  }

  function stop(): void {
    engine.stop();
    playing.value = false;
  }

  function toggle(): Promise<void> | void {
    return playing.value ? stop() : play();
  }

  /** Stops sound and animation so a single moment can be compared while changing settings. */
  function setFrozen(on: boolean): void {
    if (on) stop();
    hold(on, duration.value);
    frozen.value = on;
  }

  function scrub(seconds: number): void {
    seek(seconds, duration.value);
  }

  function selectSource(id: SourceId): void {
    selected.value = id;
  }

  async function loadFile(file: File): Promise<void> {
    error.value = '';
    try {
      fileSource.value = await sourceFromFile(file);
      fileName.value = file.name;
      if (selected.value === 'file') source.value = fileSource.value;
      selected.value = 'file';
    } catch (e) {
      error.value = UI.errorFile;
      console.error(e);
    }
  }

  watch(source, (s) => s && playing.value && engine.play(s, playhead(duration.value)));
  watch(device, (id) => {
    engine.setDevice(id);
    history.replaceState(null, '', `#${id}`);
  }, { immediate: true });
  addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (known(id)) device.value = id as DeviceId;
  });
  watch(bypass, (v) => engine.setBypass(v), { immediate: true });
  watch(volume, (v) => engine.setVolume(v), { immediate: true });

  return { device, info, sourceId, source, duration, volume, playing, frozen, loading, bypass, fileName, error, play, stop, toggle, setFrozen, scrub, selectSource, loadFile };
});
