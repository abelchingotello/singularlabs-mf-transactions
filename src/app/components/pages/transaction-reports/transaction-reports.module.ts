import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TransactionReportsRoutingModule } from './transaction-reports-routing.module';
import { TransactionReportsComponent } from './transaction-reports-component/transaction-reports.component';
import { LibraryModule } from "../../library/library.module";
import { MaterialModule } from 'src/app/modules/material/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    TransactionReportsComponent
  ],
  imports: [
    CommonModule,
    TransactionReportsRoutingModule,
    LibraryModule,
    MaterialModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class TransactionReportsModule { }
