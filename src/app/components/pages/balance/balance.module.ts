import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BalanceRoutingModule } from './balance-routing.module';
import { AssignBalanceComponent } from './assign-balance/assign-balance.component';
import { ReportBalanceComponent } from './report-balance/report-balance.component';
import { LibraryModule } from "../../library/library.module";
import { MaterialModule } from 'src/app/modules/material/material.module';


@NgModule({
  declarations: [
    AssignBalanceComponent,
    ReportBalanceComponent
  ],
  imports: [
    CommonModule,
    BalanceRoutingModule,
    LibraryModule,
    MaterialModule
]
})
export class BalanceModule { }
