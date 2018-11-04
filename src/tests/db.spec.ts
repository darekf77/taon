import * as _ from 'lodash';
import { describe } from 'mocha'
import { expect } from 'chai';

import { MetaDB } from '../browser-db/browser-db';




describe('DB test', () => {

  it('should be empty db at begin', () => {

    expect(_.isEmpty(MetaDB)).to.be.true;
  });





});
