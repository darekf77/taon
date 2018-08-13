

export interface IArrayDataPagination {
  pageNumer: Number;
  rowsDisplayed: Number;
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
    public config: IArrayDataConfig) {

  }


}
