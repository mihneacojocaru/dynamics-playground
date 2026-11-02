<script setup lang="ts">
import { computed } from 'vue';
import { limiterCurve } from '../../dsp/curves';
import { useLimiterStore } from '../../stores/devices';
import type { CurvePoint } from '../display/TransferCurve.vue';
import WaveScope from '../display/WaveScope.vue';
import MeteredCurve from './MeteredCurve.vue';

const p = useLimiterStore().params;
const curve = computed(() => (x: number) => limiterCurve(x, -p.threshold, p.ceiling));
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const setCeiling = (y: number) => (p.ceiling = clamp(y, -12, 0));
// The knee sits where input + drive reaches the ceiling: left/right sets threshold, up/down the ceiling.
const points = computed<CurvePoint[]>(() => [
  { x: -57, color: 'var(--point-low)', axis: 'y', drag: (_, y) => (p.threshold = Math.round(clamp(-57 - y, -24, 0) * 2) / 2) },
  {
    x: p.ceiling + p.threshold,
    color: 'var(--point-knee)',
    axis: 'xy',
    drag: (x, y) => {
      setCeiling(y);
      p.threshold = clamp(Math.round((x - p.ceiling) * 2) / 2, -24, 0);
    },
  },
  { x: 9, color: 'var(--point-high)', axis: 'y', drag: (_, y) => setCeiling(y) },
]);
</script>

<template>
  <div class="display-stack">
    <MeteredCurve :curve="curve" :points="points" />
    <WaveScope
      color="#f2b01b"
      :lines="[
        { db: p.ceiling, color: '#ff4d4d', label: 'Ceiling' },
        { db: p.threshold + p.ceiling, color: '#9ccc3c', label: 'Threshold' },
      ]"
    />
  </div>
</template>
