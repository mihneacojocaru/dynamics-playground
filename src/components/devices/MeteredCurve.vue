<script setup lang="ts">
import { useLangStore } from '../../i18n';
import { UI } from '../../i18n/ui';
import { useLiveStore } from '../../stores/live';
import TransferCurve, { type CurvePoint } from '../display/TransferCurve.vue';
import LevelMeter from '../ui/LevelMeter.vue';

const { tr } = useLangStore();

withDefaults(defineProps<{ curve: (x: number) => number; points: CurvePoint[]; keyMeter?: boolean; grRange?: number }>(), {
  keyMeter: false,
  grRange: 24,
});
const { live } = useLiveStore();
</script>

<template>
  <div class="curve-row">
    <div class="meter-col"><span>IN</span><LevelMeter :db="live.input" :label="tr(UI.input)" /></div>
    <div v-if="keyMeter" class="meter-col"><span>KEY</span><LevelMeter :db="live.key" :label="tr(UI.keySignal)" /></div>
    <div class="meter-col"><span>GR</span><LevelMeter :db="live.gr" gr :min="-grRange" label="Gain Reduction" /></div>
    <TransferCurve :curve="curve" :points="points" :input="keyMeter ? live.key : live.input" />
    <div class="meter-col"><span>OUT</span><LevelMeter :db="live.output" :label="tr(UI.output)" /></div>
  </div>
</template>
