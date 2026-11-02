import workletUrl from './fx.worklet.ts?worker&url';
import type { FxMessage } from './fx.worklet';
import type { AudioSource } from './sources';
import type { DeviceId } from '../dsp/effects';

/** Owns the AudioContext: loops the source through the effect worklet to the speakers. */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private ready: Promise<void> | null = null;
  private node: AudioWorkletNode | null = null;
  private volume!: GainNode;
  private player: AudioBufferSourceNode | null = null;
  private buffers = new WeakMap<AudioSource, AudioBuffer>();
  private startedAt = 0;
  private duration = 1;
  private state = new Map<string, FxMessage>();
  readonly analyser: { input: AnalyserNode | null; output: AnalyserNode | null } = { input: null, output: null };

  get playing(): boolean {
    return this.player !== null;
  }

  /** Seconds into the loop, or null while stopped. */
  position(): number | null {
    if (!this.ctx || !this.player) return null;
    return (this.ctx.currentTime - this.startedAt) % this.duration;
  }

  async play(source: AudioSource, offset = 0): Promise<void> {
    await this.init();
    const ctx = this.ctx!;
    this.stop();
    const buffer = this.buffer(source);
    this.duration = buffer.duration;
    const player = ctx.createBufferSource();
    player.buffer = buffer;
    player.loop = true;
    player.connect(this.node!);
    player.connect(this.analyser.input!);
    const at = offset % this.duration;
    player.start(0, at);
    this.startedAt = ctx.currentTime - at;
    this.player = player;
  }

  stop(): void {
    this.player?.stop();
    this.player?.disconnect();
    this.player = null;
  }

  setDevice(id: DeviceId): void {
    this.send({ type: 'device', id }, 'device');
  }

  setParams(id: DeviceId, params: unknown): void {
    this.send({ type: 'params', id, params: JSON.parse(JSON.stringify(params)) }, `params:${id}`);
  }

  setBypass(value: boolean): void {
    this.send({ type: 'bypass', value }, 'bypass');
  }

  setVolume(db: number): void {
    this.volumeDb = db;
    if (this.ctx) this.volume.gain.setTargetAtTime(Math.pow(10, db / 20), this.ctx.currentTime, 0.02);
  }

  private volumeDb = 0;

  private send(msg: FxMessage, key: string): void {
    this.state.set(key, msg);
    this.node?.port.postMessage(msg);
  }

  private buffer(source: AudioSource): AudioBuffer {
    let buffer = this.buffers.get(source);
    if (!buffer) {
      buffer = this.ctx!.createBuffer(2, source.left.length, source.sampleRate);
      buffer.copyToChannel(source.left as Float32Array<ArrayBuffer>, 0);
      buffer.copyToChannel(source.right as Float32Array<ArrayBuffer>, 1);
      this.buffers.set(source, buffer);
    }
    return buffer;
  }

  // Browsers only allow audio after a user gesture, so the context is created on first use.
  private async init(): Promise<void> {
    this.ready ??= (async () => {
      const ctx = new AudioContext({ latencyHint: 'interactive' });
      await ctx.audioWorklet.addModule(workletUrl);
      this.node = new AudioWorkletNode(ctx, 'fx', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2],
        channelCount: 2,
        channelCountMode: 'explicit',
      });
      this.volume = ctx.createGain();
      this.analyser.input = ctx.createAnalyser();
      this.analyser.output = ctx.createAnalyser();
      for (const a of [this.analyser.input, this.analyser.output]) {
        a.fftSize = 4096;
        a.smoothingTimeConstant = 0.75;
      }
      this.node.connect(this.analyser.output);
      this.node.connect(this.volume).connect(ctx.destination);
      this.ctx = ctx;
      this.state.forEach((msg) => this.node!.port.postMessage(msg));
      this.setVolume(this.volumeDb);
    })();
    await this.ready;
    if (this.ctx!.state === 'suspended') await this.ctx!.resume();
  }
}

export const engine = new AudioEngine();
