<script setup lang="ts">
import { useLangStore } from '../i18n';
import { UI } from '../i18n/ui';
import { DEVICES } from '../devices/definitions';
import { useTransportStore } from '../stores/transport';

const { tr } = useLangStore();

const transport = useTransportStore();
</script>

<template>
  <nav class="tabs" role="tablist" :aria-label="tr(UI.devices)">
    <button
      v-for="d in DEVICES"
      :key="d.id"
      type="button"
      role="tab"
      class="tab"
      :class="{ 'is-active': transport.device === d.id }"
      :aria-selected="transport.device === d.id"
      @click="transport.device = d.id"
    >
      {{ d.tab }}
    </button>
  </nav>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 0.3rem;
  padding: 0 1.5rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.tab {
  flex: none;
  padding: 0.45rem 1.2rem;
  border: 2px solid #5b676c;
  border-bottom: 0;
  border-radius: var(--radius) var(--radius) 0 0;
  background: linear-gradient(#46535a, #343f44);
  color: var(--text);
  font-size: 1.05rem;
  transition: background 0.15s, color 0.15s;
}

.tab:hover {
  background: linear-gradient(#52616a, #3c484e);
}

.tab.is-active {
  background: var(--accent);
  border-color: var(--accent);
  color: #03141c;
}

@media (width < 40rem) {
  .tabs {
    padding: 0 0.75rem;
  }

  .tab {
    padding: 0.55rem 0.9rem;
    font-size: 1rem;
  }
}
</style>
