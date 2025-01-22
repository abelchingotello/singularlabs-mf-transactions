import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogTransactionStatusComponent } from './dialog-transaction-status/dialog-transaction-status.component';
import { MaterialModule } from '../modules/material/material.module';
import { DialogSearchOperationComponent } from './dialog-search-operation/dialog-search-operation.component';



@NgModule({
  declarations: [
    DialogTransactionStatusComponent,
    DialogSearchOperationComponent
  ],
  imports: [
    CommonModule,
    MaterialModule
  ]
})
export class DialogTransactionModule { }
