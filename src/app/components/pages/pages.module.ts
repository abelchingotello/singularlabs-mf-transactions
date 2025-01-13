import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PagesRoutingModule } from './pages-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { LibraryModule } from '../library/library.module';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule,
    LibraryModule,
    PagesRoutingModule,
    MatDialogModule
  ]
})
export class PagesModule { }
