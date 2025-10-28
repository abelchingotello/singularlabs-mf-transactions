import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServicesService {

  public servicePayment = new BehaviorSubject<any[]>([]);

  private readonly url = `${environment.URL_API_GATEWAY}`;
  //private url = `${environment.URL_API_LOCAL}`; //LAMBDA LOCAL

  constructor(
    private readonly httpClient: HttpClient
  ) { }

  getServices(name?: string): Observable<any> {
    let params = new HttpParams()
    if (name) {
      params = params.set('name', name);
    }
    return this.httpClient.get<any>(`${this.url}/services`, { params: params });
  }

  getServicesPageKey(category: string, status: string, pageKey?: any[]): Observable<any> {
    let params = new HttpParams()
    if (pageKey !== undefined) {
      params = params.set('pageKey', JSON.stringify(pageKey));
    }
    params = params.set('status', status);
    params = params.set('category', category);

    params = params.set('count', 0);
    params = params.set('limit', 200);
    return this.httpClient.get<any>(`${this.url}/services`, { params: params });
  }

}
