import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MyTransactionComponent } from './my-transaction/my-transaction.component';

const routes: Routes = [
  {path:'',component:MyTransactionComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MyTransactionRoutingModule { }
