import type { Effect } from '../Effect';
import { Compressor } from './Compressor';
import { DeEsser } from './DeEsser';
import { Equalizer } from './Equalizer';
import { Gate } from './Gate';
import { Limiter } from './Limiter';
import { Multiband } from './Multiband';

export const EFFECTS = {
  compressor: Compressor,
  limiter: Limiter,
  gate: Gate,
  multiband: Multiband,
  deesser: DeEsser,
  eq: Equalizer,
} as const;

export type DeviceId = keyof typeof EFFECTS;

export function createEffect(id: DeviceId, sampleRate: number): Effect<unknown> {
  return new EFFECTS[id](sampleRate) as Effect<unknown>;
}
