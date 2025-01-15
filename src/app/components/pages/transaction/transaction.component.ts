import { TransactionService } from './../../../services/transaction.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { DynamicTableComponent } from '../../library/dynamic-table/dynamic-table.component';
import { PaginationUtils } from 'src/app/utilities/pagination-utils';
import { PageEvent } from '@angular/material/paginator';
import { SpinnerService } from 'src/app/services/spinner.service';

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.component.html',
  styleUrls: ['./transaction.component.scss']
})
export class TransactionComponent implements OnInit {

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
  public dataTransaction : any[] = [];
  
  public pageSize: any = 5;
  public pageKey: any[] | undefined;
  public functionDataCurrent!: ((pageSize: any) => any);


  @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;

  constructor(
    private spinner : SpinnerService,
    private transactionService : TransactionService
  ) { 
    this.pagUtils = new PaginationUtils();
  }

  ngOnInit(): void {
    this.functionDataCurrent = this.getDataTransaction.bind(this);
    this.functionDataCurrent(this.pageSize)
  }

  getDataTransaction(pageSize: any){
    this.spinner.spinnerOnOff();
    this.resetUser(this.getDataTransaction)
    this.transactionService.getTransaction(pageSize,this.pageKey).subscribe({
      next: (value:any) => {
        this.dataTransaction = [...this.dataTransaction,...value.data.Items];
        this.pageKey = value.data.nextPageKey ?? null
        console.log("DATA DE TRANSACTION: " ,value.data)
      },
      error: (error: any) => {
        console.error('ERROR',error);
      },
      complete: () => {
        this.spinner.spinnerOnOff();
      }
    })
    this.functionDataCurrent = this.getDataTransaction
  }

  resetUser(current: any) {
    this.pagUtils?.resetIfChanged(
      current,
      this.functionDataCurrent,
      this.clearData.bind(this)
    )
  }


  clearData() {
    this.pageKey = undefined;
    this.dataTransaction = [];
    // this.reload();
  }

  reload() {
    this.clearData();
    this.dynamic.clearSelection();
    this.functionDataCurrent(this.pageSize);
  }

  onPageChange(event: PageEvent) {
    console.log("keyyyyyy", this.pageKey)
    this.pageSize = this.pagUtils?.updatePageSize(event.pageSize, this.pageSize);
    this.pagUtils?.onPageChange(event, this.pageSize, this.functionDataCurrent.bind(this), this.pageKey);
    console.log('Página cambiada', event);
  }

  selectedHandle(event:any[]){
    console.log("SELECTED HANDLE", event)
  }
  
  selectedHandleIds(event:any[]){
    console.log("SELECTED HANDLE POR ID", event)
  }

}
