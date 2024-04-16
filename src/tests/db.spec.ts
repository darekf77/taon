// import * as _ from 'lodash';
// import { describe, before } from 'mocha'
// import { expect } from 'chai';
// // import { BrowserDB } from '../browser-db/browser-db';
// import * as jsonStrinigySafe from 'json-stringify-safe';
// import { Firedev } from '../index';
// import { Helpers } from '../helpers';
// import { Log } from 'ng2-logger'
// const JSON10  = Helpers.JSON;
// const log = Log.create('test ')

// @Firedev.Entity()
// class Test {
//   static id = 0;

//   @Firedev.Orm.Column.Generated()
//   id: number;

//   users: User[];

//   name: string;
//   constructor() {
//     this.id = Test.id++;
//   }
// }

// @Firedev.Entity()
// class User {
//   static id = 0;

//   @Firedev.Orm.Column.Generated()
//   id: number;

//   authors: User[];
//   friend: User;
//   test: Test;
//   constructor() {
//     this.id = User.id++;
//   }
// }

// @Firedev.Controller()
// class SpecTestCtrl {


//   @Firedev.Http.GET()
//   getData(@Firedev.Http.Param.Path('name') name: string): Firedev.Response<User> {

//     return async () => {

//       let t = new Test();
//       t.name = name;


//       let user = new User();
//       let user2 = new User();
//       user2.test = t;
//       user.test = t;
//       user2.friend = user;

//       t.users = [user, user2, new User()];

//       user.authors = [user, new User()]
//       user2.authors = [user, user2, new User()]

//       return user;
//     }
//   }

// }

// Firedev.init({
//   config: {
//     "database": "tmp/test-db.sqlite3",
//     "type": "sqlite",
//     "synchronize": true,
//     "dropSchema": true,
//     "logging": false
//   },
//   host: 'http://localhost:50505',
//   controllers: [SpecTestCtrl],
//   entities: [Test, User]
// })

// export type Reference = { context: Object; key: string; id?: string }

// export const REF = Symbol()

// class DB {
//   private db: { [functionName in string]: { [key: string]: Object } } = {};

//   private getKeyFromObject(o: any) {
//     return o['id'];
//   }

//   private merge(existed, newObj) {
//     return _.merge(existed, newObj)
//   }

//   // private step = 0;
//   mergedToDBVersion(classObject: Object, context?: Object, insidePath: string = '', arrayId?: number): any {
//     let propertyKey = insidePath;
//     // if (!circural) {
//     //   circural = JSON.parse(jsonStrinigySafe(classObject));
//     // }

//     if (!_.isObject(classObject)) {
//       return;
//     }
//     // console.log(`\n\n${++this.step} Step classObject(${CLASS.getNameFromObject(classObject)}.id=${this.getKeyFromObject(classObject)}) context(${context ? `${CLASS.getNameFromObject(context)}.id=${this.getKeyFromObject(context)}` : ''}.${insidePath})`)
//     // console.log(this.toString())

//     if (!_.isUndefined(arrayId)) {
//       insidePath = `${insidePath}[${arrayId}]`
//     }

//     const alreadyExisted = this.getBy(CLASS.getFromObject(classObject), this.getKeyFromObject(classObject));
//     if (alreadyExisted) {
//       if (context) {
//         _.set(context, insidePath, this.merge(alreadyExisted, classObject));
//       }
//       // if (_.isUndefined(classObject[REF])) {
//       //   classObject[REF] = []
//       // }
//       // console.log('insidePath ref',insidePath)
//       // classObject[REF].push({ context, key: propertyKey, id: arrayId })

//       // console.log(`set already existed ${CLASS.getNameFromObject(alreadyExisted)}.id=${this.getKeyFromObject(alreadyExisted)}`)
//       return alreadyExisted;
//     }

//     if (_.isUndefined(this.db[CLASS.getNameFromObject(classObject)])) {
//       this.db[CLASS.getNameFromObject(classObject)] = {}
//       this.db[CLASS.getNameFromObject(classObject)][this.getKeyFromObject(classObject)] = classObject;
//     } else {
//       if (_.isUndefined(this.db[CLASS.getNameFromObject(classObject)])) {
//         this.db[CLASS.getNameFromObject(classObject)] = {}
//       }
//       const existed = this.db[CLASS.getNameFromObject(classObject)][this.getKeyFromObject(classObject)];
//       if (_.isUndefined(existed)) {
//         this.db[CLASS.getNameFromObject(classObject)][this.getKeyFromObject(classObject)] = classObject;
//       } else {
//         this.db[CLASS.getNameFromObject(classObject)][this.getKeyFromObject(classObject)] = this.merge(existed, classObject)
//       }
//     }

//     let res = this.getBy(CLASS.getFromObject(classObject), this.getKeyFromObject(classObject));
//     if (context) {
//       // const aa = _.get(context, insidePath);
//       _.set(context, insidePath, res);
//       // console.log(`set insted for ${CLASS.getNameFromObject(aa)}.${insidePath} = ${aa.id}`)
//       // console.log(`set to context(${CLASS.getNameFromObject(context)}.${insidePath} = (${CLASS.getNameFromObject(res)}.id=${this.getKeyFromObject(res)})`)
//     }


//     Object.keys(res).forEach(key => {
//       if (Array.isArray(res[key])) {
//         (res[key] as any[]).forEach((obj, i) => {
//           this.mergedToDBVersion(obj, res, `${key}`, i)
//         })
//       } else {
//         this.mergedToDBVersion(res[key], res, `${key}`)
//       }
//     })

//     return res;

//   }

//   // delete(nameOrFunction: string | Function, idOrKey: any) {
//   //   if (_.isFunction(nameOrFunction)) {
//   //     nameOrFunction = CLASS.getName(nameOrFunction)
//   //   }
//   //   nameOrFunction = nameOrFunction as string;
//   //   if (this.db[nameOrFunction]) {
//   //     let references = this.db[nameOrFunction][idOrKey] && this.db[nameOrFunction][idOrKey]['refence']
//   //     if (_.isArray(references)) {
//   //       references.forEach(r => {
//   //         let a: Reference = r as any;
//   //         if(!_.isUndefined(a.id)) {
//   //           delete a.context[a.key][a.id]
//   //         } else {
//   //           delete a.context[a.key]
//   //         }
//   //       })
//   //     }

//   //     delete this.db[nameOrFunction][idOrKey];

//   //   }
//   // }

//   getBy<T>(nameOrFunction: string | Function, idOrKey: any): T {
//     if (_.isFunction(nameOrFunction)) {
//       nameOrFunction = CLASS.getName(nameOrFunction)
//     }
//     nameOrFunction = nameOrFunction as string;
//     if (this.db[nameOrFunction]) {
//       return this.db[nameOrFunction][idOrKey] as any;
//     }
//   }

//   getAll<T>(nameOrFunction: string | Function): T[] {
//     if (_.isFunction(nameOrFunction)) {
//       nameOrFunction = CLASS.getName(nameOrFunction)
//     }
//     nameOrFunction = nameOrFunction as string;
//     if (_.isUndefined(this.db[nameOrFunction])) {
//       return []
//     }
//     // console.log('typeof this.db[nameOrFunction]',typeof this.db[nameOrFunction])
//     return Object
//       .keys(this.db[nameOrFunction])
//       .map(key => this.db[nameOrFunction as any][key]) as any;
//   }

//   public toString = () => {
//     //   // let res = '\n'
//     //   // Helpers.walkObject(this.db, p => {
//     //   //   let o = _.get(this.db, p)
//     //   //   if (Array.isArray(o)) {
//     //   //     (o as any[]).forEach(obj => {
//     //   //       res += `${p} = ${jsonStrinigySafe(obj)}\n`;
//     //   //     })
//     //   //   } else if (_.isObject(o)) {
//     //   //     res += `${p} = ${jsonStrinigySafe(o)}\n`;
//     //   //   }
//     //   // })
//     return jsonStrinigySafe(this.db, null, 4)
//   }

// }






// // const instance = BrowserDB.instance;

// describe('Firedev basic functions', () => {



//   it('Parameter should works on backend', async () => {

//     const name = 'test!';
//     let ctrl = new SpecTestCtrl()
//     let d: User = await (ctrl.getData('test!') as any)()
//     expect(d.test.name).to.be.eq(name)

//     let db = new DB()
//     d = db.mergedToDBVersion(d);

//     // console.log(d)
//     // console.log(db + '')
//     // console.log("User 0", db.getBy('User', 0))
//     // console.log("User 1", db.getBy('User', 1))
//     // console.log("Test 0", db.getBy('Test', 0))
//     const user0 = db.getBy<User>('User', 0)
//     const user1 = db.getBy<User>('User', 1)
//     const test0 = db.getBy<Test>('Test', 0)
//     expect(test0.users[0]).to.eq(user0)
//     expect(test0.users[1]).to.eq(user1)
//     expect(user0.test).to.eq(test0)
//     expect(user1.test).to.eq(test0)

//     // log.i('all users', db.getAll('User'))
//     // log.i('all ests', db.getAll('Test'))
//     // db.delete('User', 0);
//     // console.log(`\nAfte delete: \n`)
//     // console.log(db.getAll('User'))
//   });



//   it('Circural refences should works', async () => {
//     let ctrl = new SpecTestCtrl()
//     let d: User = await (ctrl.getData('test!') as any)()

//     // log.i('d',d)


//     log.i('before', JSON.parse(jsonStrinigySafe(d)))
//     const after = JSON10.stringify(d);
//     log.i('after', after)
//     log.i('circulas', JSON10.circural)
//     log.i('after', JSON10.parse(after, JSON10.circural))
//   })


// });
