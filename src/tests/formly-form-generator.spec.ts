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

  it('Should return nice full formly form config', () => {

    let config = Morphi.CRUD.getFormlyFrom(User);
    // console.log('')
    // log.i('config', config)
    fse.writeJSONSync(path.join(__dirname, '..', '..', 'tmp-test-json1.json'), config, {
      spaces: 2
    })
    expect(config).to.deep.eq(jsonData());

  });


  it('Should exclude fields', () => {

    let config = Morphi.CRUD.getFormlyFrom(User, {
      keysPathesToExclude: ['name']
    });
    // console.log('config', config)

    expect(config.find(j => j['key'] === 'name')).to.be.undefined;

  });

  it('Should inlcude only fields', () => {

    let config = Morphi.CRUD.getFormlyFrom(User, {
      keysPathesToInclude: ['name']
    });
    // console.log('config', config)

    expect(config.find(j => j['key'] === 'name')).to.not.be.undefined;
    expect(config.length).to.be.eq(1)
  });



});


function jsonData() {
  let res = [
    {
      "key": "id",
      "type": "input",
      "defaultValue": null,
      "templateOptions": {
        "label": "Id"
      }
    },
    {
      "key": "age",
      "type": "input",
      "defaultValue": 18,
      "templateOptions": {
        "label": "Age"
      }
    },
    {
      "key": "isAmazing",
      "type": "switch",
      "defaultValue": true,
      "templateOptions": {
        "label": "Is Amazing"
      }
    },
    {
      "key": "name",
      "type": "input",
      "defaultValue": "n/a",
      "templateOptions": {
        "label": "Name"
      }
    },
    {
      "fieldGroupClassName": "row",
      "fieldGroup": [
        {
          "key": "id",
          "model": "favoriteBook",
          "type": "input",
          "defaultValue": null,
          "templateOptions": {
            "label": "Favorite Book / Id"
          }
        },
        {
          "key": "title",
          "model": "favoriteBook",
          "type": "input",
          "defaultValue": "- no book title -",
          "templateOptions": {
            "label": "Favorite Book / Title"
          }
        },
        {
          "key": "dateOfCreation",
          "model": "favoriteBook",
          "type": "datepicker",
          "defaultValue": null,
          "templateOptions": {
            "label": "Favorite Book / Date Of Creation"
          }
        }
      ]
    },
    {
      "key": "readedBooks",
      "type": "repeat",
      "defaultValue": [],
      "fieldArray": {
        "fieldGroupClassName": "row",
        "templateOptions": {
          "label": "Add new Readed Books"
        },
        "fieldGroup": [
          {
            "key": "id",
            "type": "input",
            "defaultValue": null,
            "templateOptions": {
              "label": "Id"
            }
          },
          {
            "key": "title",
            "type": "input",
            "defaultValue": "- no book title -",
            "templateOptions": {
              "label": "Title"
            }
          },
          {
            "key": "dateOfCreation",
            "type": "datepicker",
            "defaultValue": null,
            "templateOptions": {
              "label": "Date Of Creation"
            }
          }
        ]
      }
    }
  ]
  walk.Object(res, (value, lodashPath, changeValue) => {
    if (!value && lodashPath.endsWith('model')) {
      changeValue(null)
    }
  })
  return res;
}
