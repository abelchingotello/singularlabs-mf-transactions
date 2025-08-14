import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BalanceRoutingModule } from './balance-routing.module';
import { AssignBalanceComponent } from './assign-balance/assign-balance.component';
import { ReportBalanceComponent } from './control-assign/control-assign.component';
import { LibraryModule } from "../../library/library.module";
import { MaterialModule } from 'src/app/modules/material/material.module';
import { ListBalanceComponent } from './list-balance/list-balance.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    AssignBalanceComponent,
    ReportBalanceComponent,
    ListBalanceComponent
  ],
  imports: [
    CommonModule,
    BalanceRoutingModule,
    LibraryModule,
    MaterialModule,
    ReactiveFormsModule,
    FormsModule,
]
})
export class BalanceModule { }
