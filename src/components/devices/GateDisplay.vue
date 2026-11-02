<script setup lang="ts">
import { useLangStore } from '../../i18n';
import { UI } from '../../i18n/ui';
import { computed } from 'vue';
import { expanderCurve } from '../../dsp/curves';
import { GATE_RATIO } from '../../dsp/effects/Gate';
import { useGateStore } from '../../stores/devices';
import { useLiveStore } from '../../stores/live';
import type { CurvePoint } from '../display/TransferCurve.vue';
import WaveScope from '../display/WaveScope.vue';
import MeteredCurve from './MeteredCurve.vue';

const { tr } = useLangStore();

const p = useGateStore().params;
const { live } = useLiveStore();
const curve = computed(() => {
  const c = { threshold: p.threshold, range: p.range, ratio: p.mode === 'gate' ? GATE_RATIO : p.ratio };
  return (x: number) => expanderCurve(x, c);
});
// Yellow: threshold (drag sideways). Red: where the curve reaches full depth (drag up/down sets depth).
const points = computed<CurvePoint[]>(() => {
  const ratio = p.mode === 'gate' ? GATE_RATIO : p.ratio;
  const floor = p.threshold - (p.range * ratio) / (ratio - 1);
  return [
    { x: p.threshold, color: 'var(--point-gate)', drag: (x) => (p.threshold = Math.min(0, x)) },
    {
      x: floor + p.range,
      y: floor,
      color: 'var(--point-low)',
      axis: 'y',
      drag: (_, y) => (p.range = Math.round(Math.max(0, Math.min(80, ((p.threshold - y) * (ratio - 1)) / ratio)) * 2) / 2),
    },
  ];
});
const open = computed(() => live.gr > -p.range * 0.5);
</script>

<template>
  <div class="display-stack">
    <div class="gate-top">
      <MeteredCurve :curve="curve" :points="points" key-meter :gr-range="80" />
      <div class="state" :class="{ open }" aria-live="off">{{ tr(open ? UI.open : UI.closed) }}</div>
    </div>
    <WaveScope show-key color="#e0c21a" :lines="[{ db: p.threshold, color: '#ffe100', label: 'Threshold' }]" />
  </div>
</template>

<style scoped>
.gate-top {
  position: relative;
}

.state {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  padding: 0.2rem 0.6rem;
  border: 2px solid #5b2020;
  border-radius: var(--radius-s);
  background: #2a0d0d;
  color: #ff6b6b;
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  transition: background 0.08s, color 0.08s, border-color 0.08s;
}

.state.open {
  border-color: #1d6b33;
  background: #0d2a16;
  color: var(--on-green-hi);
}
</style>
