// import { Taon } from 'taon/src';
// import { EMPTY, Observable, catchError, map, of, startWith } from 'rxjs';
// import { Helpers, _ } from 'tnp-core/src';
// //#region @notForNpm
// import { HOST_BACKEND_PORT } from './app.hosts';
// //#region @browser
// import { NgModule } from '@angular/core';
// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-taon',
//   template: `hello from taon<br>
//     <br>
//     users from backend
//     <ul>
//       <li *ngFor="let user of (users$ | async)"> {{ user | json }} </li>
//     </ul>
//   `,
//   styles: [` body { margin: 0px !important; } `],
// })
// export class TaonComponent implements OnInit {
//   users$: Observable<User[]> = User.ctrl.getAll().received.observable
//     .pipe(
//       map(data => data.body.json),
//     );

//   constructor() { }
//   ngOnInit() { }
// }

// @NgModule({
//   imports: [CommonModule],
//   exports: [TaonComponent],
//   declarations: [TaonComponent],
//   providers: [],
// })
// export class TaonModule { }
// //#endregion

// @Taon.Entity({ className: 'User' })
// class User extends Taon.Base.Entity {
//   static from(user: Partial<User>) {
//     return _.merge(new User(), user);
//   }
//   public static ctrl?: UserController;
//   //#region @websql
//   @Taon.Orm.Column.Generated()
//   //#endregion
//   id?: string | number;

//   //#region @websql
//   @Taon.Orm.Column.Custom({ type: 'varchar', length: 100 })
//   //#endregion
//   name?: string;
// }

// @Taon.Controller({ className: 'UserController', entity: User })
// class UserController extends Taon.Base.Controller<User> {

//   @Taon.Http.PUT()
//   helloWorld(@Taon.Http.Param.Query('id') id: string, @Taon.Http.Param.Query('test') test: number): Taon.Response<string> {
//     //#region @websqlFunc
//     return async () => {
//       console.log({ id, test })
//       return 'hello world from ' + (Helpers.isElectron && Helpers.isNode) ? 'ipc' : 'http';
//     }
//     //#endregion
//   }

//   //#region @websql
//   async initExampleDbData(): Promise<void> {
//     await this.repository.save(User.from({ name: 'Sam' }))
//     await this.repository.save(User.from({ name: 'Samuela' }))
//   }
//   //#endregion
// }

// async function start(portForBackend?: string) {
//   console.log({ portForBackend })

//   console.log('Helpers.isElectron', Helpers.isElectron)
//   console.log('Your server will start on port ' + HOST_BACKEND_PORT);
//   const host = 'http://localhost:' + HOST_BACKEND_PORT;

//   const context = await Taon.init({
//     host,
//     controllers: [
//       UserController,
//       // PUT TAON CONTORLLERS HERE
//     ],
//     entities: [
//       User,
//       // PUT TAON ENTITIES HERE
//     ],
//     //#region @websql
//     config: {
//       type: 'better-sqlite3',
//       database: 'tmp-db.sqlite',
//       logging: false,
//     }
//     //#endregion
//   });

//   if (Taon.isBrowser) {
//     const helloWorld = (await User.ctrl!.helloWorld('secrethashid', 444).received)!.body?.rawJson;
//     console.log({
//       'helloWorld from backend': helloWorld
//     })
//   }
// }

// export default start;

// //#endregion
