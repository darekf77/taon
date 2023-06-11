import type { MyEntity } from "./my-entity";

export type IMyEntity = Partial<MyEntity>;

export const defaultModelValuesMyEntity: Omit<IMyEntity, 'ctrl' | 'clone'> = {
  description: '',
}
