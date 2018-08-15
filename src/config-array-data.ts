import * as _ from 'lodash';
import { parseJSONwithStringJSONs } from './helpers';

const MAX_DATA_LENGTH_SENT_TO_CLIENT = 100;

export interface IArrayDataPagination {
  pageNumber: number;
  rowsDisplayed: number;
  totalElements?: number;
}

export interface IArrayDataSorting {
  [entityPath: string]: 'ASC' | "DESC";
}


export interface IArrayDataConfig {

  pagination?: IArrayDataPagination;

  /**
   * Filters data
   * EXAMPLE:
   * ['book.category.id = 23','book.author.id > 23' ]
   */
  filters?: string[];

  /**
   * Sorting by entity properties
   */
  sorting?: IArrayDataSorting;

  /**
   * Join some colums
   * EXAMPLE:
   * [book.author, book.publisher]
   */
  joins?: string[];

  /**
   * Find data where
   * EXAMPLE:
   * ['book.author.id === 2']
   */
  where?: string[];

}

export class ArrayDataConfig implements IArrayDataConfig {

  private config?: IArrayDataConfig;

  constructor(config?: IArrayDataConfig) {

    if (config && _.isString(config['config'])) {
      console.log('from nested config')
      this.config = parseJSONwithStringJSONs(JSON.parse(config['config']));
    } else if (config) {
      console.log('from normal interface config')
      this.config = parseJSONwithStringJSONs(config);
    } else {
      console.log('from default config')
      this.config = this.defaultConfig;
    }


    if (_.isUndefined(this.config.pagination)) {
      this.config.pagination = this.defaultConfig.pagination;
    }

    if (_.isUndefined(this.config.filters)) {
      this.config.filters = this.defaultConfig.filters;
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

  private get defaultConfig(): IArrayDataConfig {
    return {
      filters: [],
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

  get pagination() {
    
    return this.config.pagination;
  }

  get filters() {
    
    return this.config.filters;
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
