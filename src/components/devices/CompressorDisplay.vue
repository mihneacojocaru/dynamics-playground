<script setup lang="ts">
import { computed } from 'vue';
import { compressorCurve } from '../../dsp/curves';
import { SOFT_KNEE_DB } from '../../dsp/effects/Compressor';
import { useCompressorStore } from '../../stores/devices';
import type { CurvePoint } from '../display/TransferCurve.vue';
import WaveScope from '../display/WaveScope.vue';
import MeteredCurve from './MeteredCurve.vue';

const p = useCompressorStore().params;

const curve = computed(() => {
  const c = { threshold: p.threshold, ratio: p.ratio, knee: p.softKnee ? SOFT_KNEE_DB : 0 };
  return (x: number) => compressorCurve(x, c) + p.gain;
});

const LOW = -57;
const HIGH = 9;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// Red sets the make-up gain, green the threshold, blue the ratio (how flat the line runs above the threshold).
const points = computed<CurvePoint[]>(() => [
  { x: LOW, color: 'var(--point-low)', axis: 'y', drag: (_, y) => (p.gain = Math.round(clamp(y - LOW, -12, 24) * 2) / 2) },
  { x: p.threshold, color: 'var(--point-knee)', drag: (x) => (p.threshold = Math.min(0, x)) },
  {
    x: HIGH,
    color: 'var(--point-high)',
    axis: 'y',
    drag: (_, y) => {
      const rise = y - p.gain - p.threshold;
      p.ratio = rise <= 0 ? 20 : Math.round(clamp((HIGH - p.threshold) / rise, 1, 20) * 10) / 10;
    },
  },
]);
</script>

<template>
  <div class="display-stack">
    <MeteredCurve :curve="curve" :points="points" />
    <WaveScope :lines="[{ db: p.threshold, color: '#9ccc3c', label: 'Threshold' }]" />
  </div>
</template>
