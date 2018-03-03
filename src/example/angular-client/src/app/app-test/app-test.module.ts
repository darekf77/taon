import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppTestComponent } from './app-test.component';
import { FormsModule } from '@angular/forms';

// import { MyLibModule } from 'angular-lib';
import { Routes, RouterModule } from '@angular/router';



export const routes: Routes = [
  {
      path: '',
      pathMatch: 'prefix',
      component: AppTestComponent
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),

  ],
  declarations: [AppTestComponent]
})
export class AppTestModule { }
