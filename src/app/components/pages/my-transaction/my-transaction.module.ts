import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MyTransactionRoutingModule } from './my-transaction-routing.module';
import { MyTransactionComponent } from './my-transaction/my-transaction.component';
import { LibraryModule } from '../../library/library.module';
import { MaterialModule } from 'src/app/modules/material/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    MyTransactionComponent
  ],
  imports: [
    CommonModule,
    MyTransactionRoutingModule,
    LibraryModule,
    MaterialModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class MyTransactionModule { }
