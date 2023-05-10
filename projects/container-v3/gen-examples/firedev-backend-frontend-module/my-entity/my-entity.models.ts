import type { MyEntity } from "./my-entity";

export type IMyEntity = Partial<MyEntity>;

export const defaultModelValues: Omit<IMyEntity, 'ctrl' | 'clone'> = {
  description: '',
}
