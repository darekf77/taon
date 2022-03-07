import type { BASE_CONTROLLER } from './framework-controller';
import type { BASE_ENTITY } from './framework-entity';
import { ConfigModels } from 'tnp-config';


export interface IConnectionOptions {
  database: string;
  type: ConfigModels.DatabaseType;
  synchronize: boolean;
  dropSchema: boolean;
  logging: boolean;
}


export type FrameworkMode = 'backend/frontend' |
  'remote-backend' |
  'tests' |
  'backend/frontend-worker'
  ;

export interface StartOptions {

  host: string;
  controllers?: BASE_CONTROLLER<any>[] | Function[];
  entities?: BASE_ENTITY<any>[] | Function[];
  disabledRealtime?: boolean;
  allowedHosts?: string[];

  //#region @backend
  mode?: FrameworkMode;
  config?: IConnectionOptions;
  InitDataPrioritypublicAssets?: { path: string; location: string }[];
  InitDataPriority?: BASE_CONTROLLER<any>[] | Function[];
  publicAssets?: { path: string; location: string; }[];
  //#endregion

}

