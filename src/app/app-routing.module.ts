import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppGuard } from './guards/app.guard';
import { APP_BASE_HREF } from '@angular/common';

const routes: Routes = [
  { path: '',
    loadChildren: () => import('./components/pages/pages.module').then(x => x.PagesModule), 
    canActivate: [AppGuard]},
];

@NgModule({
  imports: [RouterModule.forRoot(routes,{
    useHash: false
  })],
  exports: [RouterModule],
  providers :[{ provide: APP_BASE_HREF, useValue: '/' }]
})
export class AppRoutingModule { }
