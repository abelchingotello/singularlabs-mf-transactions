import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogTransactionStatusComponent } from './dialog-transaction-status/dialog-transaction-status.component';
import { MaterialModule } from '../modules/material/material.module';



@NgModule({
  declarations: [
    DialogTransactionStatusComponent
  ],
  imports: [
    CommonModule,
    MaterialModule
  ]
})
export class DialogTransactionModule { }
