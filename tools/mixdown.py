"""Mixes the multitrack in Multitrack-Audio/ into the demo signals in public/audio/ (needs ffmpeg)."""
import math
import re
import subprocess
import sys
import tempfile
from array import array
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STEMS = ROOT / 'Multitrack-Audio' / 'HannesKeseberg_YouKnowBetter'
OUT = ROOT / 'public' / 'audio'
RATE = 44100
BPM = 93
BARS = 11
LOOP = BARS * 4 * 60 / BPM


def ffmpeg(*args: str) -> str:
    res = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-y', *args], capture_output=True, text=True)
    if res.returncode != 0:
        sys.exit(res.stderr[-2000:])
    return res.stderr


def samples(name: str) -> array:
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(STEMS / f'{name}.wav'), '-ac', '1', '-f', 's16le', '-'],
                         capture_output=True, check=True).stdout
    return array('h', raw)


def loudness(path: Path) -> float:
    log = ffmpeg('-i', str(path), '-af', 'ebur128', '-f', 'null', '-')
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', log)[-1])


def peak_db(path: Path) -> float:
    log = ffmpeg('-i', str(path), '-af', 'astats=measure_perchannel=none:measure_overall=Peak_level', '-f', 'null', '-')
    return float(re.findall(r'Peak level dB:\s+(-?[\d.]+)', log)[-1])


def inverted(a: str, b: str) -> bool:
    """True when the second mic of a pair works against the first (sum quieter than difference)."""
    x, y = samples(a), samples(b)
    return sum(p * q for p, q in zip(x, y)) < 0


def first_onset() -> float:
    kick = samples('01_KickIn')
    limit = max(abs(v) for v in kick) * 0.2
    i = next(i for i, v in enumerate(kick) if abs(v) > limit)
    return max(0.0, i / RATE - 0.01)


# name -> (stem, target loudness LUFS, pan -1..1, filters)
DRUMS = {
    # Audix D6 style: deep lows, scooped 400 Hz, strong click. Kick In is dull and sub-heavy, so it only gives body;
    # the click comes from Kick Out at 3.5 kHz, below the snare's 5 kHz presence (kick and snare mostly hit together).
    # Kick In is delayed 43 samples (~1 ms) to line up with Kick Out; saturation on Kick Out adds harmonics for small speakers.
    'kick_in': ('01_KickIn', -24, 0, 'adelay=43S,highpass=f=40,equalizer=f=400:t=q:w=1:g=-6'),
    'kick_out': ('02_KickOut', -19, 0, 'highpass=f=35,volume=6dB,asoftclip=type=tanh,volume=-6dB,'
                 'equalizer=f=60:t=q:w=1:g=2,equalizer=f=380:t=q:w=1:g=-8,equalizer=f=3500:t=q:w=1:g=10,equalizer=f=9000:t=h:w=1:g=2'),
    'snare_up': ('03_SnareUp', -20, 0, 'highpass=f=100,equalizer=f=165:t=q:w=2:g=-5,equalizer=f=500:t=q:w=1.2:g=-4,'
                 'equalizer=f=5000:t=q:w=0.8:g=4,equalizer=f=10000:t=h:w=1:g=3,'
                 'acompressor=threshold=-22dB:ratio=2.5:attack=10:release=90:makeup=1'),
    'snare_layer': ('snare_layer', -27, 0, 'anull'),
    'snare_down': ('04_SnareDown', -28, 0, 'highpass=f=300,equalizer=f=7000:t=h:w=1:g=2'),
    'hihat': ('05_HiHat', -34, -0.35, 'highpass=f=400'),
    'tom1': ('06_Tom1', -28, -0.25, 'highpass=f=60,equalizer=f=500:t=q:w=1.5:g=-5,equalizer=f=4000:t=q:w=1:g=2'),
    'tom2': ('07_Tom2', -28, 0.35, 'highpass=f=50,equalizer=f=450:t=q:w=1.5:g=-5,equalizer=f=4000:t=q:w=1:g=2'),
    'overheads': ('08_Overheads', -25, None, 'highpass=f=150,equalizer=f=400:t=q:w=1:g=-2,equalizer=f=6000:t=h:w=1:g=-3'),
    'room': ('09_DrumsRoom', -29, 0, 'highpass=f=80,acompressor=threshold=-24dB:ratio=6:attack=5:release=120:makeup=4'),
}
REVERB_SENDS = {'snare_up': -9, 'snare_layer': -9, 'snare_down': -14, 'tom1': -8, 'tom2': -8, 'overheads': -14}
DRUM_BUS = 'acompressor=threshold=-20dB:ratio=2:attack=25:release=160:makeup=2'

BAND = {
    'congas': ('10_Congas', -31, -0.45, 'highpass=f=80'),
    'timbale': ('11_Timbale', -33, 0.45, 'highpass=f=150'),
    'bass': ('12_BassDI', -21, 0, 'highpass=f=35,equalizer=f=800:t=q:w=1:g=2'),
    'gtr1a': ('13_ElecGtr1Mic1', -32, -0.5, 'highpass=f=100,equalizer=f=2500:t=q:w=1:g=-2'),
    'gtr1b': ('14_ElecGtr1Mic2', -35, -0.5, 'highpass=f=100'),
    'gtr1c': ('15_ElecGtr1Mic3', -36, -0.5, 'highpass=f=100'),
    'gtr2': ('16_ElecGtr2DI', -32, 0.5, 'highpass=f=120,lowpass=f=5000'),
    'piano': ('17_Piano', -27, None, 'highpass=f=70,equalizer=f=2500:t=q:w=1:g=-2'),
    'hammond': ('18_Hammond', -29, None, 'highpass=f=60,equalizer=f=2500:t=q:w=1:g=-2'),
    'vox': ('19_LeadVox', -18, 0, 'highpass=f=90,equalizer=f=300:t=q:w=1:g=-2'),
    'bvox1': ('20_BackingVox1', -27, -0.4, 'highpass=f=120'),
    'bvox2': ('21_BackingVox2', -27, 0.4, 'highpass=f=120'),
}
# In the full mix the lead vocal gets presence, air and a little levelling so it sits on top.
MIX_VOX = ('19_LeadVox', -16, 0, 'highpass=f=100,equalizer=f=280:t=q:w=1:g=-3,equalizer=f=3200:t=q:w=1:g=3,'
           'equalizer=f=10000:t=h:w=1:g=4,acompressor=threshold=-22dB:ratio=3:attack=8:release=120:makeup=2')


def pan(p: float | None) -> str:
    if p is None:
        return 'aformat=channel_layouts=stereo'
    a = (p + 1) * math.pi / 4
    return f'pan=stereo|c0={math.cos(a):.4f}*c0|c1={math.sin(a):.4f}*c0'


def build(tracks: dict, tmp: Path, start: float, invert: set[str], reverb: dict[str, float] | None, extra_wet: dict[str, float] | None = None, bus_fx: str = 'anull') -> str:
    """Returns ffmpeg args that sum the given tracks (gain-matched to their targets) into one stereo bus."""
    inputs, chains, bus, sends = [], [], [], []
    for i, (key, (stem, target, p, fx)) in enumerate(tracks.items()):
        src = PATHS.get(stem, STEMS / f'{stem}.wav')
        gain = target - LEVELS[stem]
        inputs += ['-ss', f'{start:.4f}', '-t', f'{LOOP:.4f}', '-i', str(src)]
        pol = ',volume=-1' if key in invert else ''
        chains.append(f'[{i}:a]{fx},volume={gain:.2f}dB{pol},{pan(p)},asplit=2[d{i}][s{i}]')
        bus.append(f'[d{i}]')
        send = (reverb or {}).get(key, (extra_wet or {}).get(key))
        if send is not None:
            sends.append(f'[s{i}]volume={send}dB[r{i}]')
        else:
            sends.append(f'[s{i}]anullsink')
    n = len(tracks)
    graph = chains + sends
    wet = [f'[r{i}]' for i, k in enumerate(tracks) if (reverb or {}).get(k, (extra_wet or {}).get(k)) is not None]
    if wet:
        ir = n
        inputs += ['-i', str(tmp / 'ir.wav')]
        graph.append(f'{"".join(wet)}amix=inputs={len(wet)}:normalize=0[send]')
        graph.append(f'[send][{ir}:a]afir=dry=0:wet=1:gtype=none,volume=-4dB,atrim=0:{LOOP:.4f}[verb]')
        bus.append('[verb]')
    graph.append(f'{"".join(bus)}amix=inputs={len(bus)}:normalize=0,{bus_fx}[out]')
    return inputs, ';'.join(graph)


def render(name: str, inputs: list, graph: str, tmp: Path) -> None:
    wav = tmp / f'{name}.wav'
    ffmpeg(*inputs, '-filter_complex', graph, '-map', '[out]', '-ar', str(RATE), '-c:a', 'pcm_f32le', str(wav))
    finish(name, wav, tmp)


def finish(name: str, wav: Path, tmp: Path) -> None:
    gain = -1.0 - peak_db(wav)
    out = OUT / f'{name}.m4a'
    ffmpeg('-i', str(wav), '-af', f'volume={gain:.2f}dB,afade=t=in:d=0.004,afade=t=out:st={LOOP - 0.004:.4f}:d=0.004',
           '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', str(out))
    print(f'{out.relative_to(ROOT)}  {loudness(out):.1f} LUFS  {out.stat().st_size // 1024} KB')


def make_ir(tmp: Path) -> None:
    """Synthetic stereo plate: decorrelated pink noise with exponential decay (~1.6 s RT60)."""
    ffmpeg('-f', 'lavfi', '-i', 'anoisesrc=d=2:c=pink:r=44100:seed=7',
           '-f', 'lavfi', '-i', 'anoisesrc=d=2:c=pink:r=44100:seed=13',
           '-filter_complex', "[0][1]join=inputs=2:channel_layout=stereo,aeval='val(ch)*exp(-t*4.3)':c=same,"
           'highpass=f=250,lowpass=f=7000,adelay=18|18,volume=-10dB',
           str(tmp / 'ir.wav'))


LEVELS: dict[str, float] = {}
PATHS: dict[str, Path] = {}
SNARE_TUNE = 196.0


def make_snare_layer(tmp: Path) -> None:
    """Short tuned tone on every snare hit, so the drum sounds tuned higher without time-stretching artefacts."""
    import wave
    hit = samples('03_SnareUp')
    top = max(abs(v) for v in hit)
    out = array('h', bytes(2 * len(hit)))
    i = 0
    while i < len(hit):
        if abs(hit[i]) > top * 0.15:
            vel = max(abs(v) for v in hit[i:i + 220]) / top
            for k in range(int(0.25 * RATE)):
                t = k / RATE
                if i + k >= len(out):
                    break
                f = SNARE_TUNE * (1 + 0.04 * math.exp(-t / 0.01))
                v = math.sin(2 * math.pi * f * t) * math.exp(-t / 0.07) + 0.45 * math.sin(2 * math.pi * f * 1.59 * t) * math.exp(-t / 0.04)
                out[i + k] = max(-32767, min(32767, out[i + k] + int(v * vel * 16000)))
            i += int(0.09 * RATE)
        else:
            i += 1
    path = tmp / 'snare_layer.wav'
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(out.tobytes())
    PATHS['snare_layer'] = path
    LEVELS['snare_layer'] = loudness(path)

if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    start = first_onset()
    print(f'loop {start:.3f}s + {LOOP:.3f}s ({BARS} bars at {BPM} BPM)')
    invert = {k for k, a, b in [('kick_out', '01_KickIn', '02_KickOut'), ('snare_down', '03_SnareUp', '04_SnareDown')] if inverted(a, b)}
    print('polarity flipped:', invert or 'none')
    for stem in {s for s, *_ in [*DRUMS.values(), *BAND.values()]} - {'snare_layer'}:
        LEVELS[stem] = loudness(STEMS / f'{stem}.wav')

    with tempfile.TemporaryDirectory() as t:
        tmp = Path(t)
        make_ir(tmp)
        make_snare_layer(tmp)
        render('drums', *build(DRUMS, tmp, start, invert, REVERB_SENDS, bus_fx=DRUM_BUS), tmp)
        render('toms', *build({k: DRUMS[k] for k in ('tom1', 'tom2')}, tmp, start, set(), None), tmp)
        render('bass', *build({'bass': BAND['bass']}, tmp, start, set(), None), tmp)
        render('voice', *build({'vox': BAND['vox']}, tmp, start, set(), None), tmp)
        render('guitar', *build({k: BAND[k] for k in ('gtr1a', 'gtr1b', 'gtr1c', 'gtr2')}, tmp, start, set(), None), tmp)
        render('keys', *build({k: BAND[k] for k in ('piano', 'hammond')}, tmp, start, set(), None, {'piano': -18}), tmp)
        render('percussion', *build({k: BAND[k] for k in ('congas', 'timbale')}, tmp, start, set(), None, {'congas': -14, 'timbale': -14}), tmp)
        # Mix-only balance: bass and piano sit louder here than in their solo files.
        louder = {k: (BAND[k][0], BAND[k][1] + db, *BAND[k][2:]) for k, db in (('bass', 3), ('piano', 3))}
        full = {**DRUMS, **BAND, **louder, 'vox': MIX_VOX}
        render('mix', *build(full, tmp, start, invert, REVERB_SENDS, {'vox': -14, 'bvox1': -12, 'bvox2': -12, 'piano': -18}), tmp)
