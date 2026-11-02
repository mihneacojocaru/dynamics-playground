<script setup lang="ts">
import { useLangStore } from '../../i18n';
import { UI } from '../../i18n/ui';
import { param, RELEASE } from '../../devices/params';
import { useLimiterStore } from '../../stores/devices';
import ParamBox from '../ui/ParamBox.vue';
import ToggleKey from '../ui/ToggleKey.vue';

const { tr } = useLangStore();

const store = useLimiterStore();
const p = store.params;
const THRESHOLD = param({ label: 'Threshold', min: -24, max: 0, def: -6, unit: 'dB', step: 0.5, help: { de: 'Treibt das Signal um diesen Wert in den Limiter: −6 dB Threshold = 6 dB lauter.', en: 'Drives the signal into the limiter by this amount: −6 dB threshold = 6 dB louder.' } });
const CEILING = param({ label: 'Ceiling', min: -12, max: 0, def: -1, unit: 'dB', step: 0.1, help: { de: 'Höchster Pegel, den der Ausgang je erreichen darf.', en: 'The highest level the output may ever reach.' } });
const LIMIT_RELEASE = { ...RELEASE, min: 1, max: 1000, def: 80 };
</script>

<template>
  <div class="device-panel">
    <div class="card-inset head">
      <h2 class="emboss">Brick<br />Wall</h2>
      <ParamBox v-model="p.release" :def="LIMIT_RELEASE" />
    </div>
    <div class="controls-row">
      <ParamBox v-model="p.threshold" :def="THRESHOLD" />
      <ParamBox v-model="p.ceiling" :def="CEILING" />
    </div>
    <p class="hint">{{ tr(UI.limiterHint) }}</p>
    <div class="controls-row">
      <div class="key-group">
        <span class="control-label">Preset</span>
        <ToggleKey tone="dark" @click="store.reset()">Reset</ToggleKey>
      </div>
    </div>
  </div>
</template>
