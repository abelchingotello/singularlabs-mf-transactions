import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TransactionRoutingModule } from './transaction-routing.module';
import { TransactionComponent } from './transaction-component/transaction.component';
import { LibraryModule } from "../../library/library.module";
import { MaterialModule } from 'src/app/modules/material/material.module';


@NgModule({
  declarations: [
    TransactionComponent
  ],
  imports: [
    CommonModule,
    TransactionRoutingModule,
    LibraryModule,
    MaterialModule
]
})
export class TransactionModule { }
