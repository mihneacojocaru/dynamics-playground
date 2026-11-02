import type { SourceId } from '../audio/sources';
import type { DeviceId } from '../dsp/effects';
import type { BandParams } from '../dsp/effects/Multiband';
import type { EqBand } from '../dsp/effects/Equalizer';
import type { Text } from '../i18n';
import { DEFAULTS, type DeviceParamMap } from './definitions';

export interface Preset<K extends DeviceId = DeviceId> {
  name: Text;
  /** What to listen for, shown to the volunteers. */
  help: Text;
  source: SourceId;
  params: DeviceParamMap[K];
}

const band = (threshold: number, ratio: number, gain = 0, active = true): BandParams => ({ threshold, ratio, gain, active });
const eq = (freq: number, gain: number, q: number, shelf = false, active = true): EqBand => ({ freq, gain, q, shelf, active });
const flat = DEFAULTS.eq.bands;

export const PRESETS: { [K in DeviceId]: Preset<K>[] } = {
  compressor: [
    { name: { de: 'Gesang sanft', en: 'Vocals gentle' }, source: 'voice', help: { de: 'Leichte Kontrolle: nur die lautesten Stellen werden 3–5 dB leiser, die Stimme bleibt natürlich.', en: 'Light control: only the loudest parts drop by 3–5 dB, the voice stays natural.' }, params: { threshold: -22, ratio: 2.5, attack: 10, release: 150, gain: 3, softKnee: true, detector: 'rms', mix: 100 } },
    { name: { de: 'Gesang live', en: 'Vocals live' }, source: 'voice', help: { de: 'Fester Griff wie am Live-Pult: die Stimme steht gleichmäßig vorne, leise Silben kommen hoch.', en: 'A firm grip like at a live desk: the voice stays evenly in front, quiet syllables come up.' }, params: { threshold: -28, ratio: 4, attack: 5, release: 100, gain: 6, softKnee: false, detector: 'peak', mix: 100 } },
    { name: { de: 'Bass gleichmäßig', en: 'Even bass' }, source: 'bass', help: { de: 'Jeder Ton gleich laut: achte darauf, wie die Gain Reduction den Anschlag jedes Tons abfängt.', en: 'Every note equally loud: watch how the gain reduction catches the attack of each note.' }, params: { threshold: -24, ratio: 4, attack: 20, release: 120, gain: 5, softKnee: true, detector: 'rms', mix: 100 } },
    { name: { de: 'Drums Punch', en: 'Drum punch' }, source: 'drums', help: { de: 'Lange Attack lässt den Anschlag durch und drückt nur das Nachklingen: der Schlag wirkt härter.', en: 'A long attack lets the hit through and only squeezes the ring: the hit sounds harder.' }, params: { threshold: -26, ratio: 4, attack: 30, release: 80, gain: 5, softKnee: false, detector: 'peak', mix: 100 } },
    { name: { de: 'Parallel (New York)', en: 'Parallel (New York)' }, source: 'drums', help: { de: 'Stark komprimiert und mit dem Original gemischt: mehr Dichte, die Transienten bleiben trotzdem erhalten.', en: 'Heavily compressed and blended with the original: more density while the transients survive.' }, params: { threshold: -36, ratio: 10, attack: 1, release: 60, gain: 10, softKnee: false, detector: 'peak', mix: 40 } },
    { name: { de: 'Zu viel!', en: 'Too much!' }, source: 'mix', help: { de: 'Absichtlich übertrieben: hör auf das Pumpen und wie die Dynamik verschwindet.', en: 'Deliberately overdone: listen to the pumping and how the dynamics disappear.' }, params: { threshold: -40, ratio: 20, attack: 0.5, release: 40, gain: 12, softKnee: false, detector: 'peak', mix: 100 } },
  ],
  limiter: [
    { name: { de: 'Summen-Schutz', en: 'Bus safety' }, source: 'mix', help: { de: 'Fängt nur einzelne Spitzen ab, man hört fast nichts. So sitzt ein Limiter am Ende der Summe.', en: 'Only catches the odd peak, you hear almost nothing. This is how a limiter sits at the end of the master bus.' }, params: { threshold: -3, ceiling: -1, release: 100 } },
    { name: { de: 'Laut machen', en: 'Make it loud' }, source: 'mix', help: { de: '9 dB lauter bei gleicher Spitze: schau, wie die Wellenform oben flach wird.', en: '9 dB louder at the same peak: watch the top of the waveform flatten out.' }, params: { threshold: -9, ceiling: -0.3, release: 60 } },
    { name: { de: 'Drum-Spitzen', en: 'Drum peaks' }, source: 'drums', help: { de: 'Nur Kick und Snare stoßen an: kurze Gain Reduction bei jedem Schlag.', en: 'Only kick and snare hit the ceiling: a short gain reduction on every hit.' }, params: { threshold: -8, ceiling: -3, release: 30 } },
    { name: { de: 'Übertrieben', en: 'Overdone' }, source: 'mix', help: { de: '18 dB in die Wand: hör das Pumpen und die Verzerrung, wenn ein Limiter zu viel arbeitet.', en: '18 dB into the wall: hear the pumping and distortion when a limiter works too hard.' }, params: { threshold: -18, ceiling: -1, release: 400 } },
  ],
  gate: [
    { name: { de: 'Toms', en: 'Toms' }, source: 'toms', help: { de: 'Das Gate öffnet nur bei Tom-Schlägen. Dank Key-Filter reagiert es nicht auf Becken.', en: 'The gate only opens on tom hits. Thanks to the key filter it ignores the cymbals.' }, params: { ...DEFAULTS.gate } },
    { name: { de: 'Toms ohne Key-Filter', en: 'Toms without key filter' }, source: 'toms', help: { de: 'Gleiches Gate, aber ohne Key-Filter: Snare und Becken öffnen es jetzt mit.', en: 'Same gate without the key filter: snare and cymbals now open it too.' }, params: { ...DEFAULTS.gate, keyFilter: false } },
    { name: { de: 'Congas', en: 'Congas' }, source: 'percussion', help: { de: 'Schnelles Öffnen, kurzes Hold: jeder Schlag bleibt, Raum dazwischen wird leiser.', en: 'Fast opening, short hold: every hit stays, the room in between gets quieter.' }, params: { ...DEFAULTS.gate, threshold: -30, range: 20, hold: 50, release: 120, keyFilter: false } },
    { name: { de: 'Atmer leiser', en: 'Quieter breaths' }, source: 'voice', help: { de: 'Expander statt Gate: leise Geräusche zwischen den Phrasen werden sanft abgesenkt, nicht abgeschnitten.', en: 'Expander instead of gate: quiet noises between phrases are lowered gently, not cut off.' }, params: { ...DEFAULTS.gate, mode: 'expander', threshold: -40, ratio: 2, range: 15, attack: 2, hold: 30, release: 200, keyFilter: false } },
    { name: { de: 'Gitarre entrauschen', en: 'Guitar noise removal' }, source: 'guitar', help: { de: 'Expander auf der Gitarre: Brummen in den Pausen verschwindet, gespielte Töne bleiben unberührt.', en: 'Expander on the guitar: hum in the gaps disappears, played notes stay untouched.' }, params: { ...DEFAULTS.gate, mode: 'expander', threshold: -45, ratio: 3, range: 20, attack: 1, hold: 40, release: 250, keyFilter: false } },
  ],
  multiband: [
    { name: { de: 'Mix glätten', en: 'Smooth the mix' }, source: 'mix', help: { de: 'Alle Bänder leicht: der Mix wird dichter, ohne dass ein Instrument das andere mitzieht.', en: 'All bands gently: the mix gets denser without one instrument dragging the others along.' }, params: { ...DEFAULTS.multiband, bands: [band(-26, 2), band(-24, 2), band(-26, 2), band(-30, 2)] } },
    { name: { de: 'Bass bändigen', en: 'Tame the bass' }, source: 'mix', help: { de: 'Nur LF arbeitet: dröhnende Basstöne werden leiser, Stimme und Becken bleiben unberührt.', en: 'Only LF works: booming bass notes get quieter, voice and cymbals stay untouched.' }, params: { ...DEFAULTS.multiband, attack: 20, release: 150, bands: [band(-32, 5), band(-20, 3, 0, false), band(-22, 3, 0, false), band(-26, 3, 0, false)] } },
    { name: { de: 'Härte raus', en: 'Less harshness' }, source: 'mix', help: { de: 'Nur HM (800 Hz – 5 kHz) wird bei lauten Stellen gedrückt: der Mix wird weniger aggressiv.', en: 'Only HM (800 Hz – 5 kHz) is pushed down in loud parts: the mix becomes less harsh.' }, params: { ...DEFAULTS.multiband, attack: 5, release: 100, bands: [band(-24, 3, 0, false), band(-20, 3, 0, false), band(-32, 4), band(-26, 3, 0, false)] } },
    { name: { de: 'Mastering', en: 'Mastering' }, source: 'mix', help: { de: 'Sanft auf allen Bändern mit etwas Gain: so klingt ein Mix fertiger und lauter.', en: 'Gentle on all bands with a little gain: the mix sounds more finished and louder.' }, params: { ...DEFAULTS.multiband, attack: 20, release: 200, bands: [band(-22, 2, 1), band(-20, 1.8, 1), band(-22, 2, 1.5), band(-26, 2, 2)] } },
  ],
  deesser: [
    { name: { de: 'Gesang Standard', en: 'Vocals standard' }, source: 'voice', help: { de: 'S-Laute werden einige dB leiser, der Rest der Stimme bleibt unberührt (Split).', en: 'S sounds drop by a few dB, the rest of the voice stays untouched (split).' }, params: { ...DEFAULTS.deesser, threshold: -32, range: 8 } },
    { name: { de: 'Stark', en: 'Strong' }, source: 'voice', help: { de: 'Deutlich hörbar: bei zu viel Reduction lispelt die Stimme.', en: 'Clearly audible: with too much reduction the voice starts to lisp.' }, params: { ...DEFAULTS.deesser, frequency: 5500, threshold: -40, range: 16 } },
    { name: { de: 'Breitband', en: 'Wideband' }, source: 'voice', help: { de: 'Wide: bei jedem S wird die ganze Stimme leiser. Hör, wie sie kurz dumpf wird.', en: 'Wide: on every S the whole voice gets quieter. Hear how it briefly turns dull.' }, params: { ...DEFAULTS.deesser, mode: 'wide', threshold: -34, range: 10 } },
    { name: { de: 'S-Laute finden', en: 'Find the S sounds' }, source: 'voice', help: { de: 'Listen ist an: du hörst nur den Bereich, auf den der De-Esser reagiert. Dreh an Frequency, bis die S-Laute am lautesten sind.', en: 'Listen is on: you hear only the range the de-esser reacts to. Turn Frequency until the S sounds are loudest.' }, params: { ...DEFAULTS.deesser, listen: true } },
  ],
  eq: [
    { name: { de: 'Neutral', en: 'Neutral' }, source: 'mix', help: { de: 'Alles auf 0: Ausgangspunkt zum Vergleichen.', en: 'Everything at 0: a starting point for comparison.' }, params: { ...DEFAULTS.eq, hpfOn: false, bands: flat.map((b) => ({ ...b, gain: 0 })) } },
    { name: { de: 'Gesang klar', en: 'Clear vocals' }, source: 'voice', help: { de: 'Tiefen weg, Mumpf bei 300 Hz raus, Präsenz und Luft dazu: die Stimme wird verständlicher.', en: 'Lows out, boxiness at 300 Hz removed, presence and air added: the voice becomes clearer.' }, params: { hpfOn: true, hpf: 100, lpfOn: false, lpf: 16000, bands: [eq(150, -2, 0.7, true), eq(300, -3, 1.2), eq(3000, 3, 1), eq(10000, 3, 0.7, true)] } },
    { name: { de: 'Telefon', en: 'Telephone' }, source: 'voice', help: { de: 'Hochpass und Tiefpass eng zusammen: so klingt eine Stimme durchs Telefon.', en: 'High-pass and low-pass close together: this is how a voice sounds on the phone.' }, params: { hpfOn: true, hpf: 400, lpfOn: true, lpf: 3500, bands: [eq(120, 0, 0.7, true), eq(400, 0, 1.2), eq(1500, 6, 1), eq(10000, 0, 0.7, true)] } },
    { name: { de: 'Bass Fundament', en: 'Bass foundation' }, source: 'bass', help: { de: 'Mehr Tiefbass, weniger Matsch bei 250 Hz, etwas Anschlag bei 800 Hz.', en: 'More low end, less mud at 250 Hz, a little attack at 800 Hz.' }, params: { hpfOn: true, hpf: 35, lpfOn: false, lpf: 16000, bands: [eq(80, 3, 0.7, true), eq(250, -3, 1.2), eq(800, 2, 1.2), eq(10000, 0, 0.7, true, false)] } },
    { name: { de: 'Gitarre aufräumen', en: 'Clean up guitar' }, source: 'guitar', help: { de: 'Tiefen weg und etwas Härte raus, damit die Gitarre Platz für Stimme und Bass lässt.', en: 'Lows out and a bit of harshness removed, so the guitar leaves room for voice and bass.' }, params: { hpfOn: true, hpf: 110, lpfOn: false, lpf: 16000, bands: [eq(120, 0, 0.7, true, false), eq(300, -3, 1.2), eq(3000, -2, 2), eq(8000, 2, 0.7, true)] } },
    { name: { de: 'Smiley-Kurve', en: 'Smiley curve' }, source: 'mix', help: { de: 'Bässe und Höhen hoch, Mitten runter: klingt erst beeindruckend, macht aber Stimmen leiser.', en: 'Lows and highs up, mids down: impressive at first, but it pushes voices back.' }, params: { hpfOn: false, hpf: 60, lpfOn: false, lpf: 16000, bands: [eq(100, 4, 0.7, true), eq(400, -3, 1), eq(2500, -2, 1), eq(10000, 4, 0.7, true)] } },
  ],
};
