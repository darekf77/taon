//#region @browser
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { myEntityFeatureKey, MyEntityInitialState } from '../my-entity.models';

const myEntityFeatureSelector = createFeatureSelector<MyEntityInitialState>(myEntityFeatureKey);

export const allBatches = createSelector(myEntityFeatureSelector, state => {
  return state.myentityarr;
});

export const allowedToUndo = createSelector(myEntityFeatureSelector, state => {
  return state.myentityarr.length > 0;
});

//#endregion
console.log; // @module=my-entity
