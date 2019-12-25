//#region @backend
import { Repository } from 'typeorm';
//#endregion

export class TypeormRepository<T>
  //#region @backend
  extends Repository<T>
//#endregion
{

}