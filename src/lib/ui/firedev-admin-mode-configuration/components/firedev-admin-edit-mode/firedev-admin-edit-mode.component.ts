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
import { FiredevFile } from '../../../firedev-file';
import { FiredevAdmin } from '../../firedev-admin';
import { Router } from '@angular/router';
import { Stor } from 'firedev-storage/src';
import 'brace';
import 'brace/mode/css';
import 'brace/mode/typescript';
import 'brace/theme/github';
import { Firedev } from 'firedev/src';
import { MtxGridColumn } from '@ng-matero/extensions/grid';
// import 'brace/theme/twilight';

//#endregion

@Component({
  //#region component options
  selector: 'firedev-admin-edit-mode',
  templateUrl: './firedev-admin-edit-mode.component.html',
  styleUrls: ['./firedev-admin-edit-mode.component.scss'],
  //#endregion
})
export class FiredevAdminEditModeComponent implements OnInit {
  //#region fields & getters
  // inited$ = Firedev.anyContextLoaded();
  inited$ = of(true);
  private destroyed$ = new Subject();
  admin = window['firedev'] as FiredevAdmin;
  handlers: Subscription[] = [];
  entity = FiredevFile;
  files: FiredevFile[] = [];

  @Stor.property.in.localstorage
    .for(FiredevAdminEditModeComponent)
    .withDefaultValue(0)
  selectedTabIndex: number;

  @Stor.property.in.localstorage
    .for(FiredevAdminEditModeComponent)
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
  @Output() firedevAdminEditModeDataChanged = new EventEmitter();
  @Input() firedevAdminEditModeData: any = {};
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

  searchFind(file: FiredevFile): any {
    if (!!this?.fileToSearch) {
      return file?.src?.search(this?.fileToSearch) !== -1;
    }
    return true;
  }
  //#endregion
}
//#endregion
