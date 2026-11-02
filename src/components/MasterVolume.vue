<script setup lang="ts">
import { useLangStore } from '../i18n';
import { UI } from '../i18n/ui';
import { computed } from 'vue';
import { formatValue, fromNormalized, param, toNormalized } from '../devices/params';
import { useTransportStore } from '../stores/transport';

const { tr } = useLangStore();

const transport = useTransportStore();
const VOLUME = param({ label: 'Master', min: -40, max: 6, def: -6, unit: 'dB', step: 0.5, help: { de: 'Abhörlautstärke, ändert nichts am Effekt.', en: 'Monitoring level, does not change the effect.' } });
const norm = computed(() => toNormalized(VOLUME, transport.volume));
const text = computed(() => (transport.volume <= VOLUME.min ? '-Inf dB' : formatValue(VOLUME, transport.volume)));

let startY = 0;
let startNorm = 0;

function set(n: number): void {
  transport.volume = fromNormalized(VOLUME, n);
}

function onDown(e: PointerEvent): void {
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  startY = e.clientY;
  startNorm = norm.value;
}

function onMove(e: PointerEvent): void {
  if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) set(startNorm + (startY - e.clientY) / 180);
}

function onKey(e: KeyboardEvent): void {
  const d = { ArrowUp: 0.02, ArrowRight: 0.02, ArrowDown: -0.02, ArrowLeft: -0.02 }[e.key];
  if (d === undefined) return;
  e.preventDefault();
  set(norm.value + d);
}
</script>

<template>
  <div class="master" :title="tr(VOLUME.help)">
    <div
      class="dial"
      role="slider"
      tabindex="0"
      :aria-label="tr(UI.master)"
      :aria-valuetext="text"
      :aria-valuenow="transport.volume"
      :aria-valuemin="VOLUME.min"
      :aria-valuemax="VOLUME.max"
      :style="{ '--angle': `${-135 + norm * 270}deg`, '--fill': norm }"
      @pointerdown="onDown"
      @pointermove="onMove"
      @wheel.prevent="set(norm - Math.sign($event.deltaY) * 0.02)"
      @keydown="onKey"
      @dblclick="transport.volume = VOLUME.def"
    >
      <i></i>
    </div>
    <div class="readout">
      <span>Master</span>
      <strong>{{ text }}</strong>
    </div>
  </div>
</template>

<style scoped>
.master {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dial {
  position: relative;
  width: 2.25rem;
  aspect-ratio: 1;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 50%, #062a35 52%, transparent 53%),
    conic-gradient(from -135deg, var(--accent-hi) calc(var(--fill) * 270deg), #1d2a2f 0 270deg, transparent 0);
  box-shadow: 0 0 0 2px #0b1214, 0 0 0.8rem color-mix(in srgb, var(--accent) 45%, transparent);
  cursor: ns-resize;
  touch-action: none;
}

.dial i {
  position: absolute;
  inset: 0;
  transform: rotate(var(--angle));
  transition: transform 0.06s linear;
}

.dial i::after {
  content: '';
  position: absolute;
  left: calc(50% - 1.5px);
  top: 18%;
  width: 3px;
  height: 30%;
  border-radius: 2px;
  background: var(--text);
}

.readout {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.readout span {
  font-size: 0.8rem;
  color: var(--text-dim);
}

.readout strong {
  min-width: 4.5rem;
  color: var(--accent-hi);
  font-variant-numeric: tabular-nums;
}
</style>
