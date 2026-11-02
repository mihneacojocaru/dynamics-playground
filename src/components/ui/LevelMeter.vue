<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{ db: number; min?: number; max?: number; gr?: boolean; label?: string }>(), {
  min: -60,
  max: 6,
  gr: false,
  label: undefined,
});

/** Fraction of the meter that is lit; a GR meter grows downwards from 0 dB. */
const fill = computed(() => {
  if (props.gr) return Math.min(1, Math.max(0, -props.db / -props.min));
  return Math.min(1, Math.max(0, (props.db - props.min) / (props.max - props.min)));
});
</script>

<template>
  <div class="meter" :class="{ 'meter-gr': gr }" :aria-label="label" role="meter" :aria-valuenow="Math.round(db)" :aria-valuemin="min" :aria-valuemax="max">
    <i :style="{ '--fill': fill }"></i>
  </div>
</template>

<style scoped>
.meter {
  position: relative;
  width: 1.1rem;
  min-height: 6rem;
  border: 1px solid #4a5357;
  border-radius: 2px;
  background: linear-gradient(to top, #0a2a12 0 75%, #2f2a08 75% 90%, #3a0b0b 90%);
  overflow: hidden;
}

.meter i {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, var(--meter-green) 0 75%, var(--meter-yellow) 75% 90%, var(--meter-red) 90%);
  clip-path: inset(calc((1 - var(--fill)) * 100%) 0 0 0);
}

.meter-gr {
  background: #1a1210;
}

.meter-gr i {
  background: linear-gradient(var(--gr), #ffb15c);
  clip-path: inset(0 0 calc((1 - var(--fill)) * 100%) 0);
}
</style>
