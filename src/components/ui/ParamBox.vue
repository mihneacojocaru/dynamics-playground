<script setup lang="ts">
import { useLangStore } from '../../i18n';
import { computed } from 'vue';
import { formatValue, fromNormalized, toNormalized, type NumberParam } from '../../devices/params';

const { tr } = useLangStore();

const props = withDefaults(defineProps<{ def: NumberParam; color?: string; label?: string; compact?: boolean }>(), {
  color: 'var(--accent)',
  label: undefined,
});
const value = defineModel<number>({ required: true });

const norm = computed(() => toNormalized(props.def, value.value));
const text = computed(() => formatValue(props.def, value.value));

function setNorm(n: number): void {
  value.value = fromNormalized(props.def, n);
}

let startY = 0;
let startX = 0;
let startNorm = 0;

function onDown(e: PointerEvent): void {
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  startY = e.clientY;
  startX = e.clientX;
  startNorm = norm.value;
}

function onMove(e: PointerEvent): void {
  if (!(e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) return;
  const travel = e.shiftKey ? 800 : 200;
  setNorm(startNorm + (startY - e.clientY + (e.clientX - startX)) / travel);
}

function onWheel(e: WheelEvent): void {
  setNorm(norm.value - Math.sign(e.deltaY) * (e.shiftKey ? 0.005 : 0.02));
}

function onKey(e: KeyboardEvent): void {
  const step = e.shiftKey ? 0.005 : 0.02;
  const map: Record<string, number> = { ArrowUp: step, ArrowRight: step, ArrowDown: -step, ArrowLeft: -step };
  if (e.key in map) {
    e.preventDefault();
    setNorm(norm.value + map[e.key]);
  } else if (e.key === 'Home' || e.key === 'Delete') {
    value.value = props.def.def;
  }
}
</script>

<template>
  <div class="param" :class="{ compact }" :style="{ '--param': color }" :title="tr(def.help)">
    <span class="param_label">{{ label ?? def.label }}</span>
    <div
      class="param_box"
      role="slider"
      tabindex="0"
      :aria-label="label ?? def.label"
      :aria-valuemin="def.min"
      :aria-valuemax="def.max"
      :aria-valuenow="value"
      :aria-valuetext="text"
      @pointerdown="onDown"
      @pointermove="onMove"
      @wheel.prevent="onWheel"
      @keydown="onKey"
      @dblclick="value = def.def"
    >
      {{ text }}
    </div>
    <div class="param_bar"><i :style="{ transform: `scaleX(${norm})` }"></i></div>
  </div>
</template>

<style scoped>
.param {
  display: grid;
  justify-items: center;
  gap: 0.2rem;
  min-width: 7rem;
}

.param_label {
  font-size: 1rem;
  color: var(--text);
  text-shadow: 0 1px 0 var(--emboss);
}

.param_box {
  width: 100%;
  padding: 0.35rem 0.5rem;
  border: 2px solid var(--param);
  border-radius: 0 var(--radius) 0 0;
  background: var(--screen);
  font-size: 1.15rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  cursor: ns-resize;
  touch-action: none;
  user-select: none;
  transition: box-shadow 0.15s;
}

.param_box:hover,
.param_box:focus-visible {
  box-shadow: 0 0 0.6rem color-mix(in srgb, var(--param) 55%, transparent);
  outline: none;
}

.param_bar {
  width: 100%;
  height: 0.6rem;
  padding: 2px;
  border: 2px solid var(--param);
  border-top: 0;
  border-radius: 0 0 0 var(--radius);
  background: var(--screen);
}

.param_bar i {
  display: block;
  height: 100%;
  background: linear-gradient(#e9eef0, #8f9a9e);
  border-radius: 0 2px 2px 0;
  transform-origin: left;
  transition: transform 0.08s linear;
}

.compact {
  min-width: 5.5rem;
}

.compact .param_label {
  font-size: 0.8rem;
  color: var(--text-dim);
}

.compact .param_box {
  font-size: 0.95rem;
  padding: 0.25rem 0.35rem;
}
</style>
