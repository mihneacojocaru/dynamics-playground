<script setup lang="ts">
import { useLangStore } from '../../i18n';
import { computed } from 'vue';
import { formatValue, fromNormalized, toNormalized, type NumberParam } from '../../devices/params';

const { tr } = useLangStore();

const props = withDefaults(defineProps<{ def: NumberParam; color?: string; minLabel?: string; maxLabel?: string; showValue?: boolean }>(), {
  color: '#1c1f21',
  minLabel: 'Min',
  maxLabel: 'Max',
  showValue: false,
});
const value = defineModel<number>({ required: true });
const norm = computed(() => toNormalized(props.def, value.value));
const angle = computed(() => -135 + norm.value * 270);
const text = computed(() => formatValue(props.def, value.value));

let startY = 0;
let startNorm = 0;

function onDown(e: PointerEvent): void {
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  startY = e.clientY;
  startNorm = norm.value;
}

function onMove(e: PointerEvent): void {
  if (!(e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) return;
  value.value = fromNormalized(props.def, startNorm + (startY - e.clientY) / (e.shiftKey ? 600 : 160));
}

function onKey(e: KeyboardEvent): void {
  const d = { ArrowUp: 0.02, ArrowRight: 0.02, ArrowDown: -0.02, ArrowLeft: -0.02 }[e.key];
  if (d === undefined) return;
  e.preventDefault();
  value.value = fromNormalized(props.def, norm.value + d);
}
</script>

<template>
  <div class="knob-wrap" :title="tr(def.help)">
    <span class="knob-label">{{ def.label }}</span>
    <div class="knob-body">
      <span v-if="showValue" class="knob-value">{{ text }}</span>
      <div
        class="knob"
        role="slider"
        tabindex="0"
        :aria-label="def.label"
        :aria-valuetext="text"
        :aria-valuenow="value"
        :aria-valuemin="def.min"
        :aria-valuemax="def.max"
        :style="{ '--knob': color, '--angle': `${angle}deg` }"
        @pointerdown="onDown"
        @pointermove="onMove"
        @wheel.prevent="value = fromNormalized(def, norm - Math.sign($event.deltaY) * 0.02)"
        @keydown="onKey"
        @dblclick="value = def.def"
      >
        <i></i>
      </div>
      <span class="knob-min">{{ minLabel }}</span>
      <span class="knob-max">{{ maxLabel }}</span>
    </div>
  </div>
</template>

<style scoped>
.knob-wrap {
  display: grid;
  justify-items: center;
  gap: 0.35rem;
}

.knob-label {
  font-family: Georgia, 'Times New Roman', serif;
  font-weight: 700;
  font-size: 1.15rem;
  color: #e9e9e9;
  text-shadow: 0 1px 2px #000;
}

.knob-body {
  position: relative;
  padding: 0 1.6rem 1.1rem;
}

.knob {
  position: relative;
  width: 4.5rem;
  aspect-ratio: 1;
  border-radius: 50%;
  border: 3px solid #d9d9d9;
  background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--knob) 55%, white), var(--knob) 55%, color-mix(in srgb, var(--knob) 60%, black));
  box-shadow: 0 4px 8px rgb(0 0 0 / 0.7), inset 0 2px 2px rgb(255 255 255 / 0.25);
  cursor: ns-resize;
  touch-action: none;
}

.knob i {
  position: absolute;
  inset: 0;
  transform: rotate(var(--angle));
  transition: transform 0.06s linear;
}

.knob i::after {
  content: '';
  position: absolute;
  left: calc(50% - 2px);
  top: 6%;
  width: 4px;
  height: 42%;
  border-radius: 2px;
  background: #f4f4f4;
  box-shadow: 0 0 2px #000;
}

.knob-min,
.knob-max {
  position: absolute;
  bottom: 0;
  font-size: 0.75rem;
  color: #ddd;
}

.knob-min {
  left: 0;
}

.knob-max {
  right: 0;
}

.knob-value {
  position: absolute;
  left: -4.5rem;
  top: 0.3rem;
  min-width: 4.2rem;
  padding: 0.2rem 0.4rem;
  border-radius: 0 0.5rem 0 0;
  background: #1a1a1a;
  color: #9a9a9a;
  font-size: 0.95rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
