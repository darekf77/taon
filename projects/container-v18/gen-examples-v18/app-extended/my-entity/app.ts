//#region imports
import { Taon } from 'taon';
import { _ } from 'tnp-core';
const host = 'http://localhost:4199';
//#region @browser
import { NgModule, NgZone, ViewEncapsulation } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from "@angular/router";
//#endregion
//#endregion

//#region @browser

//#region routes
const routes: Routes = [
  // {
  //   path: 'pazymodulerouterpath',
  //   loadChildren: () => import('lazymodule')
  //     .then(m => m.LazyModule),
  // },
];
//#endregion

//#region main component
@Component({
  selector: 'app-my-entity',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./app.scss'],
  templateUrl: './app.html',
})
export class MyEntityComponent {
  async ngOnInit() {

  }
}
//#endregion

//#region main module
@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      useHash: true,
      preloadingStrategy: PreloadAllModules,
      enableTracing: false,
      bindToComponentInputs: true
    }),
  ],
  exports: [MyEntityComponent],
  declarations: [MyEntityComponent],
  providers: [],
})
export class MyEntityModule { }
//#endregion
//#endregion

var MainContext = Taon.createContext(()=>({
  contextName: 'MainContext',
  host,
  controllers: {
    // PUT FIREDEV CONTORLLERS HERE
  },
  entities: {
    // PUT FIREDEV ENTITIES HERE
  },
  database: true,
}));

//#region taon start function
async function start() {
  // Taon.enableProductionMode();

  await MainContext.initialize();
  //#region @backend
  if (Taon.isNode) {
    context.node.app.get('/hello', (req, res) => {
      res.send('Hello my-entity')
    })
  }
  //#endregion
}
//#endregion

export default start;

