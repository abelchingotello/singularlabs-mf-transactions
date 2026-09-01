import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogTransactionStatusComponent } from './dialog-transaction-status/dialog-transaction-status.component';
import { MaterialModule } from '../modules/material/material.module';
import { DialogSearchOperationComponent } from './dialog-search-operation/dialog-search-operation.component';
import { DialogAdjustBalanceComponent } from './dialog-adjust-balance/dialog-adjust-balance.component';
import { DialogMinBalanceComponent } from './dialog-min-balance/dialog-min-balance.component';
import { DialogTransactionLogsComponent } from './dialog-transaction-logs/dialog-transaction-logs.component';
import { DialogTransactionReprocessComponent } from './dialog-transaction-reprocess/dialog-transaction-reprocess.component';



@NgModule({
  declarations: [
    DialogTransactionStatusComponent,
    DialogSearchOperationComponent,
    DialogAdjustBalanceComponent,
    DialogMinBalanceComponent,
    DialogTransactionLogsComponent,
    DialogTransactionReprocessComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
  ]
})
export class DialogTransactionModule { }
