
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: 'transaction',loadChildren: () => import('./transaction/transaction.module').then(x => x.TransactionModule)}, 
  { path: 'cancelation',loadChildren: () => import('./cancelation-transaction/cancelation-transaction.module').then(x => x.CancelationTransactionModule)}, 
  { path: 'extort',loadChildren: () => import('./extort/extort.module').then(x => x.ExtortModule)}, 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
