//#region imports
import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { _ } from 'tnp-core/src';
import { StaticColumnsModule } from 'static-columns/src';
import { TaonFullMaterialModule } from '../../../taon-full-material.module';
import { FlatTreeControl } from '@angular/cdk/tree';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';
import { TaonTableModule } from '../../../taon-table/taon-table.module';
//#endregion

@Component({
  selector: 'taon-db-admin',
  templateUrl: './taon-db-admin.component.html',
  styleUrls: ['./taon-db-admin.component.scss'],
  imports: [
    CommonModule,
    TaonFullMaterialModule,
    StaticColumnsModule,
    TaonTableModule,
  ],
  standalone: true,
})
export class TaonDbAdminComponent implements OnInit {
  public dataBaseInited: boolean = false;
  public tables: any[] = [];
  async ngOnInit() {}

  public trackByName(a: any) {
    return a.name;
  }

  async initDb() {
    // const data = await TaonBinaryFile.ctrl.getAllEntities().received;
    // this.tables = data.body.json;
  }
}
