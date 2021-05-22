import {
  _,
} from 'tnp-core';
// import { Subject } from 'rxjs/Subject'; // TODO use rxjs to detec change
// import { Observable } from 'rxjs/Observable';
import { Helpers } from '../helpers';
import { Mapping } from 'ng2-rest';
import { CLASS } from 'typescript-class-helpers';

import { SYMBOL } from '../symbols';

const MAX_DATA_LENGTH_SENT_TO_CLIENT = 10000;

export interface IModelDataPagination {
  pageNumber: number;
  rowsDisplayed: number;
  totalElements?: number;
}

export interface IModelDataSorting {
  [entityPath: string]: 'ASC' | "DESC";
}

export interface IModelDataConfig {

  pagination?: IModelDataPagination;

  /**
   * Sorting by entity properties
   */
  sorting?: IModelDataSorting;

  /**
   * Join some colums
   * EXAMPLE:
   * [author, author.publisher]
   */
  joins?: string[];

  /**
   * Find data where
   * EXAMPLE:
   * ['book.author.id === 2']
   */
  where?: string[];

  /**
   * Properties to exclude from entity/entities
   */
  exclude?: string[];

  /**
   * Properties to inlude only in entity/entities
   */
  include?: string[];


}

@CLASS.NAME('ModelDataConfig')
@Mapping.DefaultModelWithMapping<ModelDataConfig>({})
export class ModelDataConfig {

  public static create(config: IModelDataConfig) {
    return new ModelDataConfig(config);
  }

  //#region @backend
  public static fromHeader(req: Express.Request): ModelDataConfig {
    let config: ModelDataConfig;
    try {
      config = JSON.parse(decodeURIComponent((req as any).headers[SYMBOL.MDC_KEY]))
    } catch (e1) {
      try {
        config = JSON.parse((req as any).headers[SYMBOL.MDC_KEY])
      } catch (e2) {   }
    }
    return !config ? void 0 : ModelDataConfig.create(!!config.config ? config.config : config);
  }
  //#endregion

  toString() {
    return JSON.stringify(this);
  }

  // protected _modelConfigChanged = new Subject();
  // public onChange = this._modelConfigChanged.asObservable();

  private config?: IModelDataConfig;

  constructor(config?: IModelDataConfig) {

    if (config && _.isString(config['config'])) {
      // console.log('from nested config')
      this.config = Helpers.parseJSONwithStringJSONs(JSON.parse(config['config'])) as any;
    } else if (config) {
      // console.log('from normal interface config')
      this.config = Helpers.parseJSONwithStringJSONs(config) as any;
    } else {
      // console.log('from default config')
      this.config = this.defaultConfig;
    }


    if (_.isUndefined(this.config.pagination)) {
      this.config.pagination = this.defaultConfig.pagination;
    }

    if (_.isUndefined(this.config.sorting)) {
      this.config.sorting = this.defaultConfig.sorting;
    }

    if (_.isUndefined(this.config.joins)) {
      this.config.joins = this.defaultConfig.joins;
    }

    if (_.isUndefined(this.config.where)) {
      this.config.where = this.defaultConfig.where;
    }
    if (Helpers.isNode) {
      if (_.isUndefined(this.config.include)) {
        this.config.include = [];
      }
      if (_.isUndefined(this.config.exclude)) {
        this.config.exclude = [];
      }
    }
    // console.log('config', config)
  }

  //#region @backend
  fromModels(models: any[]) {
    const self = this;
    return {
      getPagination<T=any>(): T[] {
        let { pageNumber, rowsDisplayed } = self.config.pagination;
        let indexStart = (pageNumber - 1) * rowsDisplayed;
        let indexEnd = indexStart + rowsDisplayed;
        return models.slice(indexStart, indexEnd);
      }
    };
  }
  //#endregion

  private get defaultConfig(): IModelDataConfig {
    return {
      joins: [],
      where: [],
      sorting: {},
      pagination: {
        pageNumber: 1,
        rowsDisplayed: MAX_DATA_LENGTH_SENT_TO_CLIENT,
        totalElements: MAX_DATA_LENGTH_SENT_TO_CLIENT
      }
    } as any
  }

  //#region @backend
  private get preprae() {
    return {
      where(command: string) {
        let res = {};
        const [wherePath, value] = command.split('=').map(c => c.trim());
        _.set(res, wherePath, value);
        return res;
      },
      joinInnerAndSelect(commands: string[]) {
        let res = {
          alias: 'entity',
          leftJoinAndSelect: {
            // 'category': 'entity.category'
          }
        };

        // TODO_NOT_IMPORTANT commands sorting

        commands.forEach(c => {
          let split = c.split('.');

          if (_.first(split) === '') {
            split = split.slice(1);
          }

          if (split.length === 1) { // join entity property
            const entityPropertyFirstLevel = _.first(split);
            res.leftJoinAndSelect[entityPropertyFirstLevel] =
              `${res.alias}.${entityPropertyFirstLevel}`;
          } else if (split.length === 2) {
            const entityPropertyFirstLevel = _.first(split);
            const entityPropertySecondLevel = _.first(split.slice(1));

            res.leftJoinAndSelect[entityPropertySecondLevel] =
              `${entityPropertyFirstLevel}.${entityPropertySecondLevel}`;
          }
        })

        return res;
      }
    }
  }



  get db() {
    const self = this;
    return {
      get where() {
        let res = {};
        self.where.forEach(c => {
          res = _.merge(res, self.preprae.where(c));
        });
        return res;
      },
      get join() {
        return self.preprae.joinInnerAndSelect(self.joins);
      },
      get skip() {
        let { pageNumber, rowsDisplayed } = self.config.pagination;
        let indexStart = (pageNumber - 1) * rowsDisplayed;
        return indexStart;
      },
      get take() {
        return self.config.pagination.rowsDisplayed;
      }
    }
  }
  //#endregion

  get set() {
    const self = this;
    return {
      include(entity: any | any[]) {
        if (_.isArray(entity)) {
          entity.forEach(e => {
            self.set.include(e)
          })
          return
        }
        if (_.isArray(self.config.include) && self.config.include.length > 0) {
          if (_.isObject(entity)) {
            Object.keys(entity).forEach(key => {
              if (!self.config.include.includes(key)) {
                _.set(entity, key, void 0);
              }
            })
          }
        }

      },
      exclude(entity: any | any[]) {
        if (_.isArray(entity)) {
          entity.forEach(e => {
            self.set.exclude(e)
          })
          return
        }
        if (_.isArray(self.config.exclude) && self.config.exclude.length > 0) {
          self.config.exclude.forEach(ex => {
            _.set(entity, ex, void 0);
          });
        }

      },
      where(command: string) {
        if (command === undefined) {
          return;
        }
        const [wherePath, value] = command.split('=').map(c => c.trim());
        const founded = self.config.where.find(c => {
          const [wherePath2] = c.split('=').map(c => c.trim());
          return (wherePath === wherePath2);
        })

        if (command.trim().endsWith('=') || (value && value.trim() === 'undefined')) {
          self.config.where = self.config.where.filter(c => {
            const [wherePath2] = c.split('=').map(c => c.trim());
            return (wherePath !== wherePath2);
          });
          return;
        }

        if (founded) {
          let index = self.config.where.indexOf(founded);
          self.config.where[index] = command;
        } else {
          self.config.where.push(command)
        }
        // self._modelConfigChanged.next(self);
      },
      joins(command: string) {
        if (command === undefined) {
          return;
        }
        let founded = self.config.joins.find(j => command.trim() === j.trim());
        if (founded) {
          let index = self.config.joins.indexOf(founded);
          self.config.joins[index] = command;
        } else {
          self.config.joins.push(command)
        }
        // self._modelConfigChanged.next(self);
      },

      get pagination() {
        return {
          totalElement(value: number) {
            self.config.pagination.totalElements = value;
            // self._modelConfigChanged.next(self);
          },
          pageNumber(value: number) {
            self.config.pagination.pageNumber = value;
            // self._modelConfigChanged.next(self);
          },
          rowDisplayed(value: number) {
            self.config.pagination.rowsDisplayed = value;
            // self._modelConfigChanged.next(self);
          }
        }
      }

    }
  }

  get get() {
    const self = this;
    return {
      get pagination() {
        return {
          get totalElements() {
            return Number(_.get(self, "config.pagination.totalElements"));
          },
          get pageNumber() {
            return Number(_.get(self, "config.pagination.pageNumber"));
          },
          get rowsDisplayed() {
            return Number(_.get(self, "config.pagination.rowsDisplayed"));
          }
        }
      }
    }
  }

  //#region @backend
  get pagination() {

    return this.config.pagination;
  }

  get sorting() {

    return this.config.sorting;
  }

  get joins() {

    return this.config.joins
  }

  get where() {

    return this.config.where
  }

  get exclude() {

    return this.config.exclude
  }

  get include() {

    return this.config.include
  }


  //#endregion

}

export class MDC extends ModelDataConfig {

}
