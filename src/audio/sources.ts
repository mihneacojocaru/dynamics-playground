import type { Text } from '../i18n';

export type SourceId = 'voice' | 'bass' | 'guitar' | 'keys' | 'percussion' | 'drums' | 'toms' | 'mix' | 'file';

export interface SourceInfo {
  id: SourceId;
  label: Text | string;
  /** What the signal contains, shown as tooltip when the label is short. */
  title?: string;
}

export const SOURCES: SourceInfo[] = [
  { id: 'voice', label: { de: 'Stimme', en: 'Vocals' } },
  { id: 'bass', label: 'Bass' },
  { id: 'guitar', label: { de: 'E-Gitarre', en: 'Guitar' } },
  { id: 'keys', label: 'Keys', title: 'Piano + Hammond' },
  { id: 'drums', label: 'Drums' },
  { id: 'percussion', label: 'Percussion', title: 'Congas + Timbale' },
  { id: 'toms', label: 'Toms' },
  { id: 'mix', label: 'Mix' },
  { id: 'file', label: { de: 'Eigene Datei', en: 'Own file' } },
];

export interface AudioSource {
  id: SourceId;
  sampleRate: number;
  left: Float32Array;
  right: Float32Array;
}

/** Uploaded files are cut to this length so the analysis stays fast. */
export const MAX_FILE_SECONDS = 30;

// Decoding needs no user gesture with an OfflineAudioContext, so sources can load before Play.
async function decode(data: ArrayBuffer, maxSeconds = Infinity): Promise<AudioSource> {
  const buffer = await new OfflineAudioContext(2, 1, 44100).decodeAudioData(data);
  const length = Math.min(buffer.length, Math.round(maxSeconds * buffer.sampleRate));
  const left = buffer.getChannelData(0).slice(0, length);
  const right = (buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : buffer.getChannelData(0)).slice(0, length);
  return { id: 'file', sampleRate: buffer.sampleRate, left, right };
}

const cache = new Map<SourceId, Promise<AudioSource>>();

export function loadSource(id: Exclude<SourceId, 'file'>): Promise<AudioSource> {
  let hit = cache.get(id);
  if (!hit) {
    hit = fetch(`${import.meta.env.BASE_URL}audio/${id}.m4a`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.url}`);
        return res.arrayBuffer();
      })
      .then((data) => decode(data))
      .then((src) => ({ ...src, id }));
    hit.catch(() => cache.delete(id));
    cache.set(id, hit);
  }
  return hit;
}

export async function sourceFromFile(file: File): Promise<AudioSource> {
  return decode(await file.arrayBuffer(), MAX_FILE_SECONDS);
}
