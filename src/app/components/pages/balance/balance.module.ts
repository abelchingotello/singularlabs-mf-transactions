import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BalanceRoutingModule } from './balance-routing.module';
import { AssignBalanceComponent } from './assign-balance/assign-balance.component';
import { ReportBalanceComponent } from './control-assign/control-assign.component';
import { LibraryModule } from "../../library/library.module";
import { MaterialModule } from 'src/app/modules/material/material.module';
import { ListBalanceComponent } from './list-balance/list-balance.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ReportBalanceComponent as ReportBalanceComponent1 } from './report-balance/report-balance.component'


@NgModule({
  declarations: [
    AssignBalanceComponent,
    ReportBalanceComponent,
    ListBalanceComponent,
    ReportBalanceComponent1

  ],
  imports: [
    CommonModule,
    BalanceRoutingModule,
    LibraryModule,
    MaterialModule,
    ReactiveFormsModule
  ]
})
export class BalanceModule { }
