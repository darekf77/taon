import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseModuleComponent } from './base-module.component';
import { Route, RouterModule, PreloadAllModules } from '@angular/router';


const routes: Route[] = [
  {
    path: '',
    children: [
      {
        path: 'home',
        loadChildren: () => import('./childs/home-mod/home-mod.module').then(m => m.HomeModModule)
      },
      {
        path: 'route',
        loadChildren: () => import('./childs/route-module/route-module.module').then(m => m.RouteModuleModule)
      }
    ]
  }
]

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forRoot(routes, {
      useHash: true,
      preloadingStrategy: PreloadAllModules,
      // enableTracing: true
    })
  ],
  exports: [
    BaseModuleComponent
  ],
  declarations: [BaseModuleComponent]
})
export class BaseModuleModule { }
