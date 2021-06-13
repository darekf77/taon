//#region @backend
import { Models } from 'tnp-models';

export interface ReplaceOptions {
  replacements: (Models.dev.Replacement | [Models.dev.Replacement, string])[];
}


//#endregion
