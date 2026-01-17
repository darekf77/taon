import {
  allowedTaonGlobalStatusOrders,
  TaonGlobalStateStatus,
} from './taon-global-state.models';

export namespace TaonGlobalStateUtils {
  // export function isActive(state: string): state is TaonGlobalStateStatus {
  //   return state === 'active';
  // }

  export const assertAllowedTransition = (
    from: TaonGlobalStateStatus,
    to: TaonGlobalStateStatus,
  ): void => {
    if (!allowedTaonGlobalStatusOrders[from]?.includes(to)) {
      throw new Error(`Invalid state transition: ${from} → ${to}`);
    }
  };
}
