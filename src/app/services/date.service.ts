import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateService {

  constructor(
    private datePipe: DatePipe
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
}
