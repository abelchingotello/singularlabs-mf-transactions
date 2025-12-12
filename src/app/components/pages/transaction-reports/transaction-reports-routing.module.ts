import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TransactionReportsComponent } from './transaction-reports-component/transaction-reports.component';

const routes: Routes = [
  { path: ':type', component: TransactionReportsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TransactionReportsRoutingModule { }
