import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
// import {  } from 'isomorphic-lib/module/dupa/asd'

console.log('before HELLOO INSIDE cutRegionIfFalse')
//#region @cutRegionIfTrue ENV.currentProjectName !== 'angular-lib'
console.log('HELLOO INSIDE cutRegionIfFalse')
//#endregion
console.log('after HELLOO INSIDE cutRegionIfFalse')


@Injectable()
export class BarService {

  get value(): Observable<string> {
    return Observable.of(true)
      .map((val) => `${val}`);
  }

}
