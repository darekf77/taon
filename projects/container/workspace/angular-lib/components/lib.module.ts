import { NgModule, NgZone, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooComponent } from './foo/foo.component';
import { BarService } from './bar/bar.service';



import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  MatCardModule,
  MatSlideToggleModule
} from '@angular/material';

@NgModule({
  imports: [
    CommonModule,
    MatSlideToggleModule,
    MatCardModule
  ],
  declarations: [
    FooComponent
  ],
  exports: [
    FooComponent,
    MatCardModule,
    MatSlideToggleModule
  ]
})
export class MyLibModule {

  public static forRoot(): ModuleWithProviders {

    return {
      ngModule: MyLibModule,
      providers: [
        BarService
      ]
    };
  }
}
