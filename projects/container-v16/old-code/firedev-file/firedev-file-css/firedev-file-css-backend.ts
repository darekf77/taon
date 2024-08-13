import { FiredevFileCss } from './firedev-file-css';
import type { FiredevFileCssController } from './firedev-file-css.controller';

/**
 * Backend methods for FiredevFileCss
 *
 * + use entites injected controllers to access other backends
 * + don't use controllers methods/properties here
 */
export class FiredevFileCssBackend {
  //#region initialization
  public static for(ctrl: FiredevFileCssController) {
    return new FiredevFileCssBackend(ctrl);
  }
  private get repo() {
    return this.ctrl.repository;
  }
  private constructor(private ctrl: FiredevFileCssController) {}
  //#endregion

  async countEntities() {
    await this.ctrl.repository.count();
  }

  async initExampleDbData() {
    // await this.repo.save(FiredevFileCss.from({ description: 'hello world' }))
    // const all = await this.repo.find()
  }
}
