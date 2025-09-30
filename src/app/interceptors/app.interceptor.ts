import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HTTP_INTERCEPTORS,
  HttpErrorResponse
} from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';

import { Router } from '@angular/router';
import { MytoastrService } from '../services/mytoastr';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AppInterceptor implements HttpInterceptor {

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly myToastr : MytoastrService,
  ) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let intReq = request;
    const token = this.authService.getToken();

    if (token) {

      const apiKey = '36IZghAT9e4TtIbjPh6cy4T49cGaigwL6CVWudmm'; 
      intReq = request.clone({
        headers: request.headers
        .set('Authorization','Bearer ' + token)
        .set('x-api-key', apiKey),
        // params: request.params.set('companyId', companyId)
      });
    }
    return next.handle(intReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Redirige al usuario a la página de inicio de sesión cuando el token caduca
          this.myToastr.showError('Tu sesión ha caducado.','Por favor, inicia sesión nuevamente.');
          setTimeout(() => {
            this.router.navigate(['/sign-in']);
          }, 1000);
        }
        // Devuelve el error para que otras partes de la aplicación puedan manejarlo si es necesario
        return throwError(() => error);
      })
    );
  }
}

export const interceptorSpringProvider = [{ provide: HTTP_INTERCEPTORS, useClass: AppInterceptor, multi: true }]