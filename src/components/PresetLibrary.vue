<script setup lang="ts">
import { useLangStore } from '../i18n';
import { UI } from '../i18n/ui';
import { computed } from 'vue';
import { PRESETS, type Preset } from '../devices/presets';
import { DEVICE_STORES } from '../stores/devices';
import { useTransportStore } from '../stores/transport';

const { tr } = useLangStore();

const transport = useTransportStore();
const store = computed(() => DEVICE_STORES[transport.device]());
const presets = computed(() => PRESETS[transport.device] as Preset[]);
const active = computed(() => {
  const now = JSON.stringify(store.value.params);
  return presets.value.find((p) => JSON.stringify(p.params) === now) ?? null;
});

function apply(p: Preset): void {
  Object.assign(store.value.params, structuredClone(p.params));
  transport.selectSource(p.source);
}
</script>

<template>
  <section class="library card-inset" :aria-label="tr(UI.presets)">
    <h3>Library</h3>
    <div class="presets">
      <button v-for="p in presets" :key="p.name.en" type="button" class="preset" :class="{ 'is-on': active === p }" :title="tr(p.help)" @click="apply(p)">
        {{ tr(p.name) }}
      </button>
    </div>
    <p class="help" aria-live="polite">{{ tr(active ? active.help : UI.presetHint) }}</p>
  </section>
</template>

<style scoped>
.library {
  display: grid;
  gap: var(--gap-s);
  padding: var(--gap);
}

h3 {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-s);
}

.preset {
  padding: 0.45rem 0.85rem;
  border: 2px solid #17a28a;
  border-radius: var(--radius);
  background: var(--screen);
  color: var(--text);
  font-size: 0.95rem;
  transition: background 0.12s, box-shadow 0.12s;
}

.preset:hover {
  background: #0d3a33;
}

.preset.is-on {
  background: #17a28a;
  color: #04170f;
  box-shadow: 0 0 0.6rem rgb(23 162 138 / 0.6);
}

.help {
  margin: 0;
  min-height: 2.6em;
  font-size: 0.9rem;
  line-height: 1.4;
  color: var(--text-dim);
}
</style>
