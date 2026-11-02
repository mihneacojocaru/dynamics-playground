<script setup lang="ts">
import { useLangStore } from '../../i18n';
import { UI } from '../../i18n/ui';
import { computed, ref } from 'vue';

const { tr } = useLangStore();

export interface CurvePoint {
  x: number;
  /** Output level; defaults to the curve value at x. */
  y?: number;
  color: string;
  /** Called with the input (x) and output (y) level under the pointer while dragging. */
  drag?: (x: number, y: number) => void;
  axis?: 'x' | 'y' | 'xy';
}

const props = withDefaults(defineProps<{ curve: (x: number) => number; points: CurvePoint[]; input: number; min?: number; max?: number }>(), {
  min: -60,
  max: 12,
});

const SIZE = 320;
const PAD = 4;
const svg = ref<SVGSVGElement>();

const toX = (db: number) => PAD + ((db - props.min) / (props.max - props.min)) * (SIZE - 2 * PAD);
const toY = (db: number) => SIZE - PAD - ((Math.max(props.min, Math.min(props.max, db)) - props.min) / (props.max - props.min)) * (SIZE - 2 * PAD);

const ticks = computed(() => {
  const list: number[] = [];
  for (let v = Math.ceil(props.min / 10) * 10; v <= props.max; v += 10) list.push(v);
  return list;
});

const path = computed(() => {
  const steps = 160;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const x = props.min + ((props.max - props.min) * i) / steps;
    d += `${i ? 'L' : 'M'}${toX(x).toFixed(1)},${toY(props.curve(x)).toFixed(1)}`;
  }
  return d;
});

const area = computed(() => `${path.value}L${toX(props.max)},${SIZE - PAD}L${toX(props.min)},${SIZE - PAD}Z`);

const live = computed(() => {
  const x = Math.max(props.min, Math.min(props.max, props.input));
  return { cx: toX(x), cy: toY(props.curve(x)), visible: props.input > props.min };
});

let dragging: CurvePoint | null = null;

function startDrag(e: PointerEvent, p: CurvePoint): void {
  if (!p.drag) return;
  dragging = p;
  svg.value?.setPointerCapture(e.pointerId);
}

function onMove(e: PointerEvent): void {
  if (!dragging?.drag || !svg.value) return;
  const r = svg.value.getBoundingClientRect();
  const span = props.max - props.min;
  const toDb = (px: number) => props.min + ((px - PAD) / (SIZE - 2 * PAD)) * span;
  const clampDb = (db: number) => Math.max(props.min, Math.min(props.max, db));
  const x = toDb(((e.clientX - r.left) / r.width) * SIZE);
  const y = toDb(SIZE - ((e.clientY - r.top) / r.height) * SIZE);
  dragging.drag(Math.round(clampDb(x) * 2) / 2, Math.round(clampDb(y) * 10) / 10);
}
</script>

<template>
  <svg
    ref="svg"
    class="curve"
    :viewBox="`0 0 ${SIZE} ${SIZE}`"
    role="img"
    :aria-label="tr(UI.curve)"
    @pointermove="onMove"
    @pointerup="dragging = null"
    @pointercancel="dragging = null"
  >
    <rect :width="SIZE" :height="SIZE" class="bg" />
    <g class="grid">
      <template v-for="t in ticks" :key="t">
        <line :x1="toX(t)" :x2="toX(t)" :y1="PAD" :y2="SIZE - PAD" :class="{ zero: t === 0 }" />
        <line :y1="toY(t)" :y2="toY(t)" :x1="PAD" :x2="SIZE - PAD" :class="{ zero: t === 0 }" />
        <text v-if="t % 20 === 0" :x="toX(t) + 4" :y="SIZE - 10" class="label">{{ t }}</text>
        <text v-if="t % 20 === 0 && t > min" :x="PAD + 22" :y="toY(t) + 4" class="label">{{ t }}</text>
      </template>
    </g>
    <line :x1="toX(min)" :y1="toY(min)" :x2="toX(max)" :y2="toY(max)" class="unity" />
    <path :d="area" class="area" />
    <path :d="path" class="line" />
    <circle v-if="live.visible" :cx="live.cx" :cy="live.cy" r="6" class="live" />
    <line v-if="live.visible" :x1="live.cx" :x2="live.cx" :y1="SIZE - PAD" :y2="live.cy" class="live-drop" />
    <g v-for="(p, i) in points" :key="i" :class="['point', p.drag && `drag-${p.axis ?? 'x'}`]" @pointerdown="startDrag($event, p)">
      <circle :cx="toX(p.x)" :cy="toY(p.y ?? curve(p.x))" r="11" class="ring" :stroke="p.color" />
      <circle v-if="p.drag" :cx="toX(p.x)" :cy="toY(p.y ?? curve(p.x))" r="24" class="hit" />
    </g>
  </svg>
</template>

<style scoped>
.curve {
  display: block;
  user-select: none;
  -webkit-user-select: none;
  width: 100%;
  height: auto;
  aspect-ratio: 1;
  border: 2px solid #8d989c;
  touch-action: none;
}

.bg {
  fill: var(--screen);
}

.grid line {
  stroke: var(--screen-grid);
  stroke-width: 1;
}

.grid line.zero {
  stroke: var(--screen-grid-strong);
}

.label {
  fill: var(--text);
  font-size: 13px;
  font-weight: 700;
}

.unity {
  stroke: #3a4246;
  stroke-dasharray: 4 5;
}

.area {
  fill: rgb(255 255 255 / 0.06);
}

.line {
  fill: none;
  stroke: #9aa4a8;
  stroke-width: 2.5;
}

.ring {
  fill: transparent;
  stroke-width: 3;
  pointer-events: none;
}

.hit {
  fill: transparent;
}

.drag-x {
  cursor: ew-resize;
}

.drag-y {
  cursor: ns-resize;
}

.drag-xy {
  cursor: move;
}

.point[class*='drag-']:hover .ring {
  fill: rgb(255 255 255 / 0.15);
  stroke-width: 4;
}

.live {
  fill: var(--point-gate);
  filter: drop-shadow(0 0 6px var(--point-gate));
}

.live-drop {
  stroke: color-mix(in srgb, var(--point-gate) 45%, transparent);
  stroke-width: 1.5;
  stroke-dasharray: 2 3;
}
</style>
