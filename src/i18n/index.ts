import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { load, save } from '../stores/persist';

export type Lang = 'de' | 'en';
export const LANGS: Lang[] = ['de', 'en'];

/** A user-facing text in every supported language. */
export type Text = Record<Lang, string>;

export const useLangStore = defineStore('lang', () => {
  const saved = load<string>('lang', 'en');
  const lang = ref<Lang>(LANGS.includes(saved as Lang) ? (saved as Lang) : 'en');

  watch(lang, (l) => {
    save('lang', l);
    document.documentElement.lang = l;
    document.title = l === 'de' ? 'Audio Kompressor – Dynamik zum Anschauen | mc-creative' : 'Audio Compressor – Dynamics you can see | mc-creative';
  }, { immediate: true });

  /** Picks the current language from a Text; plain strings (technical terms) pass through. */
  function tr(text: Text | string): string {
    return typeof text === 'string' ? text : text[lang.value];
  }

  return { lang, tr };
});
