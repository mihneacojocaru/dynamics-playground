<script setup lang="ts">
import { computed } from 'vue';
import { UI } from '../../i18n/ui';
import { dbToGain, gainToDb } from '../../dsp/math';
import { useMultibandStore } from '../../stores/devices';
import { useLiveStore } from '../../stores/live';
import FreqGraph, { type FreqPoint } from '../display/FreqGraph.vue';
import WaveScope from '../display/WaveScope.vue';
import { bandMagnitudes, BANDS } from './bands';

const p = useMultibandStore().params;
const { live } = useLiveStore();
const mags = computed(() => bandMagnitudes(p.low, p.mid, p.high));
const gains = computed(() => p.bands.map((b, i) => (b.active ? dbToGain(b.gain + live.bands[i]) : 1)));
const bandDb = (i: number) => (f: number) => gainToDb(mags.value(f)[i] * gains.value[i]);
const total = (f: number) => gainToDb(mags.value(f).reduce((s, m, i) => s + m * gains.value[i], 0));

const centers = computed(() => {
  const edges = [30, p.low, p.mid, p.high, 16000];
  return BANDS.map((_, i) => Math.sqrt(edges[i] * edges[i + 1]));
});

const points = computed<FreqPoint[]>(() => [
  ...[p.low, p.mid, p.high].map((f, i) => ({ id: `x${i}`, freq: f, db: -6, color: '#ffe100' })),
  ...BANDS.map((b, i) => ({ id: i, freq: centers.value[i], db: p.bands[i].gain, color: b.color })),
]);

const RANGES: Record<string, [number, number]> = { x0: [40, 500], x1: [200, 4000], x2: [1500, 15000] };

function onDrag(id: string | number, freq: number, db: number): void {
  if (typeof id === 'number') {
    p.bands[id].gain = Math.round(Math.max(-12, Math.min(12, db)) * 2) / 2;
    return;
  }
  const [min, max] = RANGES[id];
  const f = Math.round(Math.max(min, Math.min(max, freq)));
  if (id === 'x0') p.low = Math.min(f, p.mid * 0.8);
  if (id === 'x1') p.mid = Math.max(p.low * 1.25, Math.min(f, p.high * 0.8));
  if (id === 'x2') p.high = Math.max(f, p.mid * 1.25);
}
</script>

<template>
  <div class="display-stack">
    <FreqGraph :min-db="-24" :max-db="12" :points="points" :label="UI.bandsGr" @drag="onDrag">
      <template #default="{ path, H }">
        <path
          v-for="(b, i) in BANDS"
          :key="b.name"
          :d="`${path(bandDb(i))}L600,${H}L0,${H}Z`"
          :fill="b.color"
          :fill-opacity="p.bands[i].active ? 0.45 : 0.12"
          :stroke="b.color"
          stroke-width="1.5"
        />
        <path :d="path(total)" class="total" />
      </template>
    </FreqGraph>
    <WaveScope color="#17c4bd" />
  </div>
</template>

<style scoped>
.total {
  fill: none;
  stroke: #ffe100;
  stroke-width: 2.5;
}
</style>
