import * as _ from 'lodash';
import { parseJSONwithStringJSONs } from './helpers';

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

}

export class ModelDataConfig implements IModelDataConfig {

  private config?: IModelDataConfig;

  constructor(config?: IModelDataConfig) {

    if (config && _.isString(config['config'])) {
      // console.log('from nested config')
      this.config = parseJSONwithStringJSONs(JSON.parse(config['config']));
    } else if (config) {
      // console.log('from normal interface config')
      this.config = parseJSONwithStringJSONs(config);
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
    }
  }

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
          innerJoinAndSelect: {
            // 'category': 'entity.category'
          }
        };

        // TODO commands sorting

        commands.forEach(c => {
          let split = c.split('.');

          if (_.first(split) === '') {
            split = split.slice(1);
          }

          if (split.length === 1) { // join entity property
            const entityPropertyFirstLevel = _.first(split);
            res.innerJoinAndSelect[entityPropertyFirstLevel] =
              `${res.alias}.${entityPropertyFirstLevel}`;
          } else if (split.length === 2) {
            const entityPropertyFirstLevel = _.first(split);
            const entityPropertySecondLevel = _.first(split.slice(1));

            res.innerJoinAndSelect[entityPropertySecondLevel] =
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

}
