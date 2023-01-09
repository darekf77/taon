import { Morphi } from 'morphi';

export interface IPIES {
  id?: number;
  exampleProperty?: string;
}

@Morphi.Entity<PIES>({
  className: 'PIES',
  mapping: {

  }
})
export class PIES extends Morphi.Base.Entity<PIES, IPIES> implements IPIES {

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number

  //#region @backend
  @Morphi.Orm.Column.Custom()
  //#endregion
  exampleProperty: string

}