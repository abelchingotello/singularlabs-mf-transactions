import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  private url = `${environment.URL_API_GATEWAY}`;

  constructor(
    private httpClient: HttpClient,
  ) { }

  getTransaction(idclient?:string,idprovider?:string,status?:string,date?:any,idService?:string,limit?:any ,pageKey?:any []):Observable<any>{
    let params = new  HttpParams();

    console.log("idservicio: ",idService)
    console.log("serviciofecha : ",date)

    if(idclient !== undefined){
      params = params.set('idclient',idclient);
    }

    if(idprovider !== undefined){
      params = params.set('idprovider',idprovider);
    }

    if(status !== undefined){
      params = params.set('status',status);
    }

    if(date !== undefined){
      params = params.set('date',date);
    }
    if(idService !== undefined){
      params = params.set('idService',idService);
    }

    if (limit !== undefined) {
      params = params.set('limit', limit);
    }
    
    if (pageKey !== undefined) {
      params = params.set('pageKey', JSON.stringify(pageKey));
    }
    return this.httpClient.get(`${this.url}/transactions`,{params});
  }

  getBalance(limit?:any ,pageKey?:any []):Observable<any>{
    let params = new  HttpParams();
    if (limit !== undefined) {
      params = params.set('limit', limit);
    }
    
    if (pageKey !== undefined) {
      params = params.set('pageKey', JSON.stringify(pageKey));
    }
    return this.httpClient.get(`${this.url}/transactions/balances`,{params});
  }

  getIdTransaction(id:string,limit?:any ,pageKey?:any []):Observable<any>{
    let params = new  HttpParams();
    if (limit !== undefined) {
      params = params.set('limit', limit);
    }
    
    if (pageKey !== undefined) {
      params = params.set('pageKey', JSON.stringify(pageKey));
    }
    return this.httpClient.get(`${this.url}/transactions/${id}`,{params});
  }

  balanceVoucher(numberOperation:string){
    let params = new HttpParams();
    params = params.set('numberOperation', numberOperation);
    return this.httpClient.get(`${this.url}/transactions/voucher`,{params});
  }
}
