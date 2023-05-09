import type { MyEntity } from "./my-entity";

export type IMyEntity = Partial<MyEntity>;

export const defaultModelValues: IMyEntity = {
  description: ''
}
