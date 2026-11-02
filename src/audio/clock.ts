import { engine } from './AudioEngine';

let base = 0;
let since = performance.now();
let held = false;

/** Current loop position. While stopped the clock keeps running silently so the display stays alive. */
export function playhead(duration: number): number {
  const p = engine.position();
  if (p !== null) {
    base = p;
    since = performance.now();
    return p;
  }
  if (held) return base % duration;
  return (base + (performance.now() - since) / 1000) % duration;
}

/** Freezes the display on one moment; seek moves that moment. */
export function hold(on: boolean, duration: number): void {
  base = playhead(duration);
  since = performance.now();
  held = on;
}

export function seek(seconds: number, duration: number): void {
  base = ((seconds % duration) + duration) % duration;
  since = performance.now();
}
