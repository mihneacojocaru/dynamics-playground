<script setup lang="ts">
withDefaults(defineProps<{ on?: boolean; tone?: 'grey' | 'green' | 'accent' | 'dark' }>(), { on: false, tone: 'grey' });
defineEmits<{ click: [] }>();
</script>

<template>
  <button type="button" class="key" :class="[`key-${tone}`, { 'is-on': on }]" :aria-pressed="on" @click="$emit('click')">
    <slot />
  </button>
</template>

<style scoped>
.key {
  min-width: 5rem;
  padding: 0.45rem 0.9rem;
  border: 2px solid #4b5458;
  border-radius: var(--radius);
  background: linear-gradient(var(--key-hi), var(--key));
  color: var(--key-text);
  font-size: 1rem;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.5), 0 2px 3px rgb(0 0 0 / 0.45);
  transition: background 0.12s, box-shadow 0.12s, transform 0.05s;
}

.key:disabled {
  opacity: 0.5;
  cursor: progress;
}

.key:active {
  transform: translateY(1px);
}

.key.is-on {
  background: linear-gradient(var(--accent-hi), var(--accent));
  color: #04222f;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.4), 0 0 0.75rem color-mix(in srgb, var(--accent) 60%, transparent);
}

.key-green.is-on {
  background: linear-gradient(var(--on-green-hi), var(--on-green));
  color: #04170a;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.4), 0 0 0.75rem color-mix(in srgb, var(--on-green) 60%, transparent);
}

.key-dark {
  background: var(--screen);
  color: var(--text);
  border-color: #17a28a;
  box-shadow: none;
}

.key-dark.is-on {
  background: #0d3a33;
  color: var(--text);
}
</style>
