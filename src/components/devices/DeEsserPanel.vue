<script setup lang="ts">
import { useLangStore } from '../../i18n';
import { UI } from '../../i18n/ui';
import { param } from '../../devices/params';
import { useDeEsserStore } from '../../stores/devices';
import { useLiveStore } from '../../stores/live';
import Knob from '../ui/Knob.vue';

const { tr } = useLangStore();

const store = useDeEsserStore();
const p = store.params;
const { live } = useLiveStore();
const FREQ = param({ label: 'Frequency', min: 2000, max: 12000, def: 6000, unit: 'Hz', log: true, help: { de: 'Bereich, in dem das Gerät nach S-Lauten sucht.', en: 'Range in which the device looks for S sounds.' } });
const THRESHOLD = param({ label: 'Threshold', min: -60, max: 0, def: -30, unit: 'dB', step: 0.5, help: { de: 'Ab diesem Pegel im S-Bereich wird abgesenkt.', en: 'Above this level in the S range, the signal is reduced.' } });
const REDUCTION = param({ label: 'Reduction', min: 0, max: 24, def: 12, unit: 'dB', step: 0.5, help: { de: 'Maximale Absenkung der Zischlaute.', en: 'Maximum reduction of the sibilants.' } });
const RESPONSE = param({ label: 'Response', min: 10, max: 300, def: 60, unit: 'ms', log: true, help: { de: 'Wie schnell die Absenkung wieder loslässt.', en: 'How fast the reduction lets go again.' } });
const LEDS = [20, 15, 10, 8, 6, 4, 2, 1, 0];
</script>

<template>
  <div class="deesser">
    <i class="screw tl"></i><i class="screw tr"></i><i class="screw bl"></i><i class="screw br"></i>
    <div class="brand">
      <span class="name">De-Esser</span>
      <span class="sub">Split-Band</span>
    </div>
    <div class="frame-line">
      <div class="listen">
        <span class="engraved">Listen</span>
        <button type="button" class="round" :class="{ on: p.listen }" :aria-pressed="p.listen" :title="tr(UI.listenHelp)" @click="p.listen = !p.listen"></button>
      </div>
      <Knob v-model="p.frequency" :def="FREQ" color="#1f8a3a" min-label="2k" max-label="12k" show-value />
    </div>
    <div class="leds" aria-label="Gain Reduction">
      <div v-for="l in LEDS" :key="l" class="led" :class="{ lit: l === 0 ? live.gr > -0.5 : -live.gr >= l, zero: l === 0 }">
        <span>{{ l }}</span>
      </div>
    </div>
    <div class="knobs">
      <Knob v-model="p.threshold" :def="THRESHOLD" color="#3a3d40" min-label="-60" max-label="0" />
      <Knob v-model="p.range" :def="REDUCTION" color="#d61f1f" min-label="Min" max-label="Max" />
      <Knob v-model="p.response" :def="RESPONSE" color="#1c1f21" min-label="Fast" max-label="Slow" />
    </div>
    <div class="switches">
      <div class="switch">
        <span class="engraved">Filter</span>
        <button type="button" :class="{ on: p.filter === 'highpass' }" @click="p.filter = 'highpass'">Shelf</button>
        <button type="button" :class="{ on: p.filter === 'bandpass' }" @click="p.filter = 'bandpass'">Band Pass</button>
      </div>
      <div class="switch">
        <span class="engraved">Mode</span>
        <button type="button" :class="{ on: p.mode === 'split' }" @click="p.mode = 'split'">Split</button>
        <button type="button" :class="{ on: p.mode === 'wide' }" @click="p.mode = 'wide'">Wide</button>
      </div>
      <button type="button" class="note" @click="store.reset()">Reset</button>
    </div>
  </div>
</template>

<style scoped>
.deesser {
  position: relative;
  display: grid;
  gap: 1.25rem;
  padding: 2rem 1.5rem;
  border-radius: var(--radius-s);
  background:
    repeating-linear-gradient(90deg, rgb(255 255 255 / 0.025) 0 1px, transparent 1px 3px),
    linear-gradient(160deg, #3a3c3e, #232526);
  box-shadow: inset 0 0 0 2px #111, 0 4px 12px rgb(0 0 0 / 0.5);
  color: #e6e6e6;
}

.screw {
  position: absolute;
  width: 1.1rem;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #d8d8d8, #7a7a7a);
  box-shadow: 0 1px 2px #000;
}

.screw::after {
  content: '';
  position: absolute;
  inset: 45% 15%;
  background: #555;
  transform: rotate(40deg);
}

.tl { top: 0.5rem; left: 0.5rem; }
.tr { top: 0.5rem; right: 0.5rem; }
.bl { bottom: 0.5rem; left: 0.5rem; }
.br { bottom: 0.5rem; right: 0.5rem; }

.brand {
  display: grid;
  justify-items: center;
  font-family: Georgia, 'Times New Roman', serif;
}

.brand .name {
  font-size: 2rem;
  color: #cfcfcf;
  border-bottom: 2px solid #8a8a8a;
  line-height: 1.1;
}

.brand .sub {
  font-size: 1rem;
  color: #b5b5b5;
}

.frame-line {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0.75rem 1rem;
  border: 2px solid #9a9a9a;
  border-radius: 0.6rem;
}

.engraved {
  font-family: Georgia, 'Times New Roman', serif;
  font-weight: 700;
  font-size: 1.05rem;
  color: #e9e9e9;
}

.listen {
  display: grid;
  justify-items: center;
  gap: 0.6rem;
}

.round {
  width: 2.6rem;
  aspect-ratio: 1;
  border-radius: 50%;
  border: 2px solid #222;
  background: radial-gradient(circle at 40% 35%, #fafafa, #9a9a9a 60%, #5a5a5a);
  box-shadow: 0 3px 5px rgb(0 0 0 / 0.7);
}

.round.on {
  background: radial-gradient(circle at 40% 35%, #fff6c8, #ffb300 55%, #a06000);
  box-shadow: 0 0 12px #ffb300;
}

.leds {
  display: flex;
  justify-content: center;
  gap: 2px;
}

.led {
  display: grid;
  justify-items: center;
  gap: 2px;
  font-size: 0.7rem;
  color: #ddd;
}

.led span {
  order: -1;
}

.led::after {
  content: '';
  width: 1.3rem;
  height: 1rem;
  border: 1px solid #000;
  background: #4a1010;
  transition: background 0.05s;
}

.led.lit::after {
  background: #ff2a2a;
  box-shadow: 0 0 6px #ff2a2a;
}

.led.zero::after {
  background: #123d18;
}

.led.zero.lit::after {
  background: #3ccf63;
  box-shadow: 0 0 6px #3ccf63;
}

.knobs {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  gap: var(--gap);
}

.switches {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: var(--gap) 1.5rem;
}

.switch {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.switch button {
  padding: 0.3rem 0.6rem;
  border: 1px solid #111;
  border-radius: 0.3rem;
  background: #2b2d2f;
  color: #bdbdbd;
  font-size: 0.9rem;
}

.switch button.on {
  color: #ffb300;
  box-shadow: inset 0 0 0 1px #ffb300;
}

.note {
  padding: 0.45rem 1rem;
  border: 0;
  background: #e2dc7a;
  color: #222;
  font-family: 'Marker Felt', 'Comic Sans MS', cursive;
  transform: rotate(-2deg);
  box-shadow: 0 2px 4px rgb(0 0 0 / 0.5);
}
</style>
