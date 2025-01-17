import { TransactionService } from '../../../../services/transaction.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { DynamicTableComponent } from '../../../library/dynamic-table/dynamic-table.component';
import { PaginationUtils } from 'src/app/utilities/pagination-utils';
import { PageEvent } from '@angular/material/paginator';
import { SpinnerService } from 'src/app/services/spinner.service';
import { DialogTransactionStatusComponent } from 'src/app/dialogs/dialog-transaction-status/dialog-transaction-status.component';
import { MatDialog } from '@angular/material/dialog';

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
  public disabledEditOption:any
  public functionDataCurrent!: ((pageSize: any) => any);


  @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;

  constructor(
    private spinner : SpinnerService,
    private transactionService : TransactionService,
    private dialog: MatDialog,
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
        this.spinner.spinnerOnOff();
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


  handleSelectedIds(selectedIds: any[]) {
    // console.log("Id's: ", selectedIds)
    this.disabledEditOption = selectedIds.length !== 1;
    // this.editOption = selectedIds.length == 1;
    console.log("DESAHIBILITR: ",this.disabledEditOption)
    // this.selectedIds = selectedIds;
    console.log("Id--s: ", selectedIds)
  }

  edit(){

    const dialogRef = this.dialog.open(DialogTransactionStatusComponent, {
      width:'900px',
      data: {
      resp: '',
      // id: stateId,
      // state:this.stateMaster,
      // idClient : this.idClient,
      // idProvider : this.idProvider
    },
    });

    dialogRef.afterClosed().subscribe(result => {
      this.reload();
      console.log('The dialog was closed',result);
    });

  }

}


[{"id":"PAY_BILL","name":"BASE DE DATOS","isActive":true},{"id":"PAY_PARTIAL","name":"PAGO PARCIAL","isActive":true},{"id":"PAY_CARD","name":"PAGO CON TARJETA","isActive":true},{"id":"FREQUENT_OPERATION","name":"OPERACION FRECUENTE","isActive":true},{"id":"PAY_DEBT_OLDEST","name":"DEUDA MAS ANTIGUA","isActive":true},{"id":"PAY_ONLINE","name":"INTERCONECTADO, PAGO EN LINEA","isActive":true},{"id":"PAY_ACCOUNT","name":"PAGO CON CARGO EN CUENTA","isActive":true},{"id":"PAY_REFLECTED","name":"REFLEJO DE PAGO","isActive":true},{"id":"PAY_AUTOMATIC","name":"DEBITO AUTOMATICO","isActive":true},{"id":"PAY_FIXED_RATE","name":"TASAS FIJAS","isActive":false},{"id":"PAY_CASH","name":"PAGO EN EFECTIVO","isActive":true},{"id":"PAY_CHECK_INTERNAL","name":"PAGO CON CHEQUE PROPIO BANCO","isActive":true},{"id":"PAY_CHECK_EXTERNAL","name":"PAGO CON CHEQUE OTRO BANCO","isActive":true},{"id":"PAY_MULTIPLE_PAYMENTS","name":"ACTUALIZACION MASIVA DE DEUDAS","isActive":true}]
;


[{"id":"001","name":"NUMERO DE SUMINISTRO","fieldType":{"id":"N","name":"NUMERICO"},"fieldMask":"D","maximumLength":"8","isMandatory":true,"isEditable":true},{"id":"002","name":"NRO. COMPROBANTE","fieldType":{"id":"A","name":"ALFANUMERICO"},"fieldMask":"D","maximumLength":"13","isMandatory":true,"isEditable":true}]