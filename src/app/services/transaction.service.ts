import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  private readonly url = `${environment.URL_API_GATEWAY}`;

  //private url = `${environment.URL_API_LOCAL}`; //LAMBDA LOCAL
  constructor(
    private readonly httpClient: HttpClient,
  ) { }

  getTransaction(filters: any, limit?: any, page?: any, count?: any, totalAmount?: any): Observable<any> {
    let params = new HttpParams();

    if (filters.numDoc !== undefined) {
      params = params.set('concept', filters.numDoc);
    }
    if (filters.supply !== undefined) {
      params = params.set('supply', filters.supply);
    }

    if (filters.idclient !== undefined) {
      params = params.set('idclient', filters.idclient);
    }

    if (filters.idprovider !== undefined) {
      params = params.set('idprovider', filters.idprovider);
    }

    if (filters.status !== undefined) {
      params = params.set('status', filters.status);
    }

    if (filters.dateStart !== undefined && filters.dateStart !== null) {
      params = params.set('dateStart', filters.dateStart);
    }

    if (filters.dateEnd !== undefined && filters.dateEnd !== null) {
      params = params.set('dateEnd', filters.dateEnd);
    }

    if (filters.idService !== undefined) {
      params = params.set('idService', filters.idService);
    }

    if (filters.idundServ !== undefined) {
      params = params.set('idundServ', filters.idundServ);
    }

    if (limit !== undefined) {
      params = params.set('limit', limit);
    }

    if (page !== undefined) {
      params = params.set('page', page);
    }
    if (Number(count) >= 0) {
      params = params.set('count', Number(count));
    }
    if (Number(totalAmount) >= 0) {
      params = params.set('totalAmount', Number(totalAmount));
    }
    return this.httpClient.get(`${this.url}/transactions`, { params });
  }

  updateTransactionStatus(data: any): Observable<any> {
    return this.httpClient.post<any>(`${this.url}/transactions/status`, data);
  }
  
  getBalance(filters?: any, limit?: any, page?: any, count?: any): Observable<any> {
    let params = new HttpParams();
    if (filters.typeEntity !== undefined) {
      params = params.set('typeEntity', filters.typeEntity);
    }
    if (filters.entity !== undefined) {
      params = params.set('entity', filters.entity);
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
    if (limit !== undefined) {
      params = params.set('limit', limit);
    }
    if (page !== undefined) {
      params = params.set('page', page);
    }
    if (count >= 0) {
      params = params.set('count', Number(count));
    }
    return this.httpClient.get(`${this.url}/transactions/balances`, { params });
  }

  getCurrentBalances(limit?: any, page?: any, typeEntity?: any, entity?: any, count?: any): Observable<any> {
    let params = new HttpParams();
    if (typeEntity !== undefined) {
      params = params.set('typeEntity', typeEntity);
    }
    if (entity !== undefined) {
      params = params.set('entity', entity);
    }
    if (limit !== undefined) {
      params = params.set('limit', limit);
    }
    if (page !== undefined) {
      params = params.set('page', page);
    }
    if (count >= 0) {
      params = params.set('count', Number(count));
    }
    return this.httpClient.get(`${this.url}/transactions/current-balances`, { params });
  }

  //-----Exportar de archivos
  exportTransactions(
    format: 'xlsx' | 'csv',
    filters: any,
    bandeja: string,
    token: any
  ): Observable<any> {
    let params = new HttpParams();

    if (filters.supply !== undefined) {
      params = params.set('supply', filters.supply);
    }

    if (filters.idclient !== undefined) {
      params = params.set('idclient', filters.idclient);
    }

    if (filters.idprovider !== undefined) {
      params = params.set('idprovider', filters.idprovider);
    }

    if (filters.concept !== undefined) {
      params = params.set('concept', filters.concept);
    }

    if (filters.status !== undefined) {
      params = params.set('status', filters.status);
    }

    if (filters.dateStart !== undefined && filters.dateStart !== null) {
      params = params.set('dateStart', filters.dateStart);
    }
    if (filters.dateEnd !== undefined && filters.dateEnd !== null) {
      params = params.set('dateEnd', filters.dateEnd);
    }

    if (filters.idService !== undefined) {
      params = params.set('idService', filters.idService);
    }

    params = params.set('format', format);
    params = params.set('inbx', bandeja);
    params = params.set('token', token);

    return this.httpClient.get(`${this.url}/export`, { params });
  }
}
