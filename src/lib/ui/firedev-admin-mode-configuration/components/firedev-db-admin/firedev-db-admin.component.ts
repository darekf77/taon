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
import { FiredevFullMaterialModule } from '../../../firedev-full-material.module';
import { FlatTreeControl } from '@angular/cdk/tree';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';
import { FiredevBinaryFile } from '../../../firedev-binary-file/firedev-binary-file';
import { FiredevDbEntity } from '../../../firedev-binary-file/firedev-db-entity';
import { FiredevTableModule } from '../../../firedev-table/firedev-table.module';
//#endregion

@Component({
  selector: 'firedev-db-admin',
  templateUrl: './firedev-db-admin.component.html',
  styleUrls: ['./firedev-db-admin.component.scss'],
  imports: [
    CommonModule,
    FiredevFullMaterialModule,
    StaticColumnsModule,
    FiredevTableModule,
  ],
  standalone: true,
})
export class FiredevDbAdminComponent implements OnInit {
  public dataBaseInited: boolean = false;
  public tables: FiredevDbEntity[] = [];
  async ngOnInit() {}

  public trackByName(a: FiredevDbEntity) {
    return a.name;
  }

  async initDb() {
    const data = await FiredevBinaryFile.ctrl.getAllEntities().received;
    this.tables = data.body.json;
  }
}
