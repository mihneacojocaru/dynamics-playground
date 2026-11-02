<script setup lang="ts">
import { useLangStore } from '../../i18n';
import { UI } from '../../i18n/ui';
import { computed, ref } from 'vue';
import { engine } from '../../audio/AudioEngine';
import { useFrame } from '../../composables/useFrame';
import { useEqStore } from '../../stores/devices';
import { useTransportStore } from '../../stores/transport';
import FreqGraph, { type FreqPoint } from '../display/FreqGraph.vue';
import { EQ_COLORS, eqCurves } from './eq';

const { tr } = useLangStore();

const p = useEqStore().params;
const transport = useTransportStore();
const curves = computed(() => eqCurves(p));

const points = computed<FreqPoint[]>(() => [
  ...p.bands.map((b, i) => ({ id: i, freq: b.freq, db: b.active ? b.gain : 0, color: EQ_COLORS[i], filled: false })),
  ...(p.hpfOn ? [{ id: 'hpf', freq: p.hpf, db: -3, color: '#c8d0d3' }] : []),
  ...(p.lpfOn ? [{ id: 'lpf', freq: p.lpf, db: -3, color: '#c8d0d3' }] : []),
]);

function onDrag(id: string | number, freq: number, db: number): void {
  const f = Math.round(freq);
  if (id === 'hpf') p.hpf = Math.min(1000, Math.max(20, f));
  else if (id === 'lpf') p.lpf = Math.min(20000, Math.max(1000, f));
  else {
    p.bands[id as number].freq = f;
    p.bands[id as number].gain = Math.round(Math.max(-18, Math.min(18, db)) * 10) / 10;
  }
}

function onWheel(id: string | number, delta: number): void {
  if (typeof id !== 'number') return;
  const b = p.bands[id];
  b.q = Math.round(Math.min(10, Math.max(0.3, b.q * (delta > 0 ? 0.9 : 1.1))) * 100) / 100;
}

const rta = ref('');
const spectrum = new Float32Array(2048);

useFrame(() => {
  const a = engine.analyser.output;
  if (!transport.playing || !a) {
    rta.value = '';
    return;
  }
  a.getFloatFrequencyData(spectrum);
  const binHz = a.context.sampleRate / a.fftSize;
  let d = '';
  for (let i = 0; i < 120; i++) {
    const f = 20 * Math.pow(1000, i / 119);
    const v = spectrum[Math.min(spectrum.length - 1, Math.round(f / binHz))];
    // Spectrum dBFS (−100…−20) is mapped onto the lower part of the graph.
    const y = 360 - Math.max(0, Math.min(1, (v + 100) / 80)) * 300;
    d += `${i ? 'L' : 'M'}${((i / 119) * 600).toFixed(1)},${y.toFixed(1)}`;
  }
  rta.value = `${d}L600,360L0,360Z`;
});
</script>

<template>
  <div class="display-stack eq-display">
    <FreqGraph :height="360" :points="points" label="EQ-Kurve" @drag="onDrag" @wheel="onWheel">
      <template #default="{ path, y }">
        <path v-if="rta" :d="rta" class="rta" />
        <path v-for="(c, i) in EQ_COLORS" :key="c" :d="path(curves.band(i))" :stroke="c" class="band" />
        <path :d="`${path(curves.total)}L600,${y(0)}L0,${y(0)}Z`" class="total-fill" />
        <path :d="path(curves.total)" class="total" />
      </template>
    </FreqGraph>
    <p class="hint">{{ tr(UI.eqHint) }} · {{ tr(transport.playing ? UI.eqRtaOn : UI.eqRtaOff) }}</p>
  </div>
</template>

<style scoped>
.eq-display {
  grid-template-rows: auto auto;
  align-content: start;
}

.rta {
  fill: rgb(60 207 99 / 0.18);
  stroke: rgb(60 207 99 / 0.6);
  stroke-width: 1;
}

.band {
  fill: none;
  stroke-width: 1.5;
  opacity: 0.6;
}

.total-fill {
  fill: rgb(216 200 74 / 0.4);
}

.total {
  fill: none;
  stroke: #e8d84a;
  stroke-width: 3;
}
</style>
