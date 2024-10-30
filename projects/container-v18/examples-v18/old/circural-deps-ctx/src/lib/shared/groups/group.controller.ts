import { Taon } from 'taon/src';
import { Group } from './group';
import { GroupContext } from './group.context';

@Taon.Controller({
  className: 'GroupController',
})
export class GroupController extends Taon.Base.CrudController<Group> {
  entityClassResolveFn = () => Group;
}
