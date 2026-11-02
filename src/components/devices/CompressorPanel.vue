<script setup lang="ts">
import { ATTACK, GAIN, param, RATIO, RELEASE, THRESHOLD } from '../../devices/params';
import { useCompressorStore } from '../../stores/devices';
import ParamBox from '../ui/ParamBox.vue';
import ToggleKey from '../ui/ToggleKey.vue';

const store = useCompressorStore();
const p = store.params;
const MIX = param({ label: 'Mix', min: 0, max: 100, def: 100, unit: '%', step: 1, help: { de: 'Parallel-Kompression: mischt das unbearbeitete Signal dazu. 100 % = nur komprimiert.', en: 'Parallel compression: blends in the unprocessed signal. 100 % = compressed only.' } });
</script>

<template>
  <div class="device-panel">
    <div class="card-inset head">
      <h2 class="emboss">Comp<br />{{ p.detector === 'rms' ? 'RMS' : 'Peak' }}</h2>
      <ParamBox v-model="p.attack" :def="ATTACK" />
      <ParamBox v-model="p.release" :def="RELEASE" />
    </div>
    <div class="param-grid">
      <ParamBox v-model="p.threshold" :def="THRESHOLD" />
      <ParamBox v-model="p.ratio" :def="RATIO" />
      <ParamBox v-model="p.gain" :def="GAIN" />
      <ParamBox v-model="p.mix" :def="MIX" />
    </div>
    <div class="controls-row">
      <div class="key-group">
        <span class="control-label">Soft Knee</span>
        <ToggleKey :on="p.softKnee" @click="p.softKnee = !p.softKnee">{{ p.softKnee ? 'On' : 'Off' }}</ToggleKey>
      </div>
      <div class="key-group">
        <span class="control-label">Detector</span>
        <div>
          <ToggleKey :on="p.detector === 'peak'" @click="p.detector = 'peak'">Peak</ToggleKey>
          <ToggleKey :on="p.detector === 'rms'" @click="p.detector = 'rms'">RMS</ToggleKey>
        </div>
      </div>
      <div class="key-group">
        <span class="control-label">Preset</span>
        <ToggleKey tone="dark" @click="store.reset()">Reset</ToggleKey>
      </div>
    </div>
  </div>
</template>
