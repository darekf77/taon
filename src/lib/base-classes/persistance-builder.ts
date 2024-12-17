import type { BaseController } from './base-controller';
import type { BaseEntity } from '../base-classes/base-entity';

export class PersistenceBuilder<T extends BaseEntity[] = []> {
  private entitiesPromisesData: BaseEntity[] = [];

  // Persist a simple entity
  public entity<U extends BaseEntity>(
    entity: U,
  ): PersistenceBuilder<[...T, U]> {
    this.entitiesPromisesData.push(entity); // TODO
    return new PersistenceBuilder<[...T, U]>(
      this.entitiesPromisesData,
      this.ctrl,
    );
  }

  // Persist an entity dependent on previous entities
  public entityWith<U extends BaseEntity>(
    fn: (previousEntities: T) => U,
  ): PersistenceBuilder<[...T, U]> {
    const newEntity = fn(this.entitiesPromisesData as T); // TODO
    this.entitiesPromisesData.push(newEntity);
    return new PersistenceBuilder<[...T, U]>(
      this.entitiesPromisesData,
      this.ctrl,
    );
  }

  public finalize<U>(
    fn: (previousEntities: T) => Promise<U> | U,
  ): PersistenceBuilder {
    const newEntity = fn(this.entitiesPromisesData as T); // TODO
    // this.entitiesPromisesData.push(newEntity); //
    return new PersistenceBuilder(this.entitiesPromisesData, this.ctrl);
  }

  constructor(
    existingEntities: BaseEntity[],
    private ctrl: BaseController,
  ) {
    this.entitiesPromisesData = existingEntities;
  }
}
