import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CancelationTransactionRoutingModule } from './cancelation-transaction-routing.module';
import { CancelationTransactionComponent } from './cancelation-transaction/cancelation-transaction.component';
import { LibraryModule } from '../../library/library.module';
import { MaterialModule } from 'src/app/modules/material/material.module';


@NgModule({
  declarations: [
    CancelationTransactionComponent
  ],
  imports: [
    CommonModule,
    CancelationTransactionRoutingModule,
    LibraryModule,
    MaterialModule
  ]
})
export class CancelationTransactionModule { }
