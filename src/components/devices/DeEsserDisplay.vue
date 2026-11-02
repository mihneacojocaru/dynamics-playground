<script setup lang="ts">
import { computed } from 'vue';
import { useLangStore } from '../../i18n';
import { UI } from '../../i18n/ui';
import { Biquad } from '../../dsp/Biquad';
import { gainToDb } from '../../dsp/math';
import { useDeEsserStore } from '../../stores/devices';
import { useLiveStore } from '../../stores/live';
import FreqGraph from '../display/FreqGraph.vue';
import WaveScope from '../display/WaveScope.vue';

const p = useDeEsserStore().params;
const { live } = useLiveStore();
const { tr } = useLangStore();
const filter = computed(() => new Biquad(48000).set(p.filter, p.frequency, p.filter === 'bandpass' ? 1.4 : Math.SQRT1_2));
const keyCurve = (f: number) => gainToDb(filter.value.magnitude(f));
// What the output does: in split mode only the highs above the frequency are lowered.
const outCurve = (f: number) => {
  if (p.mode === 'wide') return live.gr;
  const hp = new Biquad(48000).set('highpass', p.frequency).magnitude(f) ** 2;
  return gainToDb(1 - hp + hp * Math.pow(10, live.gr / 20));
};
const activity = computed(() => Math.min(1, Math.max(0.12, (live.key - p.threshold + 12) / 18)));
</script>

<template>
  <div class="display-stack">
    <FreqGraph :min-db="-24" :max-db="6" :height="260" :points="[{ id: 'f', freq: p.frequency, db: 0, color: '#3ccf63' }]" :label="UI.deessCurve" @drag="(_, f) => (p.frequency = Math.round(Math.max(2000, Math.min(12000, f))))">
      <template #default="{ path, H }">
        <path :d="`${path(keyCurve)}L600,${H}L0,${H}Z`" class="key" :style="{ fillOpacity: activity }" />
        <path :d="path(keyCurve)" class="key-line" />
        <path :d="path(outCurve)" class="out-line" />
      </template>
    </FreqGraph>
    <div class="legend"><span class="k">{{ tr(UI.deessKey) }}</span><span class="o">{{ tr(UI.deessOut) }}</span></div>
    <WaveScope show-key color="#c9a227" :lines="[{ db: p.threshold, color: '#ffe100', label: 'Threshold' }]" />
  </div>
</template>

<style scoped>
.display-stack {
  grid-template-rows: auto auto minmax(12rem, 1fr);
}

.key {
  fill: #3ccf63;
  transition: fill-opacity 0.05s;
}

.key-line {
  fill: none;
  stroke: #3ccf63;
  stroke-width: 2;
}

.out-line {
  fill: none;
  stroke: #ff4d4d;
  stroke-width: 3;
}

.legend {
  display: flex;
  gap: var(--gap);
  font-size: 0.85rem;
  margin-top: calc(var(--gap) * -0.5);
}

.k {
  color: #3ccf63;
}

.o {
  color: #ff6b6b;
}
</style>
