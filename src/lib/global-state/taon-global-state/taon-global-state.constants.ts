import type { TAON_GLOBAL_STATE } from './taon-global-state.entity';
import { TaonGlobalStateStatus } from './taon-global-state.models';

export const TaonGlobalStateDefaultsValues = {
  description: '',
  version: 0,
  id: void 0,
  status: TaonGlobalStateStatus.NORMAL,
} as Partial<TAON_GLOBAL_STATE>;
