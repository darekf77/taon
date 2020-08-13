
import { Morphi } from 'morphi';
import { TestowyController } from './TestowyController';

export interface ITESTOWY {
  id?: number;
  exampleProperty?: string;
}

@Morphi.Entity<TESTOWY>({
  className: 'TESTOWY',
  mapping: {

  }
})
export class TESTOWY extends Morphi.Base.Entity<TESTOWY, ITESTOWY> implements ITESTOWY {

  static ctrl: TestowyController;
  public static all() {
    return this.ctrl.getAll();
  }

  public static czescwerka() {
    return this.ctrl.circualDep().received;
  }

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number

  //#region @backend
  @Morphi.Orm.Column.Custom()
  //#endregion
  exampleProperty: string

  werka: TESTOWY;

  testuj() {

  }

}


