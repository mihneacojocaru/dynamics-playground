<script setup lang="ts">
import { useLangStore } from '../i18n';
import { UI } from '../i18n/ui';
import { SOURCES } from '../audio/sources';
import { useTransportStore } from '../stores/transport';
import ToggleKey from './ui/ToggleKey.vue';

const { tr } = useLangStore();

const transport = useTransportStore();

function onFile(e: Event): void {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) transport.loadFile(file);
}
</script>

<template>
  <section class="transport card" :aria-label="tr(UI.playback)">
    <div class="key-group">
      <span class="control-label">{{ tr(UI.signal) }}</span>
      <div class="sources">
        <template v-for="s in SOURCES" :key="s.id">
          <ToggleKey v-if="s.id !== 'file'" :on="transport.sourceId === s.id" :title="s.title" @click="transport.selectSource(s.id)">{{ tr(s.label) }}</ToggleKey>
          <label v-else class="file" :class="{ 'is-on': transport.sourceId === 'file' }" :title="transport.fileName || tr(UI.fileHelp)">
            <input type="file" accept="audio/*" @change="onFile" />
            {{ transport.fileName ? transport.fileName : tr(s.label) }}
          </label>
        </template>
      </div>
    </div>
    <div class="key-group">
      <span class="control-label">{{ tr(UI.transport) }}</span>
      <div>
        <ToggleKey tone="green" :on="transport.playing" :disabled="!transport.source" @click="transport.toggle()">{{ transport.playing ? '■ Stop' : '▶ Play' }}</ToggleKey>
        <ToggleKey :on="transport.frozen" :title="tr(UI.freezeHelp)" @click="transport.setFrozen(!transport.frozen)">❚❚ {{ tr(UI.freeze) }}</ToggleKey>
        <ToggleKey :on="transport.bypass" @click="transport.bypass = !transport.bypass" :title="tr(UI.bypassHelp)">Bypass</ToggleKey>
      </div>
    </div>
    <p v-if="transport.loading" class="status">{{ tr(UI.loading) }}</p>
    <p v-if="transport.error" class="error" role="alert">{{ tr(transport.error) }}</p>
  </section>
</template>

<style scoped>
.transport {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap) calc(var(--gap) * 2);
  align-items: end;
  padding: 0.75rem var(--gap);
}

.sources {
  flex-wrap: wrap;
}

.file {
  position: relative;
  display: inline-flex;
  align-items: center;
  max-width: 12rem;
  padding: 0.45rem 0.9rem;
  border: 2px dashed #8e989c;
  border-radius: var(--radius);
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.file.is-on {
  border-style: solid;
  border-color: var(--accent);
  color: var(--accent-hi);
}

.file input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.file:focus-within {
  outline: 2px solid var(--accent-hi);
  outline-offset: 2px;
}

.error {
  margin: 0;
  color: #ff8a80;
}

.status {
  margin: 0;
  color: var(--text-dim);
}
</style>
