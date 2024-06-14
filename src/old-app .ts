// import { Firedev } from 'firedev/src';
// import { EMPTY, Observable, catchError, map, of, startWith } from 'rxjs';
// import { Helpers, _ } from 'tnp-core/src';
// //#region @notForNpm
// import { HOST_BACKEND_PORT } from './app.hosts';
// //#region @browser
// import { NgModule } from '@angular/core';
// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-firedev',
//   template: `hello from firedev<br>
//     <br>
//     users from backend
//     <ul>
//       <li *ngFor="let user of (users$ | async)"> {{ user | json }} </li>
//     </ul>
//   `,
//   styles: [` body { margin: 0px !important; } `],
// })
// export class FiredevComponent implements OnInit {
//   users$: Observable<User[]> = User.ctrl.getAll().received.observable
//     .pipe(
//       map(data => data.body.json),
//     );

//   constructor() { }
//   ngOnInit() { }
// }

// @NgModule({
//   imports: [CommonModule],
//   exports: [FiredevComponent],
//   declarations: [FiredevComponent],
//   providers: [],
// })
// export class FiredevModule { }
// //#endregion

// @Firedev.Entity({ className: 'User' })
// class User extends Firedev.Base.Entity {
//   static from(user: Partial<User>) {
//     return _.merge(new User(), user);
//   }
//   public static ctrl?: UserController;
//   //#region @websql
//   @Firedev.Orm.Column.Generated()
//   //#endregion
//   id?: string | number;

//   //#region @websql
//   @Firedev.Orm.Column.Custom({ type: 'varchar', length: 100 })
//   //#endregion
//   name?: string;
// }

// @Firedev.Controller({ className: 'UserController', entity: User })
// class UserController extends Firedev.Base.Controller<User> {

//   @Firedev.Http.PUT()
//   helloWorld(@Firedev.Http.Param.Query('id') id: string, @Firedev.Http.Param.Query('test') test: number): Firedev.Response<string> {
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

//   const context = await Firedev.init({
//     host,
//     controllers: [
//       UserController,
//       // PUT FIREDEV CONTORLLERS HERE
//     ],
//     entities: [
//       User,
//       // PUT FIREDEV ENTITIES HERE
//     ],
//     //#region @websql
//     config: {
//       type: 'better-sqlite3',
//       database: 'tmp-db.sqlite',
//       logging: false,
//     }
//     //#endregion
//   });

//   if (Firedev.isBrowser) {
//     const helloWorld = (await User.ctrl!.helloWorld('secrethashid', 444).received)!.body?.rawJson;
//     console.log({
//       'helloWorld from backend': helloWorld
//     })
//   }
// }

// export default start;

// //#endregion
