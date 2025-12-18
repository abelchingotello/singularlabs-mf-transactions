import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PersonService {

  private readonly url = `${environment.URL_API_GATEWAY}`;
  //private readonly url = `${environment.URL_API_LOCAL}`;

  constructor(
    private readonly httpClient: HttpClient,
  ) { }

  getPerson(typeEntity?: string, nameAlias?: string, activeOnly?: boolean): Observable<any> {
    let params = new HttpParams();
    if (typeEntity) { params = params.set('typeEntity', typeEntity); };
    if (nameAlias) { params = params.set('nameAlias', nameAlias); };
    if (activeOnly) { params = params.set('activeOnly', activeOnly); };

    return this.httpClient.get(`${this.url}/person/entity`, { params: params });
  }
  getPersonsPandR(): Observable<any> {
    let params = new HttpParams();
    params = params.set('type', 'recandprov');
    return this.httpClient.get(`${this.url}/person/entity`, { params: params });
  }
  getIdPerson(id: string): Observable<any> {
    return this.httpClient.get(`${this.url}/person/${id}`);
  }

}
