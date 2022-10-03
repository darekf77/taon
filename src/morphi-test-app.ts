// //#region @notForNpm
// import { _, crossPlatformPath, path } from 'tnp-core';
// //#region @backend
// import {
//   fse,
//   rimraf,
//   os,
//   child_process,
//   http, https,
// } from 'tnp-core';
// //#endregion
// import { Morphi as Firedev } from './index';

// @Firedev.Entity({ className: 'Book' })
// class Book extends Firedev.Base.Entity<any> {
//   static from(name: string) {
//     const b = new Book();
//     b.name = name;
//     return b;
//   }

//   //#region @websql
//   @Firedev.Orm.Column.Custom('varchar')
//   //#endregion
//   public name: string

//   //#region @websql
//   @Firedev.Orm.Column.Generated()
//   //#endregion
//   public id: number

// }

// @Firedev.Controller({ className: 'BookCtrl', entity: Book })
// class BookCtrl extends Firedev.Base.Controller<any> {
//   //#region @websql
//   async initExampleDbData() {
//     const db = await this.connection.getRepository(Book);
//     await db.save(Book.from('alice in wonderland'));
//     await db.save(Book.from('cryptography'));
//   }
//   //#endregion
// }

// const start = async (port = 3000) => {
//   const host = `http://localhost:${port}`;
//   console.log(`HOST MORPHI: ${host}`);
//   //#region @websql
//   const config = {
//     type: 'better-sqlite3',
//     database: 'tmp-db.sqlite',
//     synchronize: true,
//     dropSchema: true,
//     logging: false
//   };
//   //#endregion

//   const context = await Firedev.init({
//     host,
//     controllers: [BookCtrl],
//     entities: [Book],
//     //#region @websql
//     config: config as any
//     //#endregion
//   });
//   //#region @backend
//   if (Firedev.isNode) {
//     context.node.app.get('/hello', (req, res) => {
//       res.send('Hello express')
//     })
//   }
//   //#endregion

//   // console.log(context);
//   if (Firedev.IsBrowser) {
//     const c: BookCtrl = _.first(context.controllers);
//     const data = (await c.getAll().received).body.json as Book[];
//     // console.log(data);



//     data.forEach(b => {
//       Firedev.Realtime.Browser.listenChangesEntityObj(b).subscribe(() => {
//         console.log(`hello update: ${b.id} `)
//       });
//     })
//   }
//   //#region @websql
//   if (Firedev.isNode) {
//     const dbfile = crossPlatformPath(path.join(crossPlatformPath(process.cwd()), config.database));
//     // console.log(`dbfile: ${dbfile}`)
//     // setTimeout(() => {

//     // }, 2000)
//     const db = await context.connection.getRepository(Book);
//     let oldData = await db.find();
//     //#region @backend
//     fse.watchFile(dbfile, async (a, b) => {
//       // console.log(`update entities`)
//       const newData = await db.find();
//       oldData.forEach(b => {
//         const newb = newData.find(d => d.id === b.id);
//         if (newb) {
//           if (!_.isEqual(newb.name, b.name)) {
//             Firedev.Realtime.Server.TrigggerEntityChanges(b);
//           }
//         } else {
//           Firedev.Realtime.Server.TrigggerEntityChanges(b);
//         }
//         oldData = newData;
//       })
//     });
//     //#endregion
//     // context.controllers.forEach(c => {

//     // })
//   }

//   //#endregion
// }

// if (Firedev.IsBrowser) {
//   start()
// }


// export default start;
// //#endregion
