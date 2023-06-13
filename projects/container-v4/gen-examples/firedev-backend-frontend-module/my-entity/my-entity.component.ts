//#region @browser
import { Component, OnInit } from '@angular/core';
import { MyEntityService } from './my-entity.service';
import { CommonModule } from '@angular/common';
import { FiredevFullMaterialModule } from 'firedev-ui';
import { StaticColumnsModule } from 'static-columns';

@Component({
  selector: 'my-entity',
  templateUrl: './my-entity.component.html',
  styleUrls: ['./my-entity.component.scss'],
  providers: [MyEntityService],
  standalone: true,
  imports: [
    CommonModule,
    // FiredevFullMaterialModule,
    // StaticColumnsModule,
  ],
})
export class MyEntityComponent implements OnInit {

  constructor(
    protected service: MyEntityService
  ) { }

  ngOnInit() {
  }

}
//#endregion
