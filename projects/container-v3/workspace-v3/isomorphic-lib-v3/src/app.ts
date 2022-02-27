
export async function start() {
  // log.i('ENV', ENV);


}


import { NgModule } from '@angular/core';


import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-isomorphic-lib-v3',
  template:`
  hello from isomorhic lib v3
  `
})
export class IsomorphicLibV3Component implements OnInit {
  constructor() { }

  ngOnInit() { }
}

@NgModule({
  imports: [],
  exports: [IsomorphicLibV3Component],
  declarations: [IsomorphicLibV3Component],
  providers: [],
})
export class IsomorphicLibV3Module { }


//#region @backend
export default start;
//#endregion
