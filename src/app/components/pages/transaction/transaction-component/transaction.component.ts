import { CountryCodes } from './../../../../../../../singularlabs-mf-users/src/app/components/library/input-phone/country-codes';
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
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { MasterService } from 'src/app/services/master.service';
import { PersonService } from 'src/app/services/person.service';
import { DatePipe } from '@angular/common';
import { DateService } from 'src/app/services/date.service';
import { ServicesService } from 'src/app/services/services.service';

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.component.html',
  styleUrls: ['./transaction.component.scss']
})
export class TransactionComponent implements OnInit {

  private pagUtils: PaginationUtils | undefined;

  public columns: any[] = [
    { 'name': 'Titular', 'attribute': 'bill'},
    { 'name': 'Recaudador', 'attribute': 'client'},
    { 'name': 'Num. recibo', 'attribute': 'concep'},
    { 'name': 'Monto', 'attribute': 'amountTransaction'},
    // { 'name': 'Moneda', 'attribute': 'currency'},
    { 'name': 'Proveedor', 'attribute': 'provider'},
    { 'name': 'Fecha', 'attribute': 'date','config': {
      'formatDate': { format: 'dd/MM/yyyy hh:mm a', locale: 'en-US' },
    } 
  },
  { 'name': 'Cod. respuesta', 'attribute': 'reference' },
    { 'name': 'Estado', 'attribute': 'status', 'config': { 'styleClass': true }},
  ];
  public dataTransaction : any[] = [];
  
  public pageSize: any = 5;
  public pageKey: any[] | undefined;
  public disabledEditOption:any
  public functionDataCurrent!: ((pageSize: any) => any);
  public formOperation! : FormGroup<any>;
  public formDate! : FormGroup<any>;
  public transaction :any;
  public respSearch : any;
  public masterStatus: any;
  public entityTypes: any;
  public serviceName : any;
  public count :any
  public amountTransaction: any;

  
  @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;

  constructor(
    private spinner : SpinnerService,
    private transactionService : TransactionService,
    private dialog: MatDialog,
    private fb : FormBuilder,
    private mytoastr : MytoastrService,
    private masterService : MasterService,
    private personService : PersonService,
    private dateService : DateService,
    private serviceServ : ServicesService
  ) { 
    this.pagUtils = new PaginationUtils();
  }

  ngOnInit(): void {
    this.functionDataCurrent = this.getDataTransaction.bind(this);
    this.functionDataCurrent(this.pageSize);
    this.initialForm();
    this.listData();
  }


  initialForm(){
    this.formOperation = this.fb.group({
      numOperation: ['', Validators.required],
    });
    this.formDate = this.fb.group({
      dateStart: [''],
      dateEnd: [''],
      entity: [''],
      idService : [''],
      numDoc : [''],
      status: [''],
    });
  }

  getDataTransaction(pageSize?: any){
    this.spinner.spinnerOnOff();
    this.resetUser(this.getDataTransaction)
    let entity = this.entity || undefined;
    let status = this.status || undefined;
    let idServ = this.idService || undefined;
    let numDoc = this.numDoc || undefined;
    const date = {
      from : this.dateService.formatTrayDate(this.dateStart).replace(/\//g, '')  || undefined,
      to : this.dateService.formatTrayDate(this.dateEnd).replace(/\//g, '')  || undefined
    }
    console.log("fecha: ",date)
    console.log("idService: ",idServ)
    // return
    this.transactionService.getTransaction(entity,undefined,status,JSON.stringify(date),idServ?.toString(),pageSize,this.pageKey,numDoc).subscribe({
      next: (value:any) => {
        if(value.statusCode === 201){
          this.mytoastr.showWarning(value.data.messages || 'No se encontraron transacciones','');
          return
        }
        this.dataTransaction = [...this.dataTransaction,...value.data.Items];
        this.count = value.data.Count
        this.amountTransaction = (value.data.Total).toFixed(2)
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

  search(){
    console.log("formulario busqueda: ",this.formDate)
    if(this.formDate.get('dateEnd')?.value == '' &&
      this.formDate.get('status')?.value == '' &&
      this.formDate.get('numDoc')?.value == '' &&
      this.formDate.get('idService')?.value == '' &&
      this.formDate.get('entity')?.value == ''){
      this.mytoastr.showWarning("Seleccione un filtro","")
      return
    }

    this.clearData();

    this.getDataTransaction(this.pageSize)
    // console.log("fecha buscar",this.formDate.get('date')?.value)
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
  
  listData() {
    this.spinner.spinnerOnOff();
    forkJoin([
      this.masterService.getItemsMasterTable('16'), // Tipos de documentos de identidad
      this.personService.getPerson('RECAUDADORA DE SERVICIOS'),// Tipo de entidades
      this.serviceServ.getServices()
    ]).subscribe({
      next: (response) => {
        const [masterStatus,entity,service] = response;
        this.masterStatus = masterStatus.sort((a:any, b:any) => a.master_order - b.master_order);
        this.entityTypes = entity.data
        this.serviceName = service.data.Items
        console.log("ESTADOS: ",this.masterStatus)
        console.log("ENTITIDADES: ",this.entityTypes)
        console.log("SERVICIOS: ",this.serviceName)
        
        this.spinner.spinnerOnOff();
      },
      error: (error) => {
        this.spinner.spinnerOnOff();
        console.error("Error loading master table data:", error);
      }
    });
  }

  clearSearch(){
    this.formDate.get('dateEnd')?.setValue('')
    this.formDate.get('dateStart')?.setValue('')
    this.formDate.get('status')?.setValue('')
    this.formDate.get('entity')?.setValue('')
    this.formDate.get('idService')?.setValue('')
    this.formDate.get('numDoc')?.setValue('')
    //limpiar tabla de transacciones
    this.clearData();
    this.getDataTransaction(this.pageSize)
  }

  get numOperation(){
    return this.formOperation.get('numOperation');
  }

  get dateStart(){
    return this.formDate?.get('dateStart')?.value;
  }

  get numDoc(){
    return this.formDate?.get('numDoc')?.value;
  }
 
  get dateEnd(){
    return this.formDate?.get('dateEnd')?.value;
  }

  get status(){
    return this.formDate?.get('status')?.value;
  }

  get entity(){
    return this.formDate?.get('entity')?.value;
  }

  get idService(){
    return this.formDate?.get('idService')?.value;
  }

}