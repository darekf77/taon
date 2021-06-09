import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
// import {  } from 'isomorphic-lib/module/dupa/asd'

console.log('before HELLOO INSIDE cutRegionIfFalse')
//#region @cutRegionIfTrue ENV.currentProjectName !== 'angular-lib'
console.log('HELLOO INSIDE cutRegionIfFalse')
//#endregion
console.log('after HELLOO INSIDE cutRegionIfFalse')


@Injectable()
export class BarService {

  get value(): Observable<string> {
    return of('');
  }

}
