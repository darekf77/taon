import { MetaDBEntity } from './db-models';

import { Observable } from 'rxjs/Observable';
import { getClassFromObject } from 'ng2-rest/helpers';
import { getClassName } from 'ng2-rest/classname';
import { ModelDataConfig } from '../model-data-config';



export class BrowserDB {

  private db: { [modelName in string]: MetaDBEntity[] } = {} as any;

  private static readonly _instance = new BrowserDB();
  public static get instance() {
    return this._instance;
  }

  private constructor() {

  }


  public rebuildFrom(model) {
    const entityClass = getClassFromObject(model);
    const name = getClassName(entityClass);
  }

  public observe$<T=Function>(entityClass: Function) {

    const slef = this;
    return {
      byId(id: number, config?: ModelDataConfig): Observable<T> {
        return undefined;
      }
    }
  }


}
