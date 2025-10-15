import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { interceptorSpringProvider } from './interceptors/app.interceptor';
import { ToastrModule } from 'ngx-toastr';
import { LibraryModule } from './components/library/library.module';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DialogTransactionModule } from './dialogs/dialog-transaction.module';
import { DatePipe } from '@angular/common';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    ToastrModule.forRoot(),
    LibraryModule,
    HttpClientModule,
    DialogTransactionModule
  ],
  providers: [interceptorSpringProvider,
    DatePipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
