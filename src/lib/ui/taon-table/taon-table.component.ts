//#region imports
import {
  Component,
  OnInit,
  Input,
  Output,
  TemplateRef,
  EventEmitter,
  ViewChild,
  ElementRef,
} from '@angular/core';
import * as _ from 'lodash';
import { Log, Level } from 'ng2-logger/src';
import { Taon } from 'taon/src';
import { CLASS } from 'typescript-class-helpers/src';
import { PageEvent } from '@angular/material/paginator';
import { MtxGridColumn } from '@ng-matero/extensions/grid';
import {
  Subscription,
  debounceTime,
  defer,
  distinctUntilChanged,
  fromEvent,
  map,
  share,
  tap,
} from 'rxjs';
import { json5 } from 'tnp-core/src';
//#endregion

//#region constants
const log = Log.create('Table wrapper', Level.__NOTHING);
const defaultColumns = [
  {
    header: 'ID',
    field: 'id',
  },
  {
    header: 'NAME',
    field: 'name',
  },
] as MtxGridColumn[];
//#endregion

@Component({
  //#region component options
  selector: 'taon-table',
  templateUrl: './taon-table.component.html',
  styleUrls: ['./taon-table.component.scss'],
})
export class TaonTableComponent {
  //#region fields
  @Input() public pageNumber: number = 1;
  @Input() public pageSize: number = 5;
  @Input() public allowedColumns: string[] = [];
  @Input() public entity: typeof Taon.Base.Entity | string;
  @Input() public expansionTemplate: TemplateRef<any>;
  @Input() public rows = _.times(20, id => {
    return {
      id,
      name: `Amazing ${id} row `,
    };
  });
  @Input() public columns: MtxGridColumn[] = defaultColumns as MtxGridColumn[];
  @Input() public pageSizeOptions: number[] = [5, 10, 20];
  @Output() public expansionChange = new EventEmitter();

  @Output() public addingItem = new EventEmitter<void>();
  @ViewChild('search', { static: true }) search?: ElementRef<HTMLElement>;
  private searchInputChange$ = defer(() =>
    fromEvent<KeyboardEvent>(this.search?.nativeElement as any, 'keyup')
  ).pipe(
    map(c => c.target['value']),
    debounceTime(500),
    distinctUntilChanged(),
    share(),
    tap(data => {
      console.log({ data });
    })
  );

  public expandable: boolean = false;
  public showPaginator = true;
  public isLoading = false;
  public totalElements: number = 100;
  private sub: Subscription = new Subscription();
  //#endregion

  constructor() {}

  //#region hooks

  //#region hooks / on init
  async ngOnInit() {
    if (_.isString(this.entity)) {
      this.entity = CLASS.getBy(this.entity) as any;
    }

    this.sub.add(this.searchInputChange$.subscribe());
    if (!!this.entity) {
      this.rows = [];
    }
    this.expandable = !!this.expansionTemplate;
    // this.arrayDataConfig.set.pagination.rowDisplayed(5);
    log.i('this.columns,', this.columns);
    const columnsConfigSameAsDefault = _.isEqual(this.columns, defaultColumns);
    // console.log({
    //   columnsConfigSameAsDefault
    // })

    const entityClass = this.entity;
    if (entityClass && columnsConfigSameAsDefault) {
      log.i(
        'this.crud.entity',
        CLASS.describeProperites(entityClass as Function)
      );

      try {
        const props = CLASS.describeProperites(entityClass as Function);
        let columns = props
          .filter(prop =>
            this.allowedColumns.length > 0
              ? this.allowedColumns.includes(prop)
              : true
          )
          .map(prop => {
            return {
              header: _.upperCase(prop),
              field: prop,
            } as MtxGridColumn;
          });

        const extra = this.allowedColumns.filter(f => !props.includes(f));
        columns = [
          ...columns,
          ...extra.map(prop => {
            return {
              header: _.upperCase(prop),
              field: prop,
            } as MtxGridColumn;
          }),
        ];

        // console.log({
        //   extra
        // });

        if (!this.expandable) {
          for (let index = 0; index < columns.length; index++) {
            const col = columns[index];
            delete col.showExpand;
          }
        }
        this.columns = columns;
      } catch (error) {
        console.error(error);
      }
    } else {
    }

    if (!this.entity) {
      this.showPaginator = false;
    }

    await this.retriveData();
  }
  //#endregion

  //#region hooks / on destroy
  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
  //#endregion

  //#endregion

  //#region methods

  //#region methods / get next page
  async getNextPage(e: PageEvent) {
    // console.log({
    //   e
    // });
    this.pageNumber = e.pageIndex + 1;
    this.pageSize = e.pageSize;
    await this.retriveData();
  }
  //#endregion

  //#region methods / retrive data
  async retriveData() {
    // @ts-ignore
    // TODO @LAST
    // if (!this.entity) {
    //   return;
    // }
    // this.isLoading = true;
    // // console.log('PAGINTION FETCH DATA START!')
    // const controller = ((this.entity as any).ctrl as Taon.CRUD.Base<any>);
    // if (controller) {
    //   const data = await controller.pagination(this.pageNumber, this.pageSize).received;
    //   // console.log('PAGINTION DATA', {
    //   //   data,
    //   // })
    //   const totalElements = Number(data.headers.get(Morphi.SYMBOL.X_TOTAL_COUNT));
    //   const rows = data.body.json;
    //   // console.log('PAGINTION DATA', {
    //   //   rows,
    //   //   totalElements,
    //   // })
    //   this.totalElements = totalElements;
    //   this.rows = rows.map(d => {
    //     for (const key in d) {
    //       if (Object.prototype.hasOwnProperty.call(d, key)) {
    //         const elem = d[key];
    //         if (_.isObject(elem)) {
    //           d[key] = json5.stringify(d[key]);
    //         }
    //       }
    //     }
    //     // console.log({ d })
    //     return d;
    //   })
    // }
    // this.isLoading = false;
  }
  //#endregion

  //#region methods / expansion row
  expansionRow(e) {
    this.expansionChange.next(e);
  }
  //#endregion

  //#region methods / on table context menu
  onTableContextMenu(e) {
    // if (this.rowHref) {
    //   this.router.navigateByUrl(this.rowHref)
    // }
    log.i('context menu event', e);
  }
  //#endregion

  //#endregion
}
