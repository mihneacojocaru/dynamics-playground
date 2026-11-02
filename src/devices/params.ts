import type { Text } from '../i18n';

export type Unit = 'dB' | 'ms' | 'Hz' | 'ratio' | '%' | 'q';

export interface NumberParam {
  label: string;
  min: number;
  max: number;
  def: number;
  unit: Unit;
  /** Logarithmic control travel, for frequencies and times. */
  log?: boolean;
  step?: number;
  help: Text;
}

export const param = (p: NumberParam): NumberParam => p;

export const THRESHOLD = param({ label: 'Threshold', min: -60, max: 0, def: -18, unit: 'dB', step: 0.5, help: { de: 'Ab diesem Pegel greift das Gerät ein.', en: 'Above this level the device starts working.' } });
export const RATIO = param({ label: 'Ratio', min: 1, max: 20, def: 3, unit: 'ratio', log: true, help: { de: 'Wie stark der Pegel über dem Threshold verringert wird: bei 4:1 wird aus 4 dB mehr Eingang nur 1 dB mehr Ausgang.', en: 'How strongly the level above the threshold is reduced: at 4:1, 4 dB more input gives only 1 dB more output.' } });
export const ATTACK = param({ label: 'Attack', min: 0.1, max: 200, def: 10, unit: 'ms', log: true, help: { de: 'Wie schnell das Gerät reagiert, wenn der Pegel steigt.', en: 'How fast the device reacts when the level rises.' } });
export const RELEASE = param({ label: 'Release', min: 5, max: 2000, def: 150, unit: 'ms', log: true, help: { de: 'Wie schnell das Gerät wieder loslässt, wenn der Pegel fällt.', en: 'How fast the device lets go again when the level falls.' } });
export const GAIN = param({ label: 'Gain', min: -12, max: 24, def: 0, unit: 'dB', step: 0.5, help: { de: 'Make-up Gain: holt die verlorene Lautstärke nach dem Komprimieren zurück.', en: 'Make-up gain: brings back the level lost by compressing.' } });

export function toNormalized(p: NumberParam, v: number): number {
  if (p.log) return Math.log(v / p.min) / Math.log(p.max / p.min);
  return (v - p.min) / (p.max - p.min);
}

export function fromNormalized(p: NumberParam, n: number): number {
  const c = Math.min(1, Math.max(0, n));
  const v = p.log ? p.min * Math.pow(p.max / p.min, c) : p.min + c * (p.max - p.min);
  return p.step ? Math.round(v / p.step) * p.step : v;
}

export function formatValue(p: Pick<NumberParam, 'unit'>, v: number): string {
  switch (p.unit) {
    case 'dB':
      return `${v > 0 ? '+' : ''}${v.toFixed(1)} dB`;
    case 'ms':
      if (v < 1) return `${Math.round(v * 1000)} µs`;
      return v < 10 ? `${v.toFixed(2)} ms` : v < 100 ? `${v.toFixed(1)} ms` : `${Math.round(v)} ms`;
    case 'Hz':
      return v >= 1000 ? `${(v / 1000).toFixed(2)} kHz` : `${Math.round(v)} Hz`;
    case 'ratio':
      return v >= 19.95 ? '∞ : 1' : `${v < 10 ? v.toFixed(1) : Math.round(v)} : 1`;
    case '%':
      return `${Math.round(v)} %`;
    case 'q':
      return v.toFixed(2);
  }
}
