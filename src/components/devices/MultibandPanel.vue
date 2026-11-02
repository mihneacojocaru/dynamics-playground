<script setup lang="ts">
import { ATTACK, GAIN, param, RATIO, RELEASE, THRESHOLD } from '../../devices/params';
import { useMultibandStore } from '../../stores/devices';
import { useLiveStore } from '../../stores/live';
import LevelMeter from '../ui/LevelMeter.vue';
import ParamBox from '../ui/ParamBox.vue';
import ToggleKey from '../ui/ToggleKey.vue';
import { BANDS } from './bands';

const store = useMultibandStore();
const p = store.params;
const { live } = useLiveStore();
const X_LOW = param({ label: 'Split 1', min: 40, max: 500, def: 120, unit: 'Hz', log: true, help: { de: 'Trennfrequenz zwischen LF und LM.', en: 'Crossover between LF and LM.' } });
const X_MID = param({ label: 'Split 2', min: 200, max: 4000, def: 800, unit: 'Hz', log: true, help: { de: 'Trennfrequenz zwischen LM und HM.', en: 'Crossover between LM and HM.' } });
const X_HIGH = param({ label: 'Split 3', min: 1500, max: 15000, def: 5000, unit: 'Hz', log: true, help: { de: 'Trennfrequenz zwischen HM und HF.', en: 'Crossover between HM and HF.' } });
</script>

<template>
  <div class="device-panel">
    <div class="card-inset head">
      <h2 class="emboss">Multi<br />Band 4</h2>
      <ParamBox v-model="p.attack" :def="ATTACK" />
      <ParamBox v-model="p.release" :def="RELEASE" />
    </div>
    <div class="param-grid">
      <ParamBox v-model="p.low" :def="X_LOW" color="#ffe100" compact />
      <ParamBox v-model="p.mid" :def="X_MID" color="#ffe100" compact />
      <ParamBox v-model="p.high" :def="X_HIGH" color="#ffe100" compact />
    </div>
    <div class="strips">
      <div v-for="(b, i) in p.bands" :key="i" class="strip" :style="{ '--band': BANDS[i].color }">
        <div class="strip-head">
          <strong>{{ BANDS[i].name }}</strong>
          <ToggleKey :on="b.active" @click="b.active = !b.active">{{ b.active ? 'In' : 'Out' }}</ToggleKey>
        </div>
        <div class="strip-body">
          <div class="strip-params">
            <ParamBox v-model="b.threshold" :def="THRESHOLD" :color="BANDS[i].color" label="Thres" compact />
            <ParamBox v-model="b.ratio" :def="RATIO" :color="BANDS[i].color" compact />
            <ParamBox v-model="b.gain" :def="GAIN" :color="BANDS[i].color" compact />
          </div>
          <LevelMeter :db="live.bands[i]" gr :min="-18" :label="`Gain Reduction ${BANDS[i].name}`" />
        </div>
      </div>
    </div>
    <div class="controls-row">
      <ToggleKey tone="dark" @click="store.reset()">Reset</ToggleKey>
    </div>
  </div>
</template>

<style scoped>
.strips {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--gap-s);
}

.strip {
  display: grid;
  gap: var(--gap-s);
  padding: var(--gap-s);
  border: 2px solid var(--band);
  border-radius: var(--radius-s);
  background: rgb(0 0 0 / 0.18);
}

.strip-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.strip-head strong {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--band);
}

.strip-head :deep(.key) {
  min-width: 3.5rem;
  padding: 0.25rem 0.5rem;
}

.strip-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--gap-s);
}

.strip-params {
  display: grid;
  gap: var(--gap-s);
}

.strip-params :deep(.param) {
  min-width: 0;
}
</style>
