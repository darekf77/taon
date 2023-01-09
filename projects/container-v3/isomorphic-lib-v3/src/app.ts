//#region @notForNpm

//#region @browser
    import { NgModule } from '@angular/core';
    import { Component, OnInit } from '@angular/core';


    @Component({
      selector: 'app-isomorphic-lib-v3',
      template: 'hello from isomorphic-lib-v3'
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
    //#endregion

    //#region @backend
    async function start(port: number) {
      console.log('hello world from backend');
    }

    export default start;

//#endregion

//#endregion