//#region @websql
import { Entity } from 'firedev-typeorm/src';
//#endregion
import { EndpointContext } from '../endpoint-context';
import { Symbols } from '../symbols';
import { BaseClass } from './base-class';

let EntityDecorator = () => {
  return (target: any) => {};
};

//#region @websql
EntityDecorator = Entity;
//#endregion

@EntityDecorator()
export abstract class BaseEntity<
  /**
   * type for cloning
   */
  CloneT extends BaseClass = any,
> extends BaseClass<CloneT> {}
