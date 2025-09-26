import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BalanceService {

  private url = `${environment.URL_API_GATEWAY}`;
  //private url = `${environment.URL_API_LOCAL}`;

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
    filters: any,
    bandeja: any
  ): Observable<HttpResponse<Blob>> {
    let params = new HttpParams();
    Object
    if (filters.entity !== undefined) {
      params = params.set('entity', filters.entity);
    }

    if (filters.typeEntity !== undefined) {
      params = params.set('typeEntity', filters.typeEntity);
    }

    if (filters.typeAssign !== undefined) {
      params = params.set('typeAssign', filters.typeAssign);
    }

    if (filters.dateStart !== undefined && filters.dateStart !== null) {
      params = params.set('dateStart', filters.dateStart);
    }
    if (filters.dateEnd !== undefined && filters.dateEnd !== null) {
      params = params.set('dateEnd', filters.dateEnd);
    }

    params = params.set('format', format);
    params = params.set('inbx', bandeja);
    console.log('Exporting balances with params:', params.toString());
    return this.httpClient.get(`${this.url}/transactions/export`, {
      params,
      observe: 'response',
      responseType: 'blob'
    });
  }
}
