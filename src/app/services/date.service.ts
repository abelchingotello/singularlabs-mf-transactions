/**
 * File: date.service.ts
 * Description: Servicio Angular para manejo y formateo de fechas en diferentes formatos.
 *              Funcionalidades:
 *                - formatStartDate: devuelve fecha inicial con hora 00:00:00.
 *                - formatEndDate: devuelve fecha final con hora 23:59:59.
 *                - formatTrayDate: formatea fecha como yyyy/MM/dd para visualización.
 *                - formatToSaveDate: formatea fecha para almacenamiento en base de datos.
 *                - formatToExportDate: devuelve fecha como yyyyMMddHHmmss para exportaciones.
 * 
 * Maintenance:
 *  - Last modified: 21-Oct-2025
 */

import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateService {

  constructor(
    private readonly datePipe: DatePipe
  ) { }


  // Método para formatStartDate
  public formatStartDate(startDate: Date): string {
    if (startDate) {
      return `${this.datePipe.transform(startDate, 'yyyy-MM-dd')} 00:00:00`; // Retornamos la fecha como yyyy-MM-dd 00:00:00
    }
    return '';
  }

  // Método para formatEndDate
  public formatEndDate(endDate: Date): string {
    if (endDate) {
      return `${this.datePipe.transform(endDate, 'yyyy-MM-dd')} 23:59:59`; // Retornamos la fecha formateda como yyyy-MM-dd 23:59:59
    }
    return '';
  }

  // Método para formatTrayDate
  public formatTrayDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy/MM/dd') ?? ''; // Retornamos la fecha formateada como dd/MM/yyyy
  }

  // Método para formatToSaveDate
  public formatToSaveDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd HH:mm:ss') ?? ''; // Retornamos la fecha formateada como yyyy-MM-dd HH:mm:ss
  }

  // Método para formatCustomDate
  public formatToExportDate(date: string): string {
    const dateformat = new Date(date);
    const yyyy = dateformat.getFullYear();
    const MM = String(dateformat.getMonth() + 1).padStart(2, '0');
    const dd = String(dateformat.getDate()).padStart(2, '0');
    const HH = String(dateformat.getHours()).padStart(2, '0');
    const mm = String(dateformat.getMinutes()).padStart(2, '0');
    const ss = String(dateformat.getSeconds()).padStart(2, '0');
    return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
  }
}
