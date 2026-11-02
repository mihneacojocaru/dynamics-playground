import { createEffect, type DeviceId } from '../dsp/effects';
import type { Effect } from '../dsp/Effect';

declare const sampleRate: number;
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
}
declare function registerProcessor(name: string, ctor: unknown): void;

export type FxMessage =
  | { type: 'device'; id: DeviceId }
  | { type: 'params'; id: DeviceId; params: unknown }
  | { type: 'bypass'; value: boolean };

class FxProcessor extends AudioWorkletProcessor {
  private effects = new Map<DeviceId, Effect<unknown>>();
  private active: DeviceId | null = null;
  private bypass = false;

  constructor() {
    super();
    this.port.onmessage = (e: MessageEvent<FxMessage>) => this.handle(e.data);
  }

  private effect(id: DeviceId): Effect<unknown> {
    let fx = this.effects.get(id);
    if (!fx) {
      fx = createEffect(id, sampleRate);
      this.effects.set(id, fx);
    }
    return fx;
  }

  private handle(msg: FxMessage): void {
    if (msg.type === 'device') this.active = msg.id;
    else if (msg.type === 'params') this.effect(msg.id).set(msg.params);
    else this.bypass = msg.value;
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const input = inputs[0];
    const [left, right] = outputs[0];
    if (!input?.length) return true;
    left.set(input[0]);
    right.set(input[1] ?? input[0]);
    if (!this.bypass && this.active && this.effects.has(this.active)) this.effect(this.active).process(left, right);
    return true;
  }
}

registerProcessor('fx', FxProcessor);
