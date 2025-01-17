import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CancelationTransactionComponent } from './cancelation-transaction/cancelation-transaction.component';

const routes: Routes = [
  {path:'',component:CancelationTransactionComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CancelationTransactionRoutingModule { }
