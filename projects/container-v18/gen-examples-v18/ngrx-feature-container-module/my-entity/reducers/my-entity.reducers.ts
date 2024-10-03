import { createReducer, on } from '@ngrx/store';
import * as _ from 'lodash';
import * as myEntityActions from '../actions/my-entity.actions'
import { MyEntityInitialState } from '../my-entity.models';

const initialState: MyEntityInitialState = {
  myEntityArr: [],
};

export const myEntityReducer = createReducer(
  initialState,
  on(
    myEntityActions.FETCH_SUCCESS,
    (state) => {
      const newState = _.cloneDeep(state);
      return { ...state, ...newState };
    }
  ),
);
