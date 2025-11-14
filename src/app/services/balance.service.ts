import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BalanceService {

  private url = `${environment.URL_API_GATEWAY}`;

  constructor(
    private httpClient: HttpClient,
  ) { }


  assignBalance(data: any): Observable<any> {
    return this.httpClient.post(`${this.url}/transactions/balances`, data);
  }

  verificateCode(code: string, user: string): Observable<any> {
    const params = new HttpParams()
      .set('verificateCode', true)
      .set('code', code)
      .set('userId', user);
    return this.httpClient.post(`${this.url}/transactions/balances`, {}, { params });
  }

  generateCode(userId: string, token: string): Observable<any> {
    const params = new HttpParams()
      .set('generateCode', true)
      .set('userId', userId)
      .set('token', token);
    return this.httpClient.post(`${this.url}/transactions/balances`, {}, { params });
  }
  exportBalances(
    format: 'xlsx' | 'csv',
    filters: any
  ): Observable<HttpResponse<string>> {
    const params = new HttpParams({
      fromObject: {
        ...filters,
        format: format
      }
    });

    return this.httpClient.get(`${this.url}/transactions/balances/export`, {
      params,
      observe: 'response',
      responseType: 'text' // para manejar base64
    });
  }
}
