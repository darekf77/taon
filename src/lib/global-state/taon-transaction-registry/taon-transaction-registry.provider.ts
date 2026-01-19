//#region imports
 
import { Taon } from '../../index';
import { TaonBaseProvider } from '../../base-classes/base-provider';
import { TaonProvider } from '../../decorators/classes/provider-decorator';
import { _ } from 'tnp-core/src';
//#endregion

@TaonProvider({
  className: 'TaonTransactionRegistryProvider',
})
export class TaonTransactionRegistryProvider extends TaonBaseProvider {



}