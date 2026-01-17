//#region imports
 
import { Taon } from '../../index';
import { TaonBaseMiddleware } from '../../base-classes/base-middleware';
import { TaonMiddleware } from '../../decorators/classes/middleware-decorator';
import { _ } from 'tnp-core/src';
//#endregion

@TaonMiddleware({
  className: 'TaonGlobalStateMiddleware',
})
export class TaonGlobalStateMiddleware extends TaonBaseMiddleware {}