import { Component } from '@angular/core';
import { Morphi } from 'morphi';
// import {  } from 'isomorphic-lib/module/asd/asdasd/bbb'
// import {  } from 'isomorphic-lib/module/dupa/asd'

@Component({
  selector: 'my-foo',
  templateUrl: 'foo.component.html',
  styleUrls: ['foo.component.scss']
})
export class FooComponent {

  constructor() {

    //#region @cutCodeIfFalse ENV.currentProjectName === 'angular-lib'

    console.log('ONLY IN ANGULAR-LIB')

    //#endregion
  }

}



