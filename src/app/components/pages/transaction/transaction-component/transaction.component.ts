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
import { expand, filter, of, scan, startWith } from 'rxjs';

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.component.html',
  styleUrls: ['./transaction.component.scss']
})
export class TransactionComponent implements OnInit {

  private pagUtils: PaginationUtils | undefined;

  public columns: any[] = [
    { 'name': 'Recaudador', 'attribute': 'client' },
    { 'name': 'Proveedor', 'attribute': 'provider' },
    { 'name': 'Servicio', 'attribute': 'service' },
    { 'name': 'N° Suministro', 'attribute': 'supply' },
    { 'name': 'N° Recibo', 'attribute': 'concep' },
    { 'name': 'Titular', 'attribute': 'bill' },
    { 'name': 'Monto', 'attribute': 'amountTransaction' },
    {
      'name': 'Fecha',
      'attribute': 'date',
      'config': {
        'formatDate': { format: 'dd/MM/yyyy hh:mm:ss a', locale: 'en-US' },
      }
    },
    { 'name': 'Cod. Respuesta', 'attribute': 'reference' },
    {
      'name': 'Estado',
      'attribute': 'status',
      'config': { 'renderIcon': true, 'icon': 'iconStatus', 'coloricon': 'colorStatus' }
    },
  ];

  public dataTransaction: any[] = [];

  public pageSize: any = 5;
  public pageKey: any | undefined;
  public disabledEditOption: any
  public functionDataCurrent!: ((pageSize: any) => any);
  public formOperation!: FormGroup<any>;
  public formDate!: FormGroup<any>;
  public transaction: any;
  public respSearch: any;
  public masterStatus: any;
  public entityTypes: any[] = [];
  public count: any = -1;
  public page: any = 1;
  public amountTransaction: any = -1;
  public filteredServices: any[] = []; // Lista filtrada que se mostrará
  public allItems1: any[] = []; // Lista filtrada que se mostrará
  public allItems: any[] = [];
  public serviceFilter: string = '';
  public categoryTypes: any[] = [];
  public listProviders: any[] = [];
  public selectedCategory: boolean = false;

  @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;

  constructor(
    private spinner: SpinnerService,
    private transactionService: TransactionService,
    private fb: FormBuilder,
    private mytoastr: MytoastrService,
    private masterService: MasterService,
    private personService: PersonService,
    private dateService: DateService,
    private serviceServ: ServicesService,
    public dialog: MatDialog,
  ) {
    this.pagUtils = new PaginationUtils();
  }

  async ngOnInit(): Promise<void> {
    this.initialForm();
    try {
      await this.listData(); // Espera a que listData termine
      this.functionDataCurrent = this.getDataTransaction.bind(this);
      this.functionDataCurrent(this.pageSize); // Ahora sí puedes llamar esto después

    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
    }

  }

  /**
   * Funcion que inicializa el formulario sin datos
   */
  initialForm() {
    this.formOperation = this.fb.group({
      numOperation: ['', Validators.required],
    });
    this.formDate = this.fb.group({
      dateStart: [''],
      dateEnd: [''],
      entity: [''],
      provider: [''],
      category: [''],
      idService: [''],
      numDoc: [''],
      supply: [''],
      status: [''],
    });
  }

  /**
   * Funcion que carga los servicios segun la categoria
   * @returns No retorna ningún valor, actualiza variables filteredServices y allItems1
   */
  selectCategory() {
    if (this.category == undefined || this.category == '') { //Verifica si los campos del formulario estan vacios y no retorna nada
      this.selectedCategory = false;
      this.filteredServices = [];
      return;
    }
    this.selectedCategory = true; //
    this.loadAllServices().subscribe(allItems => { //actualiza las variables que cargan los servicios
      this.spinner.spinnerOnOff();
      this.filteredServices = allItems;
      this.allItems1 = allItems;
      this.spinner.spinnerOnOff();
    });
  }

  /**
   * Obtiene las transacciones según los filtros aplicados y las asigna a `dataTransaction`.
   *
   * @param {*} pageSize - (Opcional) Tamaño de página para la paginación de resultados.
   * 
   * @returns  No retorna un valor directamente. Actualiza propiedades internas:
   *   - `dataTransaction`
   *   - `pageKey`
   *   - `count`
   *   - `amountTransaction`
   *   - `functionDataCurrent`
   *
   */
  getDataTransaction(pageSize?: any) {
    this.spinner.spinnerOnOff();
    this.resetUser(this.getDataTransaction)
    let entity = this.entity || undefined;
    let provider = this.provider || undefined;
    let status = this.status || undefined;
    let idServ = this.idService || undefined;
    let supply = this.supply || undefined;
    let numDoc = this.numDoc || undefined;
    let dateStart = this.dateService.formatStartDate(this.dateStart).replace(/\//g, '') || undefined;
    let dateEnd = this.dateService.formatEndDate(this.dateEnd).replace(/\//g, '') || undefined

    // return
    this.transactionService.getTransaction(entity, provider, status, dateStart, dateEnd, idServ?.toString(), pageSize, this.page, numDoc, supply, this.count, this.amountTransaction).subscribe({
      next: (value: any) => {
        if (value.statusCode === 201) {
          this.amountTransaction = 0;
          this.mytoastr.showWarning(value.data.messages || 'No se encontraron transacciones', '');
          return
        }

        // Actualizar client con nameAlias
        const updatedItems = value.data.Items.map((item: any) => {
          const person = this.entityTypes.find((p: any) => p.servicePerson.idPerson === item.client);
          const provider = this.listProviders.find((p: any) => p.servicePerson.idPerson === item.provider);


          return {
            ...item,
            client: person ? person.servicePerson.nameAlias : item.client, // Asignar el nombre
            provider: provider ? provider.servicePerson.nameAlias : item.provider, // Asignar el nombre
          };
        });

        this.dataTransaction = [...this.dataTransaction, ...updatedItems];
        this.pageKey = value.data.hasMore;
        if (value.data.count != 0) this.count = value.data.count;
        if (value.data.totalAmount != 0) this.amountTransaction = Number.parseFloat(value.data.totalAmount).toFixed(2);
      },
      error: (error: any) => {
        console.error('ERROR', error);
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

  /**
   * Restablece el estado de las transacciones.
   *
   * @returns No retorna ningún valor, solo reinicia las propiedades internas.
   *
   */
  clearData() {
    this.pageKey = undefined; //Reinicia los valores de paginación (`pageKey`, `page`).
    this.dataTransaction = []; //Limpia la lista de transacciones (`dataTransaction`).
    this.count = -1; //Resetea los contadores (`count`, `amountTransaction`) a -1.
    this.page = 1;
    this.amountTransaction = -1;
  }

  /**
   * Recarga la información de transacciones.
   *
   * @returns No retorna ningún valor, solo actualiza el estado del componente.
   *
   */
  reload() {
    this.clearData(); // Limpia los datos actuales mediante
    this.dynamic.clearSelection();
    this.functionDataCurrent(this.pageSize);
  }

  clearSelectionOnly() {
    this.dataTransaction = [];
  }


  lastPageEvent!: PageEvent;

  onPageChange(event: PageEvent) {
    this.lastPageEvent = event;
    this.pageSize = this.pagUtils?.updatePageSize(event.pageSize, this.pageSize);
    this.page++;
    this.pagUtils?.onPageChange(event, this.pageSize, this.functionDataCurrent.bind(this), this.pageKey);
  }

  dataDialog: any;

  selectedHandle(event: any) {
    this.dataDialog = event[0]
    console.log()
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(DialogTransactionStatusComponent, {
      width: '600px',
      data: {
        concep: this.dataDialog.concep,
        statusTrans: this.dataDialog.status,
        id: this.dataDialog.id_transaction,
        sk: this.dataDialog.sk,
        masterStatus: this.masterStatus,
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      console.log(this.lastPageEvent)
      this.clearSelectionOnly();
      this.getDataTransaction();
      this.dynamic.clearSelection();
    });

  }

  handleSelectedIds(selectedIds: any[]) {
    this.disabledEditOption = selectedIds.length !== 1;
  }

  /**
  * Realiza la búsqueda de transacciones en base a los filtros del formulario.
  * 
  * @returns No retorna ningún valor. Solo actualiza el estado del componente y muestra resultados.
  *
  */
  search() {
    if (this.formDate.get('dateEnd')?.value == '' &&
      this.formDate.get('status')?.value == '' &&
      this.formDate.get('numDoc')?.value == '' &&
      this.formDate.get('supply')?.value == '' &&
      this.formDate.get('idService')?.value == '' &&
      this.formDate.get('entity')?.value == '' &&
      this.formDate.get('provider')?.value == '') {
      this.mytoastr.showWarning("Seleccione un filtro", "")
      return
    }
    this.clearData();
    this.getDataTransaction(this.pageSize)
  }


  async listData(): Promise<void> {
    this.spinner.spinnerOnOff();
    return new Promise((resolve, reject) => {
      forkJoin([
        this.masterService.getItemsMasterTable('16'),
        this.personService.getPerson('RECAUDADORA DE SERVICIOS'),
        this.masterService.getItemsMasterTable('14'),
        this.personService.getPerson('PROVEEDOR'),
      ]).subscribe({
        next: (response) => {
          const [masterStatus, entity, category, providers] = response;
          this.masterStatus = masterStatus.sort((a: any, b: any) => a.master_order - b.master_order);
          this.entityTypes = entity.data;
          this.categoryTypes = category;
          this.listProviders = providers.data;

          this.spinner.spinnerOnOff();
          resolve(); //  Indica que terminó exitosamente
        },
        error: (error) => {
          this.spinner.spinnerOnOff();
          console.error("Error loading master table data:", error);
          reject(error); // Indica que falló
        }
      });
    });
  }

  /**
   * Carga todos los servicios habilitados de la categoría seleccionada de forma paginada.
   *
   * @returns Observable que emite progresivamente el arreglo acumulado de todos los servicios habilitados.
   *
   */
  loadAllServices() {  //revisar para que traiga los 2000
    return this.serviceServ.getServicesPageKey(this.category, 'HABILITADO').pipe(
      expand(response =>
        response?.data?.nextPageKey
          ? this.serviceServ.getServicesPageKey(this.category, 'HABILITADO', response.data.nextPageKey)
          : of(null) // Detiene la recursión si no hay más páginas
      ),
      filter(response => response !== null),
      scan((acc, response) => acc.concat(response.data.Items), []),
      startWith([]), // Asegura que siempre haya una emisión inicial
    );
  }

  /**
   * Limpia los filtros de búsqueda y recarga las transacciones.
   *
   * @returns  No retorna ningún valor. Actualiza el formulario y la tabla de transacciones.
   *
   */
  clearSearch() {
    this.formDate.get('dateEnd')?.setValue('')
    this.formDate.get('dateStart')?.setValue('')
    this.formDate.get('status')?.setValue('')
    this.formDate.get('category')?.setValue('')
    this.formDate.get('entity')?.setValue('')
    this.formDate.get('provider')?.setValue('')
    this.formDate.get('idService')?.setValue('')
    this.formDate.get('numDoc')?.setValue('')
    this.formDate.get('supply')?.setValue('')
    //limpiar tabla de transacciones
    this.clearData();
    this.getDataTransaction(this.pageSize)
  }

  /**
   * Filtra la lista de servicios por nombre en base al valor de `serviceFilter`.
   */
  filterServices() {
    const value = this.serviceFilter?.toLowerCase() || '';
    this.filteredServices = this.allItems1.filter(service =>
      service.name.toLowerCase().includes(value)
    );
  }

  get dateStart() {
    return this.formDate?.get('dateStart')?.value;
  }

  get numDoc() {
    return this.formDate?.get('numDoc')?.value;
  }

  get supply() {
    return this.formDate?.get('supply')?.value;
  }

  get dateEnd() {
    return this.formDate?.get('dateEnd')?.value;
  }

  get status() {
    return this.formDate?.get('status')?.value;
  }

  get entity() {
    return this.formDate?.get('entity')?.value;
  }
  get provider() {
    return this.formDate?.get('provider')?.value;
  }

  get idService(): any[] {
    return this.formDate?.get('idService')?.value;
  }

  get category() {
    return this.formDate?.get('category')?.value;
  }

  exportDataViaAPI(fileType: 'xlsx' | 'csv'): void {
    console.log('exportDataViaAPI called with', fileType);
    this.spinner.spinnerOnOff();

    // Preparar los filtros para la exportación
    const exportFilters: Record<string, any> = {
      idclient: this.entity,
      idprovider: this.provider,
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
        } else {
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
}
