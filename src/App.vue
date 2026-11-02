<script setup lang="ts">
import { computed } from 'vue';
import { LANGS, useLangStore } from './i18n';
import { UI } from './i18n/ui';
import MasterVolume from './components/MasterVolume.vue';
import PresetLibrary from './components/PresetLibrary.vue';
import TabBar from './components/TabBar.vue';
import TransportBar from './components/TransportBar.vue';
import { VIEWS } from './components/devices/registry';
import { useFrame } from './composables/useFrame';
import { useSync } from './composables/useSync';
import { useLiveStore } from './stores/live';
import { useTransportStore } from './stores/transport';

const transport = useTransportStore();
const live = useLiveStore();
const lang = useLangStore();
const tr = lang.tr;
const credit = computed(() => tr(UI.credit).split('{link}'));
const view = computed(() => VIEWS[transport.device]);

useSync();
useFrame(live.tick);
</script>

<template>
  <header class="topbar">
    <div class="masthead">
      <h1>{{ lang.lang === 'de' ? 'Audio Kompressor' : 'Audio Compressor' }} <span>{{ tr(UI.subtitle) }}</span></h1>
      <div class="tools">
        <MasterVolume />
        <span class="divider" aria-hidden="true"></span>
        <div class="lang" role="group" :aria-label="tr(UI.language)">
          <button v-for="l in LANGS" :key="l" type="button" :class="{ 'is-on': lang.lang === l }" :aria-pressed="lang.lang === l" @click="lang.lang = l">
            {{ l.toUpperCase() }}
          </button>
        </div>
        <span class="divider" aria-hidden="true"></span>
        <a class="home" href="https://mc-creative.de" rel="author">mc-creative.de</a>
      </div>
    </div>
    <TabBar />
  </header>
  <main class="frame">
    <TransportBar />
    <div class="workspace">
      <section class="card device" :aria-label="transport.info.title">
        <component :is="view.panel" />
        <PresetLibrary />
      </section>
      <section class="card display" :aria-label="tr(UI.display)">
        <component :is="view.display" />
      </section>
    </div>
    <p class="intro"><strong>{{ transport.info.title }}:</strong> {{ tr(transport.info.intro) }}</p>
    <p class="credit">
      {{ credit[0] }}<a href="https://www.cambridge-mt.com/ms/mtk/" rel="noopener">Cambridge-MT</a>{{ credit[1] }}
    </p>
  </main>
</template>

<style scoped>
.topbar {
  display: grid;
  gap: 0.4rem;
  padding-top: 0.6rem;
}

/* On desktop the header stays on top while scrolling, so tabs and master volume are always reachable. */
@media (width >= 64rem) {
  .topbar {
    position: sticky;
    top: 0;
    z-index: 10;
    background: color-mix(in srgb, var(--page-hi) 94%, transparent);
    backdrop-filter: blur(8px);
    box-shadow: 0 6px 12px -8px rgb(0 0 0 / 0.6);
  }
}

.tools {
  display: flex;
  align-items: center;
  gap: var(--gap);
}

.divider {
  width: 1px;
  height: 1.5rem;
  background: #56646a;
}

.lang {
  display: flex;
  gap: 0.15rem;
}

.lang button {
  padding: 0.25rem 0.4rem;
  border: 0;
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--text-faint);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  transition: color 0.12s, border-color 0.12s;
}

.lang button:hover {
  color: var(--text);
}

.lang button.is-on {
  color: var(--accent-hi);
  border-bottom-color: var(--accent);
}

.home {
  padding: 0.3rem 0.8rem;
  border: 2px solid #17a28a;
  border-radius: var(--radius);
  background: var(--screen);
  color: var(--text);
  font-size: 0.9rem;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.12s;
}

.home:hover {
  background: #0d3a33;
}

.masthead {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--gap);
  padding: 0 1.5rem;
}

h1 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

h1 span {
  margin-left: 0.5rem;
  font-size: 0.85rem;
  font-weight: 400;
  color: var(--text-dim);
}

.frame {
  display: grid;
  gap: var(--gap);
  margin: 0 0.75rem 1.5rem;
  padding: var(--gap);
  border: 3px solid var(--frame-edge);
  border-radius: calc(var(--radius) * 1.6);
  background: var(--frame);
  box-shadow: inset 0 0 0 2px #3d484d, 0 10px 30px rgb(0 0 0 / 0.45);
}

.device {
  display: flex;
  flex-direction: column;
  gap: calc(var(--gap) * 1.5);
}

.device > :last-child {
  margin-top: auto;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  gap: var(--gap);
  align-items: stretch;
}

.intro {
  margin: 0;
  max-width: 70ch;
  color: var(--text-dim);
  line-height: 1.5;
}

.credit {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-faint);
}

.intro strong {
  color: var(--text);
}

@media (width < 64rem) {
  .workspace {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (width < 40rem) {
  .masthead {
    padding: 0 0.75rem;
    flex-wrap: wrap;
  }

  h1 {
    font-size: 1.1rem;
  }

  h1 span {
    display: block;
    margin-left: 0;
  }

  .frame {
    margin: 0 0 1rem;
    padding: 0.6rem;
    border-radius: var(--radius);
  }

  .card {
    padding: 0.75rem;
  }
}
</style>
