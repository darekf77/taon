import { Firedev } from 'firedev/src';
import { Group } from './group';
import { GroupContext } from './group.context';

@Firedev.Controller({
  className: 'GroupController',
})
export class GroupController extends Firedev.Base.CrudController<Group> {
  entityClassResolveFn = () => Group;
}
