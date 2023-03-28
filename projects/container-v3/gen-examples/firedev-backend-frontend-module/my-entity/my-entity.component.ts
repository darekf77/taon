//#region @browser
import { Component, OnInit } from '@angular/core';
import { MyEntityService } from './my-entity.service';

@Component({
  selector: 'app-my-entity',
  templateUrl: './my-entity.component.html',
  styleUrls: ['./my-entity.component.scss'],
  providers: [MyEntityService]
})
export class MyEntityComponent implements OnInit {

  constructor(
    protected service: MyEntityService
  ) { }

  ngOnInit() {
  }

}
//#endregion
