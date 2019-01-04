import { describe } from 'mocha'
import { expect } from 'chai';
// import { hello } from '../hello';

// if you used the '@types/mocha' method to install mocha type definitions, uncomment the following line
// import 'mocha';

import { Morphi } from '../index';
import { Log } from 'ng2-logger';
const log = Log.create('formly')


@Morphi.Entity<Book>({
  className: 'Book',
  defaultModelValues: {
    title: '- no book title -'
  },
  mapping: {
    dateOfCreation: 'Date'
  }
})
class Book {

  title: string;
  dateOfCreation: Date;

}

@Morphi.Entity<User>({
  className: 'User',
  // formly: {
  //   transformFn: (f) => f
  // },
  defaultModelValues: {
    age: 18,
    isAmazing: true,
    name: 'n/a'
  },
  mapping: {
    favoriteBook: 'Book',
    readedBooks: ['Book']
  }
})
class User {

  id: number;
  age: number;
  isAmazing: boolean;
  name: string;
  favoriteBook: Book;
  readedBooks: Book[];

}

describe('Formly forml generator', () => {

  it('Should return nice formly form config', () => {

    const config = Morphi.CRUD.getFormlyFrom(User);
    console.log('')
    log.i('config', config)

    // console.log(config.map( d => `For "${d.key}"\tconfig: ${d.type}` ).join('\n') )
    console.log('')

  });


});

