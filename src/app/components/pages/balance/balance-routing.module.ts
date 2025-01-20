import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportBalanceComponent } from './report-balance/report-balance.component';
import { AssignBalanceComponent } from './assign-balance/assign-balance.component';

const routes: Routes = [
  {path:'',component:ReportBalanceComponent},
  {path:'assign',component:AssignBalanceComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BalanceRoutingModule { }
