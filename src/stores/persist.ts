const PREFIX = 'audio-kompressor:';

function merge<T>(defaults: T, saved: unknown): T {
  if (Array.isArray(defaults)) {
    return defaults.map((d, i) => merge(d, Array.isArray(saved) ? saved[i] : undefined)) as T;
  }
  if (defaults && typeof defaults === 'object') {
    const src = (saved && typeof saved === 'object' ? saved : {}) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(defaults).map(([k, v]) => [k, merge(v, src[k])]),
    ) as T;
  }
  return typeof saved === typeof defaults ? (saved as T) : defaults;
}

/** Reads saved settings, keeping only keys and types that still exist in the defaults. */
export function load<T>(key: string, defaults: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return merge(structuredClone(defaults), raw ? JSON.parse(raw) : undefined);
  } catch {
    return structuredClone(defaults);
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked (private mode); settings then simply are not kept.
  }
}
