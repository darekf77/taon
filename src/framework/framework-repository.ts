import {
  Repository as TypeormRepository, UpdateResult, DeepPartial,
  SaveOptions, FindConditions, ObjectID, EntityRepository
} from 'typeorm';
import * as _ from 'lodash';
import { RealtimeNodejs } from '../realtime/realtime-nodejs';

export function Repository(entity: Function) {
  return function (target: any) {
    EntityRepository(entity)(target)
  }
}


// TODO fix it whe typescipt stable
export abstract class BASE_REPOSITORY<Entity, GlobalAliases> extends TypeormRepository<Entity> {


  //#region @backend

  constructor() {
    super()
  }

  // async update(criteria: string | string[] | number | number[] | Date | Date[] | ObjectID | ObjectID[] | FindConditions<Entity>,
  //   partialEntity: DeepPartial<Entity>, options?: SaveOptions): Promise<UpdateResult> {
  //   const m = await super.update(criteria, partialEntity, options);
  //   const entity = await this.findOne(criteria as any)
  //   RealtimeNodejs.populate({ entity: entity as any });
  //   return m;
  // }

  async updateRealtime(criteria: string | string[] | number | number[] | Date | Date[] | ObjectID | ObjectID[] | FindConditions<Entity>,
    partialEntity: DeepPartial<Entity>, options?: SaveOptions): Promise<UpdateResult> {
    const m = await super.update(criteria, partialEntity, options);
    const entity = await this.findOne(criteria as any)
    // console.log('ENtity to populate criteria: ', criteria)
    // console.log('ENtity to populate: ', entity)
    RealtimeNodejs.populate({ entity: entity as any });
    return m;
  }

  __: { [prop in keyof GlobalAliases]: { [propertyName in keyof Entity]: string } };
  _: GlobalAliases;

  abstract globalAliases: (keyof GlobalAliases)[];

  pagination() {
    // TODO
  }

  //#endregion

}
