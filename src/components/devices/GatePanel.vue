<script setup lang="ts">
import { UI } from '../../i18n/ui';
import { ATTACK, param, RATIO, RELEASE } from '../../devices/params';
import { Biquad } from '../../dsp/Biquad';
import { gainToDb } from '../../dsp/math';
import { useGateStore } from '../../stores/devices';
import FreqGraph from '../display/FreqGraph.vue';
import ParamBox from '../ui/ParamBox.vue';
import ToggleKey from '../ui/ToggleKey.vue';

const store = useGateStore();
const p = store.params;
const THRESHOLD = param({ label: 'Threshold', min: -80, max: 0, def: -36, unit: 'dB', step: 0.5, help: { de: 'Unter diesem Pegel schließt das Gate.', en: 'Below this level the gate closes.' } });
const RANGE = param({ label: 'Depth', min: 0, max: 80, def: 40, unit: 'dB', step: 0.5, help: { de: 'Um wie viel dB das Signal abgesenkt wird, wenn das Gate zu ist.', en: 'How many dB the signal is lowered when the gate is closed.' } });
const HOLD = param({ label: 'Hold', min: 0, max: 500, def: 60, unit: 'ms', step: 1, help: { de: 'So lange bleibt das Gate nach dem Unterschreiten noch offen.', en: 'How long the gate stays open after the level drops below the threshold.' } });
const GATE_ATTACK = { ...ATTACK, min: 0.05, max: 50, def: 0.5, help: { de: 'Wie schnell das Gate öffnet.', en: 'How fast the gate opens.' } };
const GATE_RELEASE = { ...RELEASE, def: 120, help: { de: 'Wie schnell das Gate schließt.', en: 'How fast the gate closes.' } };
const EXP_RATIO = { ...RATIO, min: 1, max: 8, def: 2, help: { de: 'Expander: 1:2 heißt, unter dem Threshold fällt der Pegel doppelt so schnell.', en: 'Expander: 1:2 means that below the threshold the level falls twice as fast.' } };
const HPF = param({ label: 'HPF', min: 20, max: 2000, def: 80, unit: 'Hz', log: true, help: { de: 'Key-Filter: das Gate hört tiefe Frequenzen darunter nicht.', en: 'Key filter: the gate ignores low frequencies below this.' } });
const LPF = param({ label: 'LPF', min: 1000, max: 20000, def: 8000, unit: 'Hz', log: true, help: { de: 'Key-Filter: das Gate hört hohe Frequenzen darüber nicht (z. B. Becken).', en: 'Key filter: the gate ignores high frequencies above this (e.g. cymbals).' } });

function response(f: number): number {
  const sr = 48000;
  const h = new Biquad(sr).set('highpass', p.keyHpf).magnitude(f);
  const l = new Biquad(sr).set('lowpass', p.keyLpf).magnitude(f);
  return gainToDb(h * l);
}

function onDrag(id: string | number, freq: number): void {
  if (id === 'hpf') p.keyHpf = Math.round(Math.min(2000, Math.max(20, freq)));
  else p.keyLpf = Math.round(Math.min(20000, Math.max(1000, freq)));
}
</script>

<template>
  <div class="device-panel">
    <div class="card-inset head">
      <h2 class="emboss">{{ p.mode === 'gate' ? 'Gate' : 'Expander' }}</h2>
      <ParamBox v-model="p.attack" :def="GATE_ATTACK" />
      <ParamBox v-model="p.hold" :def="HOLD" />
      <ParamBox v-model="p.release" :def="GATE_RELEASE" />
    </div>
    <div class="param-grid">
      <ParamBox v-model="p.threshold" :def="THRESHOLD" />
      <ParamBox v-model="p.range" :def="RANGE" />
      <ParamBox v-if="p.mode === 'expander'" v-model="p.ratio" :def="EXP_RATIO" />
    </div>
    <div class="controls-row">
      <div class="key-group">
        <span class="control-label">Mode</span>
        <div>
          <ToggleKey :on="p.mode === 'gate'" @click="p.mode = 'gate'">Gate</ToggleKey>
          <ToggleKey :on="p.mode === 'expander'" @click="p.mode = 'expander'">Expander</ToggleKey>
        </div>
      </div>
      <div class="key-group">
        <span class="control-label">Preset</span>
        <ToggleKey tone="dark" @click="store.reset()">Reset</ToggleKey>
      </div>
    </div>
    <div class="card-inset keyfilter">
      <div class="controls-row">
        <ParamBox v-model="p.keyHpf" :def="HPF" color="#3ccf63" compact />
        <div class="key-group">
          <span class="control-label">Key Filter</span>
          <ToggleKey :on="p.keyFilter" @click="p.keyFilter = !p.keyFilter">{{ p.keyFilter ? 'In' : 'Out' }}</ToggleKey>
        </div>
        <ParamBox v-model="p.keyLpf" :def="LPF" color="#ff4d4d" compact />
      </div>
      <FreqGraph
        :height="180"
        :min-db="-24"
        :max-db="6"
        :points="[
          { id: 'hpf', freq: p.keyHpf, db: response(p.keyHpf), color: '#3ccf63' },
          { id: 'lpf', freq: p.keyLpf, db: response(p.keyLpf), color: '#ff4d4d' },
        ]"
        :label="UI.keyFilter"
        @drag="onDrag"
      >
        <template #default="{ path, H }">
          <path :d="`${path(response)}L600,${H}L0,${H}Z`" :class="['kf-area', { off: !p.keyFilter }]" />
          <path :d="path(response)" :class="['kf-line', { off: !p.keyFilter }]" />
        </template>
      </FreqGraph>
    </div>
  </div>
</template>

<style scoped>
.keyfilter {
  display: grid;
  gap: var(--gap-s);
  padding: var(--gap);
}

.kf-area {
  fill: rgb(255 255 255 / 0.07);
}

.kf-line {
  fill: none;
  stroke: #b8c2c6;
  stroke-width: 2.5;
}

.off {
  opacity: 0.35;
}
</style>
