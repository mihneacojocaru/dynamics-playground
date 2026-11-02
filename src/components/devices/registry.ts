import type { Component } from 'vue';
import type { DeviceId } from '../../dsp/effects';
import CompressorDisplay from './CompressorDisplay.vue';
import CompressorPanel from './CompressorPanel.vue';
import DeEsserDisplay from './DeEsserDisplay.vue';
import DeEsserPanel from './DeEsserPanel.vue';
import EqDisplay from './EqDisplay.vue';
import EqPanel from './EqPanel.vue';
import GateDisplay from './GateDisplay.vue';
import GatePanel from './GatePanel.vue';
import LimiterDisplay from './LimiterDisplay.vue';
import LimiterPanel from './LimiterPanel.vue';
import MultibandDisplay from './MultibandDisplay.vue';
import MultibandPanel from './MultibandPanel.vue';

export const VIEWS: Record<DeviceId, { panel: Component; display: Component }> = {
  compressor: { panel: CompressorPanel, display: CompressorDisplay },
  limiter: { panel: LimiterPanel, display: LimiterDisplay },
  gate: { panel: GatePanel, display: GateDisplay },
  multiband: { panel: MultibandPanel, display: MultibandDisplay },
  deesser: { panel: DeEsserPanel, display: DeEsserDisplay },
  eq: { panel: EqPanel, display: EqDisplay },
};
