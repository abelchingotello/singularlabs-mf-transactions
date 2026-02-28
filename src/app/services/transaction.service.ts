/**
 * File: transaction.service.ts
 * Description: Servicio Angular para la gestión de transacciones del sistema.
 *              Funcionalidades:
 *                - Obtener transacciones con filtros y paginación.
 *                - Actualizar el estado de una transacción.
 *                - Consultar balances y balances actuales.
 *                - Exportar transacciones en formatos XLSX o CSV.
 * 
 * Maintenance:
 *  - Last modified: 21-Oct-2025
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  private readonly url = `${environment.URL_API_GATEWAY}`;
  constructor(
    private readonly httpClient: HttpClient,
  ) { }


  getTransaction(filters: TransactionFilters, limit?: number, page?: number | string, count?: number, totalAmount?: number): Observable<any> {
    const extraParams = {
      limit,
      page,
      count,
      totalAmount
    }

    const params = this.buildTransactionParams(filters, extraParams);
    return this.httpClient.get(`${this.url}/transactions`, { params });
  }
  getTransactionReports(filters: TransactionFilters, limit?: number, page?: number | string, count?: number, totalAmount?: number): Observable<any> {
    const extraParams = {
      limit,
      page,
      count,
      totalAmount
    }

    const params = this.buildTransactionParams(filters, extraParams);
    return this.httpClient.get(`${this.url}/transactions/reports`, { params });
  }

  updateTransactionStatus(data: any): Observable<any> {
    return this.httpClient.post<any>(`${this.url}/transactions/status`, data);
  }

  getBalance(filters?: any, limit?: any, page?: any, count?: any): Observable<any> {
    const extraParams = {
      limit,
      page,
      count: count !== undefined ? Number(count) : undefined,
    }
    const params = this.buildTransactionParams(filters, extraParams);

    return this.httpClient.get(`${this.url}/transactions/balances`, { params });
  }

  getCurrentBalances(filters: any, limit?: any, page?: any, count?: any): Observable<any> {
    const extraParams = {
      limit,
      page,
      count: count !== undefined ? Number(count) : undefined,
    }
    const params = this.buildTransactionParams(filters, extraParams);
    return this.httpClient.get(`${this.url}/transactions/current-balances`, { params });
  }

  exportTransactions(
    format: 'xlsx' | 'csv',
    filters: TransactionFilters,
    bandeja: string,
    token: string
  ): Observable<ExportResponse> {

    const extraParams: ExtraParams = {
      format,
      token,
      inbx: bandeja
    };

    const params = this.buildTransactionParams(filters, extraParams);
    return this.httpClient.get<ExportResponse>(`${this.url}/export`, { params });
  }

  private buildTransactionParams(
    filters: TransactionFilters,
    extraParams?: ExtraParams
  ): HttpParams {
    const baseEntries = Object.entries({
      concept: filters.numDoc ?? filters.concept,
      supply: filters.supply,
      idclient: filters.idclient,
      idprovider: filters.idprovider,
      dateStart: filters.dateStart,
      status: filters.status,
      id_operacion_detalle: filters.id_operacion_detalle,
      dateEnd: filters.dateEnd,
      idService: filters.idService,
      typeEntity: filters.typeEntity,
      entity: filters.entity,
      typeAssign: filters.typeAssign,
      idundServ: filters.idundServ,
      statusConc: filters.statusConc
    });

    const combined = [
      ...baseEntries,
      ...(extraParams ? Object.entries(extraParams) : []),
    ].filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== -1);

    return combined.reduce((p, [k, v]) => {
      if (v !== undefined && v !== null) {
        return p.set(k, String(v));
      }
      return p;
    }, new HttpParams());

  }


}

interface TransactionFilters {
  concept?: string;
  numDoc?: string;
  supply?: string;
  idclient?: string;
  idprovider?: string;
  status?: string;
  dateStart?: string;
  dateEnd?: string;
  idService?: string[];
  idundServ?: string;
  id_operacion_detalle?: string;
  typeEntity?: string;
  entity?: string;
  typeAssign?: string;
  statusConc?: string
}

interface ExtraParams {
  [key: string]: string | number | undefined;
}

interface ExportResponse {
  statusCode: number;
  message?: string;
}
