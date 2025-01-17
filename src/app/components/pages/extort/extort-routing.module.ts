import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExtortTransactionComponent } from './extort-transaction/extort-transaction.component';

const routes: Routes = [
  {path:'',component:ExtortTransactionComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ExtortRoutingModule { }
