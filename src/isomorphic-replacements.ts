//#region @backend
import { Repository } from 'typeorm/repository/Repository';
//#endregion

export class TypeormRepository<T>
  //#region @backend
  extends Repository<T>
//#endregion
{

}