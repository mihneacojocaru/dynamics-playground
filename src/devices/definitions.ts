import type { DeviceId } from '../dsp/effects';
import type { CompressorParams } from '../dsp/effects/Compressor';
import type { DeEsserParams } from '../dsp/effects/DeEsser';
import type { EqualizerParams } from '../dsp/effects/Equalizer';
import type { GateParams } from '../dsp/effects/Gate';
import type { LimiterParams } from '../dsp/effects/Limiter';
import type { MultibandParams } from '../dsp/effects/Multiband';
import type { SourceId } from '../audio/sources';

import type { Text } from '../i18n';

export interface DeviceInfo {
  id: DeviceId;
  tab: string;
  title: string;
  source: SourceId;
  intro: Text;
}

export const DEVICES: DeviceInfo[] = [
  {
    id: 'compressor',
    tab: 'Comp',
    title: 'Compressor',
    source: 'voice',
    intro: {
      de: 'Ein Kompressor macht laute Stellen leiser und gleicht so die Dynamik aus. Mit Gain holst du danach die Lautstärke zurück: das Signal wird dichter und gleichmäßiger.',
      en: 'A compressor makes loud parts quieter and so evens out the dynamics. Gain then brings the level back up: the signal becomes denser and more even.',
    },
  },
  {
    id: 'limiter',
    tab: 'Limiter',
    title: 'Limiter',
    source: 'mix',
    intro: {
      de: 'Ein Limiter ist ein sehr schneller Kompressor mit unendlicher Ratio. Kein Peak kommt über die Ceiling, egal wie laut der Eingang ist. Ideal als Schutz am Ende der Kette.',
      en: 'A limiter is a very fast compressor with an infinite ratio. No peak gets above the ceiling, however loud the input. Ideal as protection at the end of the chain.',
    },
  },
  {
    id: 'gate',
    tab: 'Gate',
    title: 'Gate · Expander',
    source: 'toms',
    intro: {
      de: 'Ein Gate schließt, wenn das Signal unter den Threshold fällt, und unterdrückt so Übersprechen zwischen den Schlägen: auf den Tom-Mikros hört man sonst Snare, Kick und Becken mit. Ein Expander macht das sanfter mit einer einstellbaren Ratio.',
      en: 'A gate closes when the signal falls below the threshold and so suppresses spill between hits: otherwise the tom mics also pick up snare, kick and cymbals. An expander does this more gently with an adjustable ratio.',
    },
  },
  {
    id: 'multiband',
    tab: 'Multiband',
    title: 'Multiband',
    source: 'mix',
    intro: {
      de: 'Der Multiband-Kompressor teilt das Signal in vier Frequenzbänder und komprimiert jedes für sich. So bändigst du z. B. einen dröhnenden Bass, ohne dass die Stimme mitpumpt.',
      en: 'The multiband compressor splits the signal into four frequency bands and compresses each on its own. That way you can tame a booming bass without the voice pumping along.',
    },
  },
  {
    id: 'deesser',
    tab: 'DeEsser',
    title: 'De-Esser',
    source: 'voice',
    intro: {
      de: 'Ein De-Esser ist ein Kompressor, der nur auf scharfe S- und Zischlaute hört. Mit Listen hörst du genau den Bereich, auf den er reagiert.',
      en: 'A de-esser is a compressor that only listens to sharp S and hissing sounds. With Listen you hear exactly the range it reacts to.',
    },
  },
  {
    id: 'eq',
    tab: 'PEQ',
    title: 'Parametric EQ',
    source: 'mix',
    intro: {
      de: 'Der EQ hebt oder senkt einzelne Frequenzbereiche an. Frequenz wählt den Bereich, Gain die Stärke, Q die Breite. Hochpass und Tiefpass schneiden Ränder ab.',
      en: 'The EQ boosts or cuts individual frequency ranges. Frequency picks the range, Gain the amount, Q the width. High-pass and low-pass trim the edges.',
    },
  },
];

export interface DeviceParamMap {
  compressor: CompressorParams;
  limiter: LimiterParams;
  gate: GateParams;
  multiband: MultibandParams;
  deesser: DeEsserParams;
  eq: EqualizerParams;
}

export const DEFAULTS: DeviceParamMap = {
  compressor: { threshold: -20, ratio: 3, attack: 10, release: 150, gain: 4, softKnee: false, detector: 'peak', mix: 100 },
  limiter: { threshold: -6, ceiling: -1, release: 80 },
  gate: { mode: 'gate', threshold: -16, range: 30, ratio: 2, attack: 0.5, hold: 80, release: 150, keyFilter: true, keyHpf: 80, keyLpf: 2000 },
  multiband: {
    low: 120,
    mid: 800,
    high: 5000,
    attack: 15,
    release: 180,
    bands: [-24, -20, -22, -26].map((threshold) => ({ threshold, ratio: 3, gain: 0, active: true })),
  },
  deesser: { frequency: 6000, threshold: -32, range: 12, response: 60, mode: 'split', filter: 'highpass', listen: false },
  eq: {
    hpfOn: true,
    hpf: 60,
    lpfOn: false,
    lpf: 16000,
    bands: [
      { freq: 120, gain: 0, q: 0.7, shelf: true, active: true },
      { freq: 400, gain: 0, q: 1.2, shelf: false, active: true },
      { freq: 2500, gain: 0, q: 1.2, shelf: false, active: true },
      { freq: 10000, gain: 0, q: 0.7, shelf: true, active: true },
    ],
  },
};
