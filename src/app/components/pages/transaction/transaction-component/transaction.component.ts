import { TransactionService } from '../../../../services/transaction.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { DynamicTableComponent } from '../../../library/dynamic-table/dynamic-table.component';
import { PaginationUtils } from 'src/app/utilities/pagination-utils';
import { PageEvent } from '@angular/material/paginator';
import { SpinnerService } from 'src/app/services/spinner.service';
import { DialogTransactionStatusComponent } from 'src/app/dialogs/dialog-transaction-status/dialog-transaction-status.component';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogSearchOperationComponent } from 'src/app/dialogs/dialog-search-operation/dialog-search-operation.component';
import { MytoastrService } from 'src/app/services/mytoastr';

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
    { 'name': 'Monto transacción', 'attribute': 'amountTransaction'},
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
  public formOperation! : FormGroup<any>;
  public transaction :any;
  public respSearch : any


  @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;

  constructor(
    private spinner : SpinnerService,
    private transactionService : TransactionService,
    private dialog: MatDialog,
    private fb : FormBuilder,
    private mytoastr : MytoastrService
  ) { 
    this.pagUtils = new PaginationUtils();
  }

  ngOnInit(): void {
    this.functionDataCurrent = this.getDataTransaction.bind(this);
    this.functionDataCurrent(this.pageSize)
    this.initialForm();
  }


  initialForm(){
    this.formOperation = this.fb.group({
      numOperation: ['', Validators.required],
    })
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

  searchOperation(){
    if(!this.numOperation?.valid){
      this.mytoastr.showWarning('Ingrese un valor para búsqueda','')
      return
    }
    this.spinner.spinnerOnOff();
    console.log("searchOperation", this.formOperation)
    // return
    this.transactionService.balanceVoucher(this.numOperation?.value).subscribe({
      next: (response: any) => {
        this.respSearch = response
        if (response.statusCode !== 200) {
          this.spinner.spinnerOnOff();
          let resp = response?.message || response?.messages
          this.mytoastr.showError(resp, 'Error');
          return
        }
        this.transaction = response.data
      },
      error: (error: any) => {
        this.spinner.spinnerOnOff();
        console.error('Error:', error);
      },
      complete: () => {
        if(this.respSearch.statusCode == 200){
          this.spinner.spinnerOnOff();
          this.openDialog();
          this.mytoastr.showSuccess('Operacion encontrada','')
        }
      }
    })



  }

  openDialog(){
    const dialogRef = this.dialog.open(DialogSearchOperationComponent, {
      width:'900px',
      panelClass:'dialog-container',
      data: {
      resp: this.transaction 
    },
    });

    dialogRef.afterClosed().subscribe(result => {
      this.reload();
      console.log('The dialog was closed',result);
    });
  }

  get numOperation(){
    return this.formOperation.get('numOperation');
  }

}