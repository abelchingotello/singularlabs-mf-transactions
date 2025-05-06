// import { CountryCodes } from './../../../../../../../singularlabs-mf-users/src/app/components/library/input-phone/country-codes';
import { TransactionService } from '../../../../services/transaction.service';
import { Component, OnInit, ViewChild } from '@angular/core';
// import { DynamicTableComponent } from '../../../library/dynamic-table/dynamic-table.component';
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
  //-----------------------
  public clientBalance: any;
  public providerBalance: any;
  public currentCommission: any;

  public isFirstLoad: boolean = true;
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

  // ngOnInit(): void {
  //   this.functionDataCurrent = this.getDataTransaction.bind(this);
  //   this.functionDataCurrent(this.pageSize);
  //   this.initialForm();
  //   this.listData();
  // }
  ngOnInit(): void {
    // Primero inicializar los formularios
    this.initialForm();

    // Luego configurar la carga inicial
    this.functionDataCurrent = this.getDataTransaction.bind(this);

    // Configurar fecha actual para la carga inicial
    this.setupCurrentDateFilter();

    // Ahora cargar los datos
    this.functionDataCurrent(this.pageSize);
    this.listData();
  }

  // Método para configurar el filtro de fecha actual
  setupCurrentDateFilter(): void {
    // Asegurarse de que el formulario ya esté inicializado
    if (this.formDate) {
      const today = new Date();
      // Asignar la fecha actual al formulario
      this.formDate.get('dateStart')?.setValue(today);
      this.formDate.get('dateEnd')?.setValue(today);
    }
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

  // getDataTransaction(pageSize?: any){
  //   this.spinner.spinnerOnOff();
  //   this.resetUser(this.getDataTransaction)
  //   let entity = this.entity || undefined;
  //   let status = this.status || undefined;
  //   let idServ = this.idService || undefined;
  //   let numDoc = this.numDoc || undefined;
  //   const date = {
  //     from : this.dateService.formatTrayDate(this.dateStart).replace(/\//g, '')  || undefined,
  //     to : this.dateService.formatTrayDate(this.dateEnd).replace(/\//g, '')  || undefined
  //   }
  //   console.log("fecha: ",date)
  //   console.log("idService: ",idServ)
  //   // return
  //   this.transactionService.getTransaction(entity,undefined,status,JSON.stringify(date),idServ?.toString(),pageSize,this.pageKey,numDoc).subscribe({
  //     next: (value:any) => {
  //       if(value.statusCode === 201){
  //         this.mytoastr.showWarning(value.data.messages || 'No se encontraron transacciones','');
  //         return
  //       }
  //       this.dataTransaction = [...this.dataTransaction,...value.data.Items];
  //       if(value.data.Count != 0) this.count = value.data.Count;
  //       if(value.data.Total != 0) this.amountTransaction = (value.data.Total).toFixed(2);
  //       this.pageKey = value.data.nextPageKey ?? null
  //       console.log("DATA DE TRANSACTION: " ,value.data)
  //     },
  //     error: (error: any) => {
  //       console.error('ERROR',error);
  //       this.spinner.spinnerOnOff();
  //     },
  //     complete: () => {
  //       this.spinner.spinnerOnOff();
  //     }
  //   })
  //   this.functionDataCurrent = this.getDataTransaction
  // }
  getDataTransaction(pageSize?: any) {
    this.spinner.spinnerOnOff();
    this.resetUser(this.getDataTransaction);
    let entity = this.entity || undefined;
    let status = this.status || undefined;
    let idServ = this.idService || undefined;
    let numDoc = this.numDoc || undefined;
    const date = {
      from: this.dateService.formatTrayDate(this.dateStart).replace(/\//g, '') || undefined,
      to: this.dateService.formatTrayDate(this.dateEnd).replace(/\//g, '') || undefined
    };

    this.transactionService.getTransaction(entity, undefined, status, JSON.stringify(date), idServ?.toString(), pageSize, this.pageKey, numDoc).subscribe({
      next: (value: any) => {
        if (value.statusCode === 201) {
          this.mytoastr.showWarning(value.data.messages || 'No se encontraron transacciones', '');
          return;
        }

        this.dataTransaction = [...this.dataTransaction, ...value.data.Items];
        if (value.data.Count != 0) this.count = value.data.Count;
        if (value.data.Total != 0) this.amountTransaction = (value.data.Total).toFixed(2);

        // Capturar los valores de los nuevos campos solo en la primera carga o cuando cambia el filtro
        if (this.isFirstLoad && value.data.Items && value.data.Items.length > 0) {
          // Obtener los valores del primer registro de la respuesta (primera transacción)
          const firstTransaction = value.data.Items[0];
          if (firstTransaction.clientBalance !== undefined)
            this.clientBalance = parseFloat(firstTransaction.clientBalance).toFixed(2);
          if (firstTransaction.providerBalance !== undefined)
            this.providerBalance = parseFloat(firstTransaction.providerBalance).toFixed(2);
          if (firstTransaction.comission !== undefined)
            this.currentCommission = parseFloat(firstTransaction.comission).toFixed(2);

          // Marcar que ya no es la primera carga
          this.isFirstLoad = false;
        }

        this.pageKey = value.data.nextPageKey ?? null;
        console.log("DATA DE TRANSACTION: ", value.data);
      },
      error: (error: any) => {
        console.error('ERROR', error);
        this.spinner.spinnerOnOff();
      },
      complete: () => {
        this.spinner.spinnerOnOff();
      }
    });

    this.functionDataCurrent = this.getDataTransaction;
  }

  resetUser(current: any) {
    this.pagUtils?.resetIfChanged(
      current,
      this.functionDataCurrent,
      this.clearData.bind(this)
    )
  }


  // clearData() {
  //   this.pageKey = undefined;
  //   this.dataTransaction = [];
  //   this.clientBalance = undefined;
  //   this.providerBalance = undefined;
  //   this.currentCommission = undefined;
  //   this.amountTransaction = undefined;
  //   // this.reload();
  // }
  clearData() {
    this.pageKey = undefined;
    this.dataTransaction = [];
    // No resetamos los balances y comisión aquí,
    // se actualizarán automáticamente con la nueva consulta
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

  // search(){
  //   console.log("formulario busqueda: ",this.formDate)
  //   if(this.formDate.get('dateEnd')?.value == '' &&
  //     this.formDate.get('status')?.value == '' &&
  //     this.formDate.get('numDoc')?.value == '' &&
  //     this.formDate.get('idService')?.value == '' &&
  //     this.formDate.get('entity')?.value == ''){
  //     this.mytoastr.showWarning("Seleccione un filtro","")
  //     return
  //   }

  //   this.clearData();

  //   this.getDataTransaction(this.pageSize)
  //   // console.log("fecha buscar",this.formDate.get('date')?.value)
  // }
  search() {
    console.log("formulario busqueda: ", this.formDate);
    if (
      this.formDate.get('dateEnd')?.value == '' &&
      this.formDate.get('status')?.value == '' &&
      this.formDate.get('numDoc')?.value == '' &&
      this.formDate.get('idService')?.value == '' &&
      this.formDate.get('entity')?.value == ''
    ) {
      this.mytoastr.showWarning("Seleccione un filtro", "");
      return;
    }

    // Marcar como primera carga para capturar nuevos valores
    this.isFirstLoad = true;
    this.clearData();
    this.getDataTransaction(this.pageSize);
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
        console.log("estatus: ",masterStatus);
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

  // clearSearch(){
  //   this.formDate.get('dateEnd')?.setValue('')
  //   this.formDate.get('dateStart')?.setValue('')
  //   this.formDate.get('status')?.setValue('')
  //   this.formDate.get('entity')?.setValue('')
  //   this.formDate.get('idService')?.setValue('')
  //   this.formDate.get('numDoc')?.setValue('')
  //   //limpiar tabla de transacciones
  //   this.clearData();
  //   this.getDataTransaction(this.pageSize)
  // }
  clearSearch() {
    if (this.formDate) {
      this.formDate.get('dateEnd')?.setValue('');
      this.formDate.get('dateStart')?.setValue('');
      this.formDate.get('status')?.setValue('');
      this.formDate.get('entity')?.setValue('');
      this.formDate.get('idService')?.setValue('');
      this.formDate.get('numDoc')?.setValue('');
    }

    // Marcar como primera carga para capturar nuevos valores
    this.isFirstLoad = true;
    this.clearData();

    // Configurar la fecha actual antes de hacer la consulta
    this.setupCurrentDateFilter();
    this.getDataTransaction(this.pageSize);
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

  //----
  exportDataViaAPI(fileType: 'xlsx' | 'csv'): void {
    console.log('exportDataViaAPI called with', fileType);
    this.spinner.spinnerOnOff();

    // Preparar los filtros para la exportación
    const exportFilters: Record<string, any> = {
      idclient: this.entity,
      idprovider: undefined,
      status: this.status,
      date: this.dateStart || this.dateEnd ?
        JSON.stringify({
          from: this.dateStart ? this.dateService.formatTrayDate(this.dateStart).replace(/\//g, '') : undefined,
          to: this.dateEnd ? this.dateService.formatTrayDate(this.dateEnd).replace(/\//g, '') : undefined
        }) : undefined,
      idService: this.idService?.toString(),
      CONCEPT: this.numDoc
    };

    // Eliminar propiedades undefined
    Object.keys(exportFilters).forEach(key => {
      if (exportFilters[key] === undefined) {
        delete exportFilters[key];
      }
    });

    this.transactionService.exportTransactions(fileType, exportFilters).subscribe({
      next: (response) => {
        this.spinner.spinnerOnOff();

        // Verificar si la respuesta tiene cuerpo
        if (!response.body) {
          this.mytoastr.showError('La respuesta no contiene datos', '');
          return;
        }else{
          console.log("Sí tiene datos el response")
        }

        // Decodificar base64
        const responseBody = response.body || '';
        const byteCharacters = atob(responseBody);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
        }

        // Obtener nombre del archivo desde headers
        let filename = `transacciones_${new Date().toISOString().split('T')[0]}.${fileType}`;
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
          const parts = contentDisposition.split('filename=');
          if (parts.length > 1) {
            filename = parts[1].replace(/"/g, '').trim();
          }
        }

        console.log('Downloading file:', filename);

        // Crear Blob con el tipo MIME del backend
        const blob = new Blob([byteArray], {
          type: response.headers.get('Content-Type') || 'application/octet-stream'
        });

        // Descargar
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(link.href);
      },
      error: (error) => {
        console.error('Error al exportar los datos:', error);
        this.mytoastr.showError('Error al exportar los datos', '');
        this.spinner.spinnerOnOff();
      }
    });
  }
  //----

}
