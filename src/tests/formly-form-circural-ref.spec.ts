import { describe } from 'mocha'
import { expect } from 'chai';
import * as fse from 'fs-extra'
import * as path from 'path';
import * as _ from 'lodash';
// import { hello } from '../hello';

// if you used the '@types/mocha' method to install mocha type definitions, uncomment the following line
// import 'mocha';

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

describe('Formly forml generator - circural ref', () => {

  it('Should handle circural references', () => {

    let config = Morphi.CRUD.getFormlyFrom(Person);

    expect(config.length).to.be.gt(0)

  });

});
