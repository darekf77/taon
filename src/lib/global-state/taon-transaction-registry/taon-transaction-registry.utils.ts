import { TaonTransactionRegistryState } from './taon-transaction-registry.models';

export namespace TaonTransactionRegistryUtils {
  export function isActive(state: string): state is TaonTransactionRegistryState {
    return state === 'active';
  }
}