import { TaonController } from '../decorators/classes/controller-decorator';
import { BaseInjector } from './base-injector';
import { PersistenceBuilder } from './persistance-builder';

@TaonController({ className: 'BaseController' })
export class BaseController extends BaseInjector {

  /**
   * @deprecated USE makeSureEntitiesExistsInDB() instead
   */
  initExampleDbData() {

  }

  /**
   * This is a helper method to persist entities in the database.
   * It is used to make sure that provided entities exists in database.
   */
  protected get persist(): PersistenceBuilder {
    return new PersistenceBuilder([], this);
  }

  /**
   * FOR PRODUCTION AND DEVELOPMENT
   * make sure that provided entities exists in database
   * with provided relations/properties.
   * This will be triggered after all migrations (if in migration mode).
   *
   * WHAT I CAN RETURN HERE.. EXAMPLE:
   * return this.persist
   *   .entity(new User('Ewa')) // Persist the first user
   *   .entityWith(([ewa]) => new User('Adam', ewa.id)) // Adam depends on Ewa
   *   .finalize(async allEntities => {
   *     console.log('All entities are persisted', allEntities);
   *   });
  }
   */
  public makeSureEntitiesExistsInDB(): PersistenceBuilder<any> {
    return void 0;
  }
}
