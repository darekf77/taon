import { Taon } from 'taon/src';
import { Observable, map } from 'rxjs';
import { getMetadataArgsStorage } from 'taon-typeorm/src';

import { HOST_BACKEND_PORT } from './app.hosts';
import { AppContext } from './app.context';
import { UserController } from 'inject-tests/src';
import { SessionController } from 'inject-tests/src';
//#region @browser
import { NgModule } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';


// import { SharedContext } from 'inject-tests/src';

//#region component
@Component({
  selector: 'app-inject-tests',
  template: `hello world`,
  styles: [
    `
      body {
        margin: 0px !important;
      }
    `,
  ],
})
export class CircuralDepsCtxComponent implements OnInit {
  constructor() {}
  // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
  ngOnInit() {}
}

@NgModule({
  imports: [CommonModule],
  exports: [CircuralDepsCtxComponent],
  declarations: [CircuralDepsCtxComponent],
  providers: [],
})
export class CircuralDepsCtxModule {}
//#endregion
//#endregion

async function start() {
  console.log('hello world');
  console.log('Your server will start on port ' + HOST_BACKEND_PORT);

  await AppContext.initialize();

  // const userController = AppContext.refSync.inject(UserController);
  // const sessionController = AppContext.refSync.inject(SessionController);

  // // TODO @LAST base crud controller is singleton and it should not be
  // // TODO @LAST session is for all crud.repo -> fix this
  // // const repo = await userController.backend.repo;
  // // const all = await repo.find(); // TODO @LAST same repo different results in UserContoller
  // // console.log('All users', all);
  // // console.log('Context initialized', { AppContext });
}

export default start;
