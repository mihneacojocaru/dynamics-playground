<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { BIN } from '../../analysis/types';
import { useLangStore } from '../../i18n';
import { UI } from '../../i18n/ui';
import { useFrame } from '../../composables/useFrame';
import { gainToDb } from '../../dsp/math';
import { useAnalysisStore } from '../../stores/analysis';
import { useLiveStore } from '../../stores/live';
import { useTransportStore } from '../../stores/transport';

export interface ScopeLine {
  db: number;
  color: string;
  label: string;
}

const props = withDefaults(defineProps<{ lines?: ScopeLine[]; color?: string; showKey?: boolean; seconds?: number }>(), {
  lines: () => [],
  color: '#10aef0',
  showKey: false,
  seconds: 3,
});

const FLOOR = -60;
const GR_RANGE = 24;
const canvas = ref<HTMLCanvasElement>();
const analysis = useAnalysisStore();
const live = useLiveStore();
const transport = useTransportStore();
const { tr } = useLangStore();
let ctx: CanvasRenderingContext2D | null = null;
let observer: ResizeObserver | null = null;

const norm = (db: number) => Math.min(1, Math.max(0, (db - FLOOR) / -FLOOR));

function resize(): void {
  const c = canvas.value!;
  const dpr = window.devicePixelRatio || 1;
  c.width = Math.round(c.clientWidth * dpr);
  c.height = Math.round(c.clientHeight * dpr);
  ctx = c.getContext('2d');
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
}

onMounted(() => {
  resize();
  observer = new ResizeObserver(resize);
  observer.observe(canvas.value!);
});
onBeforeUnmount(() => observer?.disconnect());

// In freeze mode dragging the scope moves the frozen moment through the loop.
let dragX: number | null = null;

function onDown(e: PointerEvent): void {
  if (!transport.frozen) return;
  dragX = e.clientX;
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
}

function onMove(e: PointerEvent): void {
  if (dragX === null || !canvas.value) return;
  const dt = ((dragX - e.clientX) / canvas.value.clientWidth) * props.seconds;
  dragX = e.clientX;
  transport.scrub(live.live.time + dt);
}

useFrame(draw);

function draw(): void {
  const a = analysis.result;
  const c = canvas.value;
  const g = ctx;
  if (!g || !c || !a) return;
  const w = c.clientWidth;
  const h = c.clientHeight;
  const lane = Math.round(h * 0.2);
  const mid = lane + (h - lane) / 2;
  const half = (h - lane) / 2 - 6;
  const now = live.live.time;
  const head = w * 0.75;
  const binsPerPx = ((props.seconds * a.sampleRate) / BIN) / w;
  const total = a.input.length;

  g.clearRect(0, 0, w, h);
  g.fillStyle = '#0c0e0f';
  g.fillRect(0, 0, w, h);

  g.strokeStyle = '#22292c';
  g.lineWidth = 1;
  for (const db of [-48, -36, -24, -12, -6]) {
    const y = half * norm(db);
    g.beginPath();
    g.moveTo(0, mid - y);
    g.lineTo(w, mid - y);
    g.moveTo(0, mid + y);
    g.lineTo(w, mid + y);
    g.stroke();
  }

  const column = (x: number) => {
    const start = Math.floor(((now - ((head - x) / w) * props.seconds) * a.sampleRate) / BIN);
    let inp = 0;
    let out = 0;
    let gr = 0;
    let key = -120;
    for (let k = 0; k < Math.max(1, Math.ceil(binsPerPx)); k++) {
      const i = (((start + k) % total) + total) % total;
      inp = Math.max(inp, a.input[i]);
      out = Math.max(out, a.output[i]);
      gr = Math.min(gr, a.gr[i]);
      key = Math.max(key, a.key[i]);
    }
    return { inp: norm(gainToDb(inp)), out: norm(gainToDb(out)), gr, key: norm(key) };
  };

  const cols = Array.from({ length: Math.ceil(w) }, (_, x) => column(x));
  const fillEnvelope = (pick: (v: (typeof cols)[number]) => number, style: string) => {
    g.beginPath();
    cols.forEach((v, x) => g.lineTo(x, mid - half * pick(v)));
    for (let x = cols.length - 1; x >= 0; x--) g.lineTo(x, mid + half * pick(cols[x]));
    g.closePath();
    g.fillStyle = style;
    g.fill();
  };

  if (!transport.bypass) {
    g.globalAlpha = 0.8;
    fillEnvelope((v) => v.out, props.color);
    g.globalAlpha = 1;
  }
  // The input is drawn as an outline on top so the difference to the output stays visible.
  g.strokeStyle = transport.bypass ? 'rgba(200, 210, 214, 0.9)' : 'rgba(220, 228, 231, 0.75)';
  g.lineWidth = 1.25;
  for (const sign of [-1, 1]) {
    g.beginPath();
    cols.forEach((v, x) => g.lineTo(x, mid + sign * half * v.inp));
    g.stroke();
  }

  if (props.showKey) {
    g.strokeStyle = '#ffe100';
    g.lineWidth = 1.5;
    g.beginPath();
    cols.forEach((v, x) => g.lineTo(x, mid - half * v.key));
    g.stroke();
  }

  g.fillStyle = '#121618';
  g.fillRect(0, 0, w, lane);
  g.beginPath();
  g.moveTo(0, 0);
  cols.forEach((v, x) => g.lineTo(x, (Math.min(GR_RANGE, -v.gr) / GR_RANGE) * lane));
  g.lineTo(w, 0);
  g.closePath();
  g.fillStyle = '#ff7a1a';
  g.fill();
  g.strokeStyle = '#3b4246';
  g.beginPath();
  g.moveTo(0, lane + 0.5);
  g.lineTo(w, lane + 0.5);
  g.stroke();

  g.setLineDash([6, 5]);
  g.lineWidth = 1.5;
  g.font = '600 11px Helvetica Neue, Arial, sans-serif';
  props.lines.forEach((line, n) => {
    const y = half * norm(line.db);
    g.strokeStyle = line.color;
    g.beginPath();
    g.moveTo(0, mid - y);
    g.lineTo(w, mid - y);
    g.moveTo(0, mid + y);
    g.lineTo(w, mid + y);
    g.stroke();
    g.fillStyle = line.color;
    g.fillText(line.label, 6 + n * 80, mid - y - 4);
  });
  g.setLineDash([]);

  g.fillStyle = 'rgba(12, 14, 15, 0.45)';
  g.fillRect(head, lane + 1, w - head, h - lane);
  g.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(head + 0.5, 0);
  g.lineTo(head + 0.5, h);
  g.stroke();

  g.fillStyle = '#c8d2d6';
  g.fillText('GAIN REDUCTION', 6, 13);
  if (transport.frozen) {
    // Bottom-left on a dark plate, away from the IN/OUT legend in the top-right corner.
    const label = tr(UI.scopeFrozen);
    const tw = g.measureText(label).width;
    g.fillStyle = 'rgba(12, 14, 15, 0.85)';
    g.fillRect(4, h - 22, tw + 12, 18);
    g.fillStyle = '#ffe100';
    g.fillText(label, 10, h - 9);
  }
  g.fillStyle = '#dce4e7';
  g.fillText('IN', w - 64, lane + 16);
  g.fillStyle = props.color;
  g.fillText('OUT', w - 40, lane + 16);
}
</script>

<template>
  <canvas
    ref="canvas"
    class="scope"
    :class="{ scrub: transport.frozen }"
    @pointerdown="onDown"
    @pointermove="onMove"
    @pointerup="dragX = null"
    @pointercancel="dragX = null"
    :aria-label="tr(UI.scope)"></canvas>
</template>

<style scoped>
.scope {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 12rem;
  border: 2px solid #8d989c;
  touch-action: pan-y;
}

.scope.scrub {
  cursor: ew-resize;
  touch-action: none;
}
</style>
