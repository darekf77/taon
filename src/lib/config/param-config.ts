import { CoreModels } from 'tnp-core/src';

// import { cloneObj } from '../helpers/clone-obj';

export class ParamConfig {
  declare paramName: string;
  declare paramType: CoreModels.ParamType;
  declare index: number;
  declare defaultType: any;
  declare expireInSeconds?: number;

  // ! CLONING WILL CONE DESCRIPTOR OF METHOD AND I NEED IT!
  // public clone(override?: Partial<ParamConfig>): ParamConfig {
  //   return cloneObj<ParamConfig>(override, ParamConfig);
  // }
}
