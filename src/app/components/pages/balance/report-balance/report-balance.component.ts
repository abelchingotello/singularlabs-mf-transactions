import { Component, OnInit, ViewChild } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { DynamicTableComponent } from 'src/app/components/library/dynamic-table/dynamic-table.component';
import { SpinnerService } from 'src/app/services/spinner.service';
import { TransactionService } from 'src/app/services/transaction.service';
import { PaginationUtils } from 'src/app/utilities/pagination-utils';

@Component({
  selector: 'app-report-balance',
  templateUrl: './report-balance.component.html',
  styleUrls: ['./report-balance.component.scss']
})
export class ReportBalanceComponent implements OnInit {

  private pagUtils: PaginationUtils | undefined;

  public columns: any[] = [
    { 'name': 'Nombre', 'attribute': 'concep' },
    { 'name': 'Monto transacción', 'attribute': 'amountTransaction' },
    { 'name': 'Moneda', 'attribute': 'currency'},
    { 'name': 'Saldo cliente', 'attribute': 'clientBalance'},
    { 'name': 'Fecha', 'attribute': 'date', 'config': {
      'formatDate': { format: 'dd/MM/yyyy hh:mm a', locale: 'en-US' },
    }},
    { 'name': 'Estado', 'attribute': 'status','config':{
      'styleClass':true
    }},
  ];
  public dataBalance: any[] = [];
  public pageSize: any = 5;
  public pageKey: any[] | undefined;

  public functionDataCurrent!: (pageSize: any) => any;

  @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;

  constructor(
    private spinner : SpinnerService,
    private router: Router,
    private transactionService: TransactionService
  ) { 
    this.pagUtils = new PaginationUtils();
  }

  ngOnInit(): void {
    this.functionDataCurrent = this.getDataBalance.bind(this);
    this.functionDataCurrent(this.pageSize)
  }

  addBalance(){
    this.router.navigate(['balance/assign'])
  }

  getDataBalance(pageSize:any){
    this.spinner.spinnerOnOff();
    this.resetUser(this.getDataBalance)
    this.transactionService.getBalance(pageSize,this.pageKey).subscribe({
      next: (value:any) => {
        this.dataBalance = [...this.dataBalance,...value.data.Items];
        this.pageKey = value.data.nextPageKey ?? null
        console.log("DATA DE TRANSACTION: " ,value.data)
      },
      error: (error: any) => {
        console.error('ERROR',error);
        this.spinner.spinnerOnOff();
      },
      complete: () => {
        this.spinner.spinnerOnOff();
      }
    })
    this.functionDataCurrent = this.getDataBalance
  }

  resetUser(current: any) {
    this.pagUtils?.resetIfChanged(
      current,
      this.functionDataCurrent,
      this.clearData.bind(this)
    )
  }

  reload() {
    this.clearData();
    this.dynamic.clearSelection();
    this.functionDataCurrent(this.pageSize);
  }

  clearData() {
    this.pageKey = undefined;
    this.dataBalance = [];
  }

  onPageChange(event: PageEvent) {
    console.log("keyyyyyy", this.pageKey)
    this.pageSize = this.pagUtils?.updatePageSize(event.pageSize, this.pageSize);
    this.pagUtils?.onPageChange(event, this.pageSize, this.functionDataCurrent.bind(this), this.pageKey);
    console.log('Página cambiada', event);
  }
}
