<script setup lang="ts">
import { useEqStore } from '../../stores/devices';
import ParamBox from '../ui/ParamBox.vue';
import ToggleKey from '../ui/ToggleKey.vue';
import { EQ_COLORS, EQ_GAIN, EQ_NAMES, FREQ, HPF, LPF, Q } from './eq';

const store = useEqStore();
const p = store.params;
</script>

<template>
  <div class="device-panel">
    <div class="card-inset filters">
      <div class="key-group">
        <ParamBox v-model="p.hpf" :def="HPF" color="#9aa4a8" compact />
        <ToggleKey :on="p.hpfOn" tone="green" @click="p.hpfOn = !p.hpfOn">{{ p.hpfOn ? 'In' : 'Out' }}</ToggleKey>
      </div>
      <h2 class="emboss">PEQ</h2>
      <div class="key-group">
        <ParamBox v-model="p.lpf" :def="LPF" color="#9aa4a8" compact />
        <ToggleKey :on="p.lpfOn" tone="green" @click="p.lpfOn = !p.lpfOn">{{ p.lpfOn ? 'In' : 'Out' }}</ToggleKey>
      </div>
    </div>
    <div class="bands">
      <div v-for="(b, i) in p.bands" :key="i" class="band" :style="{ '--band': EQ_COLORS[i] }">
        <div class="band-head">
          <strong>{{ EQ_NAMES[i] }}</strong>
          <ToggleKey :on="b.active" @click="b.active = !b.active">{{ b.active ? 'In' : 'Out' }}</ToggleKey>
        </div>
        <ParamBox v-model="b.freq" :def="FREQ" :color="EQ_COLORS[i]" compact />
        <ParamBox v-model="b.q" :def="Q" :color="EQ_COLORS[i]" compact />
        <ParamBox v-model="b.gain" :def="EQ_GAIN" :color="EQ_COLORS[i]" compact />
        <ToggleKey v-if="i === 0 || i === p.bands.length - 1" :on="b.shelf" @click="b.shelf = !b.shelf">{{ b.shelf ? 'Shelf' : 'Bell' }}</ToggleKey>
      </div>
    </div>
    <div class="controls-row">
      <ToggleKey tone="dark" @click="store.reset()">Reset</ToggleKey>
    </div>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--gap);
  padding: var(--gap);
}

.bands {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr));
  gap: var(--gap-s);
}

.band {
  display: grid;
  gap: var(--gap-s);
  justify-items: stretch;
  padding: var(--gap-s);
  border: 2px solid var(--band);
  border-radius: var(--radius-s);
  background: rgb(0 0 0 / 0.18);
}

.band-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.band-head strong {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--band);
}

.band :deep(.key) {
  min-width: 0;
  padding: 0.25rem 0.5rem;
}

.band :deep(.param) {
  min-width: 0;
}
</style>
