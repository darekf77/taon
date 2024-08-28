// import { describe, it } from 'mocha'
// import { expect } from 'chai';
// import {
//   _,
//   path,
//   fse,
//   rimraf,
//   crossPlatformPath,
//   os,
//   child_process,
//   http, https,
// } from 'tnp-core';

// import { Taon } from '../index';
// import { Log } from 'ng2-logger';

// const log = Log.create('formly')

// @Taon.Entity<Article>({
//   className: 'Article',
//   defaultModelValues: {
//     title: '- no book title -'
//   },
//   mapping: {
//     owner: 'Person',
//     readedBy: ['Person']
//   }
// })
// class Article {
//   @Taon.Orm.Column.Generated()
//   id: number;
//   title: string;
//   owner: Person;
//   readedBy: Person[];

// }

// @Taon.Entity<Person>({
//   className: 'Person',
//   defaultModelValues: {
//     id: 1
//   },
//   mapping: {
//     favoriteBook: 'Article',
//     readedBooks: ['Article']
//   }
// })
// class Person {

//   id: number;
//   favoriteBook: Article;
//   readedBooks: Article[];

// }

// @Taon.Controller({
//   className: 'ArticlesController',
//   entity: Article
// })
// class ArticlesController {

// }

// describe('Inject ctrl', () => {

//   it('Should inject controller to entity', async () => {

//     // let i = new ArticlesController()
//     let p = new Article()
//     await Taon.init({
//       host: 'http://localhost:8888',
//       controllers: [ArticlesController],
//       entities: [Article],
//       config: {
//         "database": "tmp/test-inject.sqlite3",
//         "type": "sqlite",
//         "synchronize": true,
//         "dropSchema": true,
//         "logging": false
//       },
//       mode: 'tests'
//     })

//     expect(p['ctrl']).to.be.instanceOf(ArticlesController)
//     expect(Article['ctrl']).to.be.instanceOf(ArticlesController)
//   });

// });
