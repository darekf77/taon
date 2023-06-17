import type { MyEntity } from "./my-entity";

export type MyEntityNonColumnsKeys =
  'ctrl' |
  'clone';

export const MyEntityNonColumnsKeysArr = [
  'ctrl',
  'clone',
] as MyEntityNonColumnsKeys[];

export type IMyEntity = Partial<MyEntity>;

export const defaultModelValuesMyEntity: Omit<IMyEntity, MyEntityNonColumnsKeys> = {
  description: '',
}
