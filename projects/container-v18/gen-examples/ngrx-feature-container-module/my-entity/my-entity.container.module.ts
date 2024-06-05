//#region @browser
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyEntityContainer } from './my-entity.container';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { MyEntityEffects } from './effects/my-entity.effects';
import { myEntityFeatureKey } from './my-entity.models';
import { myEntityReducer } from './reducers/my-entity.reducers';
import { MyEntityService } from './services/my-entity.service';

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature(myEntityFeatureKey, myEntityReducer),
    EffectsModule.forFeature([MyEntityEffects]),
  ],
  declarations: [MyEntityContainer],
  exports: [MyEntityContainer],
  providers: [MyEntityService],
})
export class MyEntityContainerModule { }
//#endregion
