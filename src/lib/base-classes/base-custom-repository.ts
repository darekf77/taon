//#region imports
import { _ } from 'tnp-core/src';

import { TaonRepository } from '../decorators/classes/repository-decorator';

import { TaonBaseInjector } from './base-injector';
//#endregion

@TaonRepository({ className: 'TaonBaseCustomRepository' })
export abstract class TaonBaseCustomRepository extends TaonBaseInjector {}
