import { TransactionService } from '../../../../services/transaction.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { DynamicTableComponent } from '../../../library/dynamic-table/dynamic-table.component';
import { PaginationUtils } from 'src/app/utilities/pagination-utils';
import { PageEvent } from '@angular/material/paginator';
import { SpinnerService } from 'src/app/services/spinner.service';
import { DialogTransactionStatusComponent } from 'src/app/dialogs/dialog-transaction-status/dialog-transaction-status.component';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MytoastrService } from 'src/app/services/mytoastr';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { MasterService } from 'src/app/services/master.service';
import { PersonService } from 'src/app/services/person.service';
import { DateService } from 'src/app/services/date.service';
import { ServicesService } from 'src/app/services/services.service';
import { expand, filter, of, scan, startWith, lastValueFrom, tap } from 'rxjs';

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.component.html',
  styleUrls: ['./transaction.component.scss']
})

export class TransactionComponent implements OnInit {

  private readonly pagUtils: PaginationUtils | undefined;

  public columns: any[] = [
    { 'name': 'Recaudador', 'attribute': 'client' },
    { 'name': 'Proveedor', 'attribute': 'provider' },
    { 'name': 'Servicio', 'attribute': 'service' },
    { 'name': 'Negocio', 'attribute': 'und_serv' },
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
    { 'name': 'Est. Conciliacion', 'attribute': 'statusConc' },
    {
      'name': 'Est. Transaccion',
      'attribute': 'status',
      'config': { 'renderIcon': true, 'icon': 'iconStatus', 'coloricon': 'colorStatus' }
    },
  ];

  public dataTransaction: any[] = [];

  public pageSize: any = 5;
  public pageKey: any;
  public disabledEditOption: any
  public functionDataCurrent!: ((pageSize: any) => any);
  public formOperation!: FormGroup<any>;
  public formDate!: FormGroup<any>;
  public transaction: any;
  public respSearch: any;
  public masterStatus: any;
  public masterStatusConc: any;
  public entityTypes: any[] = [];
  public count: any = -1;
  public bodyexport: any;
  public page: any = 1;
  public amountTransaction: any = -1;
  public filteredServices: any[] = []; // Lista filtrada que se mostrará
  public allItems1: any[] = []; // Lista filtrada que se mostrará
  public allItems: any[] = [];
  public serviceFilter: string = '';
  public categoryTypes: any[] = [];
  public listProviders: any[] = [];
  public selectedCategory: boolean = false;
  public listServicesSelected: any[] = [];
  public listServicesSelected1: any[] = [];
  public listUndServicesElectrocentro: any[] = [];
  public select_electrocentro: any = false;

  @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;

  constructor(
    private readonly spinner: SpinnerService,
    private readonly transactionService: TransactionService,
    private readonly fb: FormBuilder,
    private readonly mytoastr: MytoastrService,
    private readonly masterService: MasterService,
    private readonly personService: PersonService,
    private readonly dateService: DateService,
    private readonly serviceServ: ServicesService,
    public dialog: MatDialog,) {
    this.pagUtils = new PaginationUtils();
  }

  ngOnInit(): void {
    this.initializeAsync();
  }
  private async initializeAsync(): Promise<void> {

    this.initialForm();
    try {
      await this.listData(); // Espera a que listData termine
      this.functionDataCurrent = this.getDataTransaction.bind(this);
      this.functionDataCurrent(this.pageSize);
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
      statusConc: [''],
      numDoc: [''],
      supply: [''],
      status: [''],
      und_service: [''],
    });
  }
  
  get servicesNames(): string {
    return this.listServicesSelected.map(s => s.name).join(', ');
  }

  onServicesChange(event: any) {
    const selectedIds = event.value; // array con todos los seleccionados del select actual
    const idsCategoriaActual = this.allItems1.map(s => s.id);

    // Convertir a objetos {id, name} los seleccionados actuales
    const selectedObjects = this.allItems1
      .filter(s => selectedIds.includes(s.id))
      .map(s => ({ id: s.id, name: s.name }));

    // Mantener los seleccionados de otras categorías
    const filteredPrev = this.listServicesSelected.filter(
      (item: any) => !idsCategoriaActual.includes(item.id)
    );

    // Actualizar lista con los objetos {id, name}
    this.listServicesSelected = [
      ...filteredPrev,
      ...selectedObjects
    ];

    // Eliminar duplicados por id
    this.listServicesSelected = this.listServicesSelected.filter(
      (item, index, self) =>
        index === self.findIndex(t => t.id === item.id)
    );

    // Mantener sincronizado el formControl con todos los IDs seleccionados
    this.formDate.get('idService')?.setValue(this.listServicesSelected.map(s => s.id));

    if (this.listServicesSelected.some(s => s.id === 'SAC0000011')) {
      this.select_electrocentro = true;
    } else {
      this.formDate.get('und_service')?.setValue('');
      this.select_electrocentro = false;
    }

    console.log('Servicios seleccionados acumulados:', this.listServicesSelected);
  }

  cargarServicios(): Promise<any> {
    const response = lastValueFrom(this.loadAllServices().pipe(
      tap((allItems: any) => {
        this.spinner.spinnerOnOff();
        this.filteredServices = allItems;
        this.allItems1 = allItems;
        this.serviceFilter = '';
        this.filterServices();
        this.serviceFilter = '';
      })
    ));
    return response;
  }

  async selectCategory() {
    if (!this.category) {
      this.selectedCategory = false;
      this.filteredServices = [];
      return;
    }
    this.selectedCategory = true;
    await this.cargarServicios();
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
    console.log("Servicios seleccionados para filtro:", this.listServicesSelected);
    console.log("Servicios seleccionados para filtro1:", this.idService);
    this.spinner.spinnerOnOff();
    this.resetUser(this.getDataTransaction)
    const entity = this.entity || undefined;
    const provider = this.provider || undefined;
    const status = this.status || undefined;
    const idServ = this.listServicesSelected.map(s => s.id) || undefined;
    const idUndServ = this.id_und_service || undefined;
    const supply = this.supply || undefined;
    const numDoc = this.numDoc || undefined;
    const dateStart = this.dateService.formatStartDate(this.dateStart).replace(/\//g, '') || undefined;
    const dateEnd = this.dateService.formatEndDate(this.dateEnd).replace(/\//g, '') || undefined

    // return
    const listfilters = {
      idclient: entity, idprovider: provider, status, dateStart, dateEnd, idService: idServ, numDoc, supply, idundServ: idUndServ
    }
    this.transactionService.getTransaction(listfilters, pageSize, this.page, this.count, this.amountTransaction).subscribe({
      next: (value: any) => {
        if (value.error === "Unauthorized: Invalid or expired token.") {
          this.mytoastr.showWarning('Vuelve a iniciar Sesion', '');
        }
        if (value.statusCode === 201) {
          this.amountTransaction = 0;
          this.mytoastr.showWarning(value.data.messages || 'No se encontraron transacciones', '');
          return
        }

        // Actualizar client con nameAlias
        const updatedItems = value.data.Items.map((item: any) => {
          const undServi = this.listUndServicesElectrocentro?.find((und: any) => String(und.id) === String(item.und_serv));
          const person = this.entityTypes.find((p: any) => p.servicePerson.idPerson === item.client);
          const provider = this.listProviders.find((p: any) => p.servicePerson.idPerson === item.provider);
          return {
            ...item,
            und_serv: undServi ? undServi.name : item.und_serv,
            client: person ? person.servicePerson.nameAlias : item.client, // Asignar el nombre
            provider: provider ? provider.servicePerson.nameAlias : item.provider, // Asignar el nombre
          };
        });

        this.dataTransaction = [...this.dataTransaction, ...updatedItems];
        this.pageKey = value.data.hasMore;
        if (value.data.count != 0) {
          this.count = value.data.count
        };
        if (value.data.totalAmount != 0) {
          this.amountTransaction = Number.parseFloat(value.data.totalAmount).toFixed(2)
        };
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
    this.allItems = [];
  }
  clearFilter() {
    this.serviceFilter = '';
    this.filteredServices = [];
    this.selectedCategory = false;
    this.listServicesSelected = [];
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
      console.log('The dialog was closed', result);
      if (result === true) {
        this.reload();
      }

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
  private isEmptyForm(): boolean {
    const fields = ['dateEnd', 'status', 'numDoc', 'supply', 'idService', 'entity', 'provider'];
    return fields.every(field => this.formDate.get(field)?.value === '');
  }

  search() {
    if (this.isEmptyForm()) {
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
        this.masterService.getItemsMasterTable('17'),
        this.masterService.getItemsMasterTable('16'),
        this.personService.getPersonsPandR(),
        this.masterService.getItemsMasterTable('14'),
      ]).subscribe({
        next: (response) => {
          const [masterStatusConc, masterStatus, persons, category] = response;
          this.listProviders = persons.data.providerTransform;
          this.entityTypes = persons.data.recaudadorTransform;
          console.log(persons)
          console.log(this.listProviders)
          console.log(this.entityTypes)
          const dluz = this.listProviders.find(
            (p: any) => p.servicePerson.idPerson === "31399400"
          );

          if (dluz && dluz.servicePerson.und_serv !== "N/A") {
            try {
              // Quitar los backslashes para que sea JSON válido
              const cleaned = dluz.servicePerson.und_serv.replace(/\\/g, "");

              // Ahora sí parsear
              this.listUndServicesElectrocentro = JSON.parse(cleaned);

              console.log("UND_SERV de DLUZ limpio:", this.listUndServicesElectrocentro);
            } catch (e) {
              console.error("Error al parsear und_serv de DLUZ:", e);
              this.listUndServicesElectrocentro = [];
            }
          } else {
            this.listUndServicesElectrocentro = [];
          }
          this.masterStatusConc = ["Completado", "Pendiente", "En Disputa"];
          this.masterStatus = masterStatus.sort((a: any, b: any) => a.master_order - b.master_order);
          this.categoryTypes = category;
          this.spinner.spinnerOnOff();
          resolve(); //  Indica que terminó exitosamente
        },
        error: (error) => {
          this.spinner.spinnerOnOff();
          console.error("Error loading master table data:", error);
          reject(new Error(error)); // Indica que falló
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
  loadAllServices() {
    //revisar para que traiga los 2000
    const response$ = this.serviceServ.getServicesPageKey(this.category, 'HABILITADO').pipe(
      expand(response =>
        response?.data?.nextPageKey
          ? this.serviceServ.getServicesPageKey(this.category, 'HABILITADO', response.data.nextPageKey)
          : of(null) // ✅ Detiene la recursión cuando no hay más páginas
      ),
      filter(response => response !== null), // ✅ Ignora la emisión final null
      scan((acc, response) => acc.concat(response.data.Items), []), // ✅ Acumula los resultados
      startWith([]) // ✅ Emite un valor inicial vacío
    );

    response$.subscribe({
      next: data => console.log('Servicios acumulados:', data),
      error: err => console.error('Error:', err)
    });
    return response$
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
    this.clearFilter();
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
    console.log("servicioooooos")
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

  get id_und_service() {
    return this.formDate?.get('und_service')?.value;
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
    return this.listServicesSelected
  }

  get category() {
    return this.formDate?.get('category')?.value;
  }

  showAlarmSelectCategory() {
    if (this.category == undefined || this.category == '') {
      this.mytoastr.showError('Selecciona una Categoria Primero', '');
    }
  }

  formatCustomDate(dateString: string): string {
    const date = new Date(dateString);
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const HH = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
  }

  exportDataViaAPI(fileType: 'xlsx' | 'csv'): void {
    console.log('exportDataViaAPI called with', fileType);
    this.spinner.spinnerOnOff();

    // Preparar los filtros para la exportación
    const exportFilters: Record<string, any> = {
      dateStart: this.dateStart
        ? `${this.dateService.formatTrayDate(this.dateStart).replace(/\//g, '-')} 00:00:00`
        : undefined,
      dateEnd: this.dateEnd
        ? `${this.dateService.formatTrayDate(this.dateEnd).replace(/\//g, '-')} 23:59:59`
        : undefined,
      idService: this.listServicesSelected.map(s => s.id) || undefined,
      status: this.status || undefined,
      idprovider: this.provider || undefined,
      idclient: this.entity || undefined,
      concept: this.numDoc || undefined,
      supply: this.supply || undefined
    };

    // Eliminar propiedades undefined
    Object.keys(exportFilters).forEach(key => {
      if (exportFilters[key] === undefined) {
        delete exportFilters[key];
      }
    });
    const inbx = 'tr';
    const token = localStorage.getItem('fcmToken');
    this.transactionService.exportTransactions(fileType, exportFilters, inbx, token).subscribe({
      next: (response) => {
        this.spinner.spinnerOnOff();
        if (response.statusCode === 200) {
          this.mytoastr.showWarningTime('', 'Procesando Archivo...', 1000);
        } else {
          this.mytoastr.showError('', 'Error al enviar la solicitud')
        }
      },
      error: (error) => {
        this.spinner.spinnerOnOff();
        console.error('Error durante la exportación:', error);
        this.mytoastr.showError('Error durante la exportación', '');
      }
    });
  }
}
