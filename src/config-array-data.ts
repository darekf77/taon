
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

  pagination: IArrayDataPagination;

  /**
   * Filters data
   * EXAMPLE:
   * ['book.category.id = 23','book.author.id > 23' ]
   */
  filters: string[];

  /**
   * Sorting by entity properties
   */
  sorting: IArrayDataSorting;

  /**
   * Join some colums
   * EXAMPLE:
   * [book.author, book.publisher]
   */
  joins?: string[];

}

export class ArrayDataConfig {

  constructor(
    public config?: IArrayDataConfig) {

    if (!config) {
      this.config = this.defaultConfig;

      if (!this.config.pagination) {
        this.config.pagination = this.defaultConfig.pagination;
      }

      if (!this.config.filters) {
        this.config.filters = this.defaultConfig.filters;
      }

      if (!this.config.sorting) {
        this.config.sorting = this.defaultConfig.sorting;
      }

      if (!this.config.joins) {
        this.config.joins = this.defaultConfig.joins;
      }

      console.log('config HERE', this.config)
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
      sorting: {},
      pagination: {
        pageNumber: 1,
        rowsDisplayed: MAX_DATA_LENGTH_SENT_TO_CLIENT,
        totalElements: MAX_DATA_LENGTH_SENT_TO_CLIENT
      }
    }
  }


}
