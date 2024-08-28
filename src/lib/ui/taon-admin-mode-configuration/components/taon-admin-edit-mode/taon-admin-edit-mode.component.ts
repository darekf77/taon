//#region @browser
//#region imports
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { delay, of, Subject, Subscription, takeUntil, tap } from 'rxjs';
import { TaonFile } from '../../../taon-file';
import { TaonAdmin } from '../../taon-admin';
import { Router } from '@angular/router';
import { Stor } from 'taon-storage/src';
import 'brace';
import 'brace/mode/css';
import 'brace/mode/typescript';
import 'brace/theme/github';
import { Taon } from 'taon/src';
import { MtxGridColumn } from '@ng-matero/extensions/grid';
// import 'brace/theme/twilight';

//#endregion

@Component({
  //#region component options
  selector: 'taon-admin-edit-mode',
  templateUrl: './taon-admin-edit-mode.component.html',
  styleUrls: ['./taon-admin-edit-mode.component.scss'],
  //#endregion
})
export class TaonAdminEditModeComponent implements OnInit {
  //#region fields & getters
  // inited$ = Taon.anyContextLoaded();
  inited$ = of(true);
  private destroyed$ = new Subject();
  admin = window['taon'] as TaonAdmin;
  handlers: Subscription[] = [];
  entity = TaonFile;
  files: TaonFile[] = [];

  @Stor.property.in.localstorage
    .for(TaonAdminEditModeComponent)
    .withDefaultValue(0)
  selectedTabIndex: number;

  @Stor.property.in.localstorage
    .for(TaonAdminEditModeComponent)
    .withDefaultValue('')
  fileToSearch: string;
  columns = [
    {
      header: 'ID',
      field: 'id',
      maxWidth: 100,
      showExpand: true,
    },
    {
      header: 'src',
      field: 'src',
      maxWidth: 250,
    },
    {
      header: 'Content Type',
      field: 'contentType',
      maxWidth: 120,
    },
  ] as MtxGridColumn[];
  @Output() taonAdminEditModeDataChanged = new EventEmitter();
  @Input() taonAdminEditModeData: any = {};
  //#endregion

  //#region constructor
  constructor(private router: Router) {}
  //#endregion

  //#region hooks
  ngOnInit() {
    this.files = this.admin.currentFiles;
    this.handlers.push(
      this.admin.onEditMode$.subscribe(() => {
        this.refresFilesList();
      })
    );
    // this.handlers.push(this.router.events.subscribe(() => {
    //   this.files = this.admin.currentFiles;
    // })) // TODO to expensive

    this.admin.onRegisterFile().pipe(
      takeUntil(this.destroyed$),
      tap(() => {
        this.refresFilesList();
      })
    );
  }
  ngOnDestroy(): void {
    this.handlers.forEach(h => h.unsubscribe());
    this.destroyed$.next(void 0);
    this.destroyed$.unsubscribe();
  }

  ngAfterViewInit(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    setTimeout(() => {
      this.refresFilesList();
    }, 500);
  }

  //#endregion

  //#region methods

  expansionRow(e) {
    console.log(e);
  }
  refresFilesList() {
    // console.log('refresh files list')
    this.files = this.admin.currentFiles;
  }

  searchFind(file: TaonFile): any {
    if (!!this?.fileToSearch) {
      return file?.src?.search(this?.fileToSearch) !== -1;
    }
    return true;
  }
  //#endregion
}
//#endregion
