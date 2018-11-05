// import * as _ from 'lodash';

// import { MetaDBEntity, MetaDBModel } from './db-models';

// import { Observable } from 'rxjs/Observable';
// import { getClassFromObject } from 'ng2-rest/helpers';
// import { getClassName } from 'ng2-rest/classname';
// import { ModelDataConfig } from '../model-data-config';
// import { SYMBOL } from '../symbols';
// import { Subject } from 'rxjs';



// export class BrowserDB {

//   private db: { [modelName in string]: {
//     [configId in number]: {
//       [modelId in number]: MetaDBEntity
//     } }
//   } = {} as any;

//   private static readonly _instance = new BrowserDB();
//   public static get instance() {
//     return this._instance;
//   }

//   private constructor() {

//   }

//   private checkIfEmpty(model: MetaDBModel, config: ModelDataConfig) {
//     const { id } = model;
//     const entityClass = getClassFromObject(model);
//     const name = getClassName(entityClass);
//     const configID = config[SYMBOL.MODEL_DATA_CONFIG_ID];

//     if (!_.isObject(this.db[name])) {
//       this.db[name] = {};
//     }
//     if (!_.isObject(this.db[name][configID])) {
//       this.db[name][configID] = {}
//     }
//     if (!_.isObject(this.db[name][configID][id])) {
//       this.db[name][configID][id] = {
//         config,
//         model,
//         subject: new Subject()
//       }
//     }


//   }

//   public rebuildFrom(modelFromRequest: MetaDBModel, configFromRequest: ModelDataConfig) {
//     this.checkIfEmpty(modelFromRequest, configFromRequest);

//     const configID = configFromRequest[SYMBOL.MODEL_DATA_CONFIG_ID];
//     const entityClass = getClassFromObject(modelFromRequest);
//     const name = getClassName(entityClass);
//     const { id } = modelFromRequest;

//     const entity = this.db[name][configID][id];
//     entity.model = modelFromRequest;
//     entity.config = configFromRequest;
//     // TODO inteligen mergint
//     // /this.updateEntities(); /// TODO  updat entites if instances of class
//     this.inteligenMerging(name, id);
//     entity.subject.next(modelFromRequest);
//   }

//   updateEntities(modelFromRequest) {

//   }

//   inteligenMerging(name, id) {
//     const models = Object.keys(this.db[name])
//       .filter(key => !!this.db[name][key][id])
//       .map(key => {
//         const { model, config } = this.db[name][key][id] as MetaDBEntity;

//       })

//     let merged = {};
//     // TODO filter by Date;
//     // TODO merge by data and

//     this.db[name][''][id] = merged;
//   }

//   public observe$<T=Function>(entityClass: Function) {
//     const name = getClassName(entityClass);
//     const self = this;
//     return {
//       byIdc(id: number, config: ModelDataConfig, odlMerge = false): Observable<T> {

//         const configID = config[SYMBOL.MODEL_DATA_CONFIG_ID];
//         if (odlMerge) {
//           self.db[name][''][id].subject.asObservable();
//         }
//         return self.db[name][configID][id].subject.asObservable();
//       }
//     }
//   }


// }
