# Dynamics Playground

Interaktiver Simulator, um Ehrenamtlichen zu zeigen, wie Dynamik-Bearbeitung funktioniert: Compressor, Limiter, Gate/Expander, Multiband-Kompressor, De-Esser und parametrischer EQ. Jede Änderung ist sofort sichtbar (Kennlinie, Pegel, laufende Wellenform mit Gain Reduction) und mit **Play** auch hörbar, **Bypass** schaltet für den A/B-Vergleich ab.

Live: https://mihneacojocaru.github.io/dynamics-playground/

## Bedienung

- Tabs oben wechseln das Gerät; ein Tab lässt sich direkt verlinken, z. B. `#gate` oder `#deesser`.
- Wertfelder: ziehen (hoch/runter), Mausrad oder Pfeiltasten, `Shift` für feine Schritte, Doppelklick setzt zurück.
- Punkte in den Grafiken lassen sich ziehen (Threshold, Trennfrequenzen, EQ-Bänder; Mausrad auf einem EQ-Punkt ändert Q).
- Signal: Stimme, Bass, E-Gitarre, Keys (Piano + Hammond), Drums, Percussion (Congas + Timbale), Toms, Mix (aus einer echten Mehrspur-Aufnahme abgemischt) oder eine eigene Audiodatei (die ersten 30 s).
- **Standbild** hält Ton und Animation an: Einstellungen ändern und den Unterschied an genau einem Moment sehen. In der Wellenform ziehen verschiebt den Moment.
- Sprache Deutsch/Englisch oben links (Standard: Englisch).
- Einstellungen und Sprache bleiben im `localStorage` des Browsers erhalten.

## Technik

Vue 3, Pinia, TypeScript, Vite. Kein Backend.

| Bereich | Ort |
| --- | --- |
| DSP (reines TypeScript, ohne Vue) | `src/dsp` – Biquad/Linkwitz-Riley, Kennlinien, ein `Effect` pro Gerät |
| Hörbares Audio | `src/audio` – `AudioEngine` spielt die Quelle in Schleife durch ein AudioWorklet, das dieselben DSP-Klassen nutzt |
| Anzeige | `src/analysis` – ein Web Worker rechnet den aktiven Effekt über die ganze Schleife; die Anzeigen lesen das Ergebnis am Abspielpunkt |
| Sprache | `src/i18n` – kleiner Pinia-Store, jeder Text als `{ de, en }` |
| State | `src/stores` – ein Pinia-Store pro Gerät plus Transport, Analyse und Live-Meter |
| UI | `src/components` – gemeinsame Bausteine (`ParamBox`, `Knob`, `TransferCurve`, `FreqGraph`, `WaveScope`) und je ein Panel/Display pro Gerät |

## Audio

Die Signale in `public/audio/` sind aus der Mehrspur-Aufnahme „You Know Better“ von Hannes Keseberg abgemischt, bereitgestellt von [Cambridge-MT](https://www.cambridge-mt.com/ms/mtk/) nur für Bildungszwecke, nicht kommerziell. Die Rohspuren liegen lokal in `Multitrack-Audio/` (nicht im Repo). Neu abmischen mit:

```sh
python3 tools/mixdown.py   # braucht ffmpeg
```

Das Skript gleicht die Spuren über ihre Lautheit an, korrigiert die Polarität der Snare-Bottom, gibt Snare, Toms und Overheads Hall und schneidet alles auf 11 Takte, damit die Schleife im Takt bleibt.

## Entwicklung

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # DSP-Tests (Vitest)
npm run build      # Typecheck + Produktions-Build nach dist/
```

Deployment: GitHub Action `.github/workflows/pages.yml` baut bei jedem Push auf `main` und veröffentlicht auf GitHub Pages.

Der ursprüngliche Stand von 2022 ist als Tag `legacy-2022` erhalten.
