//#region @browser
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { myEntityFeatureKey, MyEntityInitialState } from '../my-entity.models';

const myEntityFeatureSelector = createFeatureSelector<MyEntityInitialState>(myEntityFeatureKey);

export const allBatches = createSelector(myEntityFeatureSelector, state => {
  return state.myEntityArr;
});


export const filterAllBatchesBy = (customerId: string) => {
  return createSelector(myEntityFeatureSelector, state => {
    return state.myEntityArr;
  });
}


export const allowedToUndo = createSelector(myEntityFeatureSelector, state => {
  return state.myEntityArr.length > 0;
});

//#endregion
