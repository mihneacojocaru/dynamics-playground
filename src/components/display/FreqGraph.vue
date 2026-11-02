<script setup lang="ts">
import { useLangStore, type Text } from '../../i18n';
import { UI } from '../../i18n/ui';
import { computed, ref } from 'vue';

const { tr } = useLangStore();

export interface FreqPoint {
  id: string | number;
  freq: number;
  db: number;
  color: string;
  filled?: boolean;
}

export interface FreqScale {
  x: (f: number) => number;
  y: (db: number) => number;
  W: number;
  H: number;
  /** SVG path of a response function sampled on a log frequency axis. */
  path: (fn: (f: number) => number) => string;
}

const props = withDefaults(
  defineProps<{ minDb?: number; maxDb?: number; dbStep?: number; height?: number; points?: FreqPoint[]; label?: Text | string }>(),
  { minDb: -18, maxDb: 18, dbStep: 6, height: 300, points: () => [], label: () => UI.response },
);
const emit = defineEmits<{ drag: [id: FreqPoint['id'], freq: number, db: number]; wheel: [id: FreqPoint['id'], delta: number] }>();

const W = 600;
const F_MIN = 20;
const F_MAX = 20000;
const svg = ref<SVGSVGElement>();
const H = computed(() => props.height);

const x = (f: number) => (Math.log10(f / F_MIN) / Math.log10(F_MAX / F_MIN)) * W;
const y = (db: number) => {
  const c = Math.max(props.minDb - 6, Math.min(props.maxDb + 6, db));
  return ((props.maxDb - c) / (props.maxDb - props.minDb)) * H.value;
};
const fromX = (px: number) => F_MIN * Math.pow(F_MAX / F_MIN, px / W);
const fromY = (py: number) => props.maxDb - (py / H.value) * (props.maxDb - props.minDb);

function path(fn: (f: number) => number): string {
  let d = '';
  for (let i = 0; i <= 240; i++) {
    const f = F_MIN * Math.pow(F_MAX / F_MIN, i / 240);
    d += `${i ? 'L' : 'M'}${x(f).toFixed(1)},${y(fn(f)).toFixed(1)}`;
  }
  return d;
}

const scale = computed<FreqScale>(() => ({ x, y, W, H: H.value, path }));

const freqLines = computed(() => {
  const lines: { f: number; label?: string }[] = [];
  for (const decade of [10, 100, 1000, 10000]) {
    for (let m = 1; m <= 9; m++) {
      const f = decade * m;
      if (f < F_MIN || f > F_MAX) continue;
      const label = f === 100 ? '100' : f === 1000 ? '1k' : f === 10000 ? '10k' : f === 50 ? '50' : f === 500 ? '500' : f === 5000 ? '5k' : undefined;
      lines.push({ f, label });
    }
  }
  return lines;
});

const dbLines = computed(() => {
  const list: number[] = [];
  for (let v = props.minDb; v <= props.maxDb; v += props.dbStep) list.push(v);
  return list;
});

let dragging: FreqPoint['id'] | null = null;

function toLocal(e: PointerEvent): [number, number] {
  const r = svg.value!.getBoundingClientRect();
  return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H.value];
}

function onDown(e: PointerEvent, id: FreqPoint['id']): void {
  dragging = id;
  svg.value?.setPointerCapture(e.pointerId);
}

function onMove(e: PointerEvent): void {
  if (dragging === null) return;
  const [px, py] = toLocal(e);
  emit('drag', dragging, fromX(Math.max(0, Math.min(W, px))), fromY(Math.max(0, Math.min(H.value, py))));
}
</script>

<template>
  <svg
    ref="svg"
    class="freq"
    :viewBox="`0 0 ${W} ${H}`"
    role="img"
    :aria-label="tr(label)"
    @pointermove="onMove"
    @pointerup="dragging = null"
    @pointercancel="dragging = null"
  >
    <rect :width="W" :height="H" class="bg" />
    <g class="grid">
      <line v-for="l in freqLines" :key="l.f" :x1="x(l.f)" :x2="x(l.f)" y1="0" :y2="H" :class="{ major: l.label }" />
      <line v-for="d in dbLines" :key="d" x1="0" :x2="W" :y1="y(d)" :y2="y(d)" :class="{ major: d === 0 }" />
      <text v-for="l in freqLines.filter((l) => l.label)" :key="`t${l.f}`" :x="x(l.f) + 4" :y="H - 8" class="label">{{ l.label }}</text>
      <text v-for="d in dbLines.filter((d) => d !== minDb && d !== maxDb)" :key="`d${d}`" x="8" :y="y(d) + 4" class="label">{{ Math.abs(d) }}</text>
    </g>
    <slot v-bind="scale" />
    <circle
      v-for="p in points"
      :key="p.id"
      :cx="x(p.freq)"
      :cy="y(p.db)"
      r="10"
      class="point"
      :stroke="p.color"
      :fill="p.filled ? p.color : 'transparent'"
      @pointerdown="onDown($event, p.id)"
      @wheel.prevent="emit('wheel', p.id, Math.sign($event.deltaY))"
    />
  </svg>
</template>

<style scoped>
.freq {
  display: block;
  width: 100%;
  height: auto;
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

.grid line.major {
  stroke: var(--screen-grid-strong);
}

.label {
  fill: var(--text);
  font-size: 14px;
  font-weight: 700;
}

.point {
  stroke-width: 3;
  cursor: grab;
}

.point:hover {
  filter: drop-shadow(0 0 4px currentColor);
}
</style>
