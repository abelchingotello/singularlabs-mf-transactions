import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ExtortRoutingModule } from './extort-routing.module';
import { ExtortTransactionComponent } from './extort-transaction/extort-transaction.component';
import { LibraryModule } from '../../library/library.module';
import { MaterialModule } from 'src/app/modules/material/material.module';


@NgModule({
  declarations: [
    ExtortTransactionComponent
  ],
  imports: [
    CommonModule,
    ExtortRoutingModule,
    LibraryModule,
    MaterialModule
  ]
})
export class ExtortModule { }
