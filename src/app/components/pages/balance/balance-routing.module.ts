import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportBalanceComponent } from './control-assign/control-assign.component';
import { AssignBalanceComponent } from './assign-balance/assign-balance.component';
import { ListBalanceComponent } from './list-balance/list-balance.component';

const routes: Routes = [
  {path:'control',component:ReportBalanceComponent},
  {path:'assign',component:AssignBalanceComponent},
  {path:'list-balance',component:ListBalanceComponent},
  {path:'list-balance/admin',component:ListBalanceComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BalanceRoutingModule { }
