import { describe } from 'mocha'
import { expect } from 'chai';
import * as fse from 'fs-extra'
import * as path from 'path';
import * as _ from 'lodash';

import { Morphi } from '../index';
import { Log } from 'ng2-logger';
import { walk } from 'lodash-walk-object';
const log = Log.create('formly')



@Morphi.Entity<Article>({
  className: 'Article',
  defaultModelValues: {
    title: '- no book title -'
  },
  mapping: {
    owner: 'Person',
    readedBy: ['Person']
  }
})
class Article {
  @Morphi.Orm.Column.Generated()
  id: number;
  title: string;
  owner: Person;
  readedBy: Person[];

}

@Morphi.Entity<Person>({
  className: 'Person',
  defaultModelValues: {
    id: 1
  },
  mapping: {
    favoriteBook: 'Article',
    readedBooks: ['Article']
  }
})
class Person {

  id: number;
  favoriteBook: Article;
  readedBooks: Article[];

}

@Morphi.Controller({
  className: 'ArticlesController',
  entity: Article
})
class ArticlesController {

}

describe('Inject ctrl', () => {

  it('Should inject controller to entity', async () => {


    // await Morphi.init({
    //   host: 'http://localhost:8888',
    //   controllers: [ArticlesController],
    //   entities: [Article],
    //   config: {
    //     type: 'sqlite',
    //     database: 'mysql',
    //     dropSchema: true,
    //     synchronize: false,
    //     logging: false
    //   }
    // })
    new ArticlesController()
    let p = new Article()

    expect(p['ctrl']).to.be.instanceOf(ArticlesController)

  });

});
