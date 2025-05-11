//#region imports
import { _ } from 'tnp-core/src';

import { TaonRepository } from '../decorators/classes/repository-decorator';

import { BaseInjector } from './base-injector';
//#endregion

@TaonRepository({ className: 'BaseCustomRepository' })
export abstract class BaseCustomRepository extends BaseInjector {}
