import { Component, OnInit, ViewChild } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { DynamicTableComponent } from 'src/app/components/library/dynamic-table/dynamic-table.component';
import { PaginationUtils } from 'src/app/utilities/pagination-utils';

@Component({
  selector: 'app-cancelation-transaction',
  templateUrl: './cancelation-transaction.component.html',
  styleUrls: ['./cancelation-transaction.component.scss']
})
export class CancelationTransactionComponent implements OnInit {

  private pagUtils: PaginationUtils | undefined;

  public columns: any[] = [
    { 'name': 'Concepto', 'attribute': 'concep' },
    { 'name': 'Comisión', 'attribute': 'comission'},
    { 'name': 'Saldo', 'attribute': 'clientBalance'},
    { 'name': 'Moneda', 'attribute': 'currency'},
    { 'name': 'Zona Operación', 'attribute': 'operationZone'},
    { 'name': 'Fecha', 'attribute': 'date','config': {
        'formatDate': { format: 'dd/MM/yyyy hh:mm a', locale: 'en-US' },
      } },
    { 'name': 'Estado', 'attribute': 'status', 'config': { 'styleClass': true }},
  ];

    public dataCancelation : any[] = [];
    public pageSize: any = 5;
    public pageKey: any[] | undefined;
    public functionDataCurrent!: ((pageSize: any) => any);
    
    
    @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;

  constructor() { 
    this.pagUtils = new PaginationUtils();
  }

  ngOnInit(): void {
  }

  reload() {
    this.clearData();
    this.dynamic.clearSelection();
    this.functionDataCurrent(this.pageSize);
  }

  clearData() {
    this.pageKey = undefined;
    this.dataCancelation = [];
    // this.reload();
  }

  onPageChange(event: PageEvent) {
    console.log("keyyyyyy", this.pageKey)
    this.pageSize = this.pagUtils?.updatePageSize(event.pageSize, this.pageSize);
    this.pagUtils?.onPageChange(event, this.pageSize, this.functionDataCurrent.bind(this), this.pageKey);
    console.log('Página cambiada', event);
  }

}
