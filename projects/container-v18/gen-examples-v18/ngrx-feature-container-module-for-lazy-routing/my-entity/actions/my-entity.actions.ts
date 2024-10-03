//#region @browser
import { createAction, props } from "@ngrx/store";

export const INIT = createAction(
  '[my-entity] INIT'
);

export const FETCH = createAction(
  '[my-entity] FETCH',
);

export const FETCH_SUCCESS = createAction(
  '[my-entity] FETCH_SUCCESS',
);

export const FETCH_ERROR = createAction(
  '[my-entity] FETCH_ERROR',
  props<{ error?: any }>()
);

export const UNDO = createAction(
  '[my-entity] UNDO',
  props<{ data?: any }>()
);

//#endregion
