import type { NumberParam } from '../../devices/params';
import { param } from '../../devices/params';
import { BUTTERWORTH_Q } from '../../dsp/Biquad';
import { Biquad } from '../../dsp/Biquad';
import { bandType, type EqualizerParams } from '../../dsp/effects/Equalizer';
import { gainToDb } from '../../dsp/math';

export const EQ_COLORS = ['#b44dff', '#22c3c9', '#3e6fff', '#ff3b3b'];
export const EQ_NAMES = ['LF', 'LM', 'HM', 'HF'];

export const FREQ: NumberParam = param({ label: 'Freq', min: 20, max: 20000, def: 1000, unit: 'Hz', log: true, help: { de: 'Mittenfrequenz des Bandes.', en: 'Centre frequency of the band.' } });
export const EQ_GAIN: NumberParam = param({ label: 'Gain', min: -18, max: 18, def: 0, unit: 'dB', step: 0.1, help: { de: 'Anheben (+) oder Absenken (−).', en: 'Boost (+) or cut (−).' } });
export const Q: NumberParam = param({ label: 'Q', min: 0.3, max: 10, def: 1, unit: 'q', log: true, help: { de: 'Breite: kleines Q = breit, großes Q = schmal.', en: 'Width: small Q = wide, large Q = narrow.' } });
export const HPF: NumberParam = param({ label: 'HPF', min: 20, max: 1000, def: 60, unit: 'Hz', log: true, help: { de: 'Hochpass: schneidet alles darunter ab (12 dB/Okt).', en: 'High-pass: cuts everything below (12 dB/oct).' } });
export const LPF: NumberParam = param({ label: 'LPF', min: 1000, max: 20000, def: 16000, unit: 'Hz', log: true, help: { de: 'Tiefpass: schneidet alles darüber ab (12 dB/Okt).', en: 'Low-pass: cuts everything above (12 dB/oct).' } });

/** Per-filter response functions in dB for drawing. */
export function eqCurves(p: EqualizerParams) {
  const mk = (type: Parameters<Biquad['set']>[0], f: number, q: number, g = 0) => new Biquad(48000).set(type, f, q, g);
  const bands = p.bands.map((b, i) => mk(bandType(i, b, p.bands.length), b.freq, b.q, b.gain));
  const hpf = mk('highpass', p.hpf, BUTTERWORTH_Q);
  const lpf = mk('lowpass', p.lpf, BUTTERWORTH_Q);
  const band = (i: number) => (f: number) => (p.bands[i].active ? gainToDb(bands[i].magnitude(f)) : 0);
  const total = (f: number) => {
    let m = 1;
    bands.forEach((b, i) => p.bands[i].active && (m *= b.magnitude(f)));
    if (p.hpfOn) m *= hpf.magnitude(f);
    if (p.lpfOn) m *= lpf.magnitude(f);
    return gainToDb(m);
  };
  return { band, total };
}
