/**
 * File: transaction.component.ts
 * Description: Componente Angular para gestionar y mostrar transacciones del sistema.
 *              Permite:
 *                - Visualizar transacciones con DynamicTableComponent.
 *                - Aplicar filtros por fecha, categoría, proveedor, cliente, estados, servicios, num de recibo y num de suministro.
 *                - Paginación con Angular Material Paginator.
 *                - Exportación de datos en formatos XLSX o CSV.
 *                - Abrir dialog de estado de transacción.
 * Maintenance:
 *  - Last modified: 30-Ene-2026
 */

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
import { expand, filter, EMPTY, scan, startWith, lastValueFrom, finalize, map } from 'rxjs';
import { environment } from 'src/environments/environment';
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
      'config': { 'renderIcon': true }
    },
    {
      'name': 'Accion',
      'attribute': '',
      'config': {
        'type': 'buttonicons',
        'actions': [
          {
            bgClass: 'yellow',
            toolTip: 'Editar',
            icon: 'edit',
            value: 'edit'
          },
        ]
      }
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
  public filteredServices: ServiceItem[] = []; // Lista filtrada que se mostrará
  public allItems1: ServiceItem[] = []; // Lista filtrada que se mostrará
  public allItems: any[] = [];
  public serviceFilter: string = '';
  public categoryTypes: any[] = [];
  public listProviders: any[] = [];
  public selectedCategory: boolean = false;
  public listServicesSelected: ServiceItem[] = [];
  public listServicesSelected1: ServiceItem[] = [];
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
      und_service: [{ value: '', disabled: true }],
    });
  }

  get servicesNames(): string {
    return this.listServicesSelected.map(s => s.name).join(', ');
  }


  clickButton(event: any) {
    console.log("event", event)
    const { value, element } = event
    if (value == "edit") {
      this.openDialog(element)
    }
  }
  onServicesChange(event: any) {
    const selectedIds: string[] = event.value;
    const idsCategoriaActual = new Set(this.allItems1.map(s => s.id));

    // Crear la lista de objetos seleccionados en esta categoría
    const selectedObjects = this.allItems1
      .filter(s => selectedIds.includes(s.id))
      .map(s => ({ id: s.id, name: s.name }));

    // Mantener los servicios seleccionados de otras categorías
    const filteredPrev = this.listServicesSelected.filter(
      item => !idsCategoriaActual.has(item.id)
    );

    // Unir y eliminar duplicados
    this.listServicesSelected = [...filteredPrev, ...selectedObjects].filter(
      (item, index, self) => index === self.findIndex(t => t.id === item.id)
    );

    // Actualizar el control 'idService' con los IDs seleccionados
    this.formDate.get('idService')?.setValue(this.listServicesSelected.map(s => s.id));

    // ✅ Verificar si el servicio Electrocentro fue seleccionado
    const isElectrocentro = this.listServicesSelected.some(s => s.id === 'SAC0000011');
    const undServiceControl = this.formDate.get('und_service');

    if (isElectrocentro) {
      undServiceControl?.enable();  // 🔹 Activar campo
    } else {
      undServiceControl?.reset();   // 🔹 Limpiar selección
      undServiceControl?.disable(); // 🔹 Desactivar campo
    }
  }


  async cargarServicios(): Promise<void> {
    try {
      this.spinner.spinnerOnOff();
      const allItems = await lastValueFrom(
        this.loadAllServices().pipe(
          filter((items: any) => items.length > 0),
          finalize(() => this.spinner.spinnerOnOff())
        )
      );
      this.filteredServices = allItems;
      this.allItems1 = allItems;
      this.serviceFilter = '';
      this.filterServices();
    } catch (error) {
      console.error("❌ Error al cargar servicios:", error);
      this.filteredServices = [];
      this.mytoastr.showError('', 'No tiene Servicios')
    }
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
    this.spinner.spinnerOnOff();
    this.resetUser(this.getDataTransaction)
    // return
    const filters = {
      idclient: this.entity || undefined,
      idprovider: this.provider || undefined,
      status: this.status || undefined,
      dateStart: this.dateService.formatStartDate(this.dateStart).replace(/\//g, '') || undefined,
      dateEnd: this.dateService.formatEndDate(this.dateEnd).replace(/\//g, '') || undefined,
      idundServ: this.id_und_service || undefined,
      statusConc: this.statusConc !== '-' ? this.statusConc : undefined,
      numDoc: this.numDoc || undefined,
      supply: this.supply || undefined,
      ...(this.listServicesSelected.length > 0 && {
        idService: this.listServicesSelected.map(s => s.id)
      })
    }
    this.transactionService.getTransaction(filters, pageSize, this.page, this.count, this.amountTransaction).subscribe({
      next: (value: any) => {
        if (value.error === "Unauthorized: Invalid or expired token.") {
          this.mytoastr.showWarning('Vuelve a iniciar Sesion', '');
        }
        if (value.statusCode === 201 || value.data.type === 'ERROR') {
          this.amountTransaction = 0;
          if (value.statusCode === 201) this.mytoastr.showWarning(value.data.messages || 'No se encontraron transacciones', '');
          if (value.data.type === 'ERROR') this.mytoastr.showError('Ha ocurrido un error ', '');
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

  openDialog(data: any): void {
    const dialogRef = this.dialog.open(DialogTransactionStatusComponent, {
      width: '600px',
      data: {
        concep: data.concep,
        statusTrans: data.status,
        id: data.id_transaction,
        sk: data.sk,
        masterStatus: this.masterStatus,
        masterStatusCons: this.masterStatusConc
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', result);
      if (result === true) {
        this.reload();
      }

    });
  }

  /**
  * Realiza la búsqueda de transacciones en base a los filtros del formulario.
  * 
  * @returns No retorna ningún valor. Solo actualiza el estado del componente y muestra resultados.
  *
  */
  private isEmptyForm(): boolean {
    const fields = ['dateEnd', 'status', 'numDoc', 'supply', 'idService', 'entity', 'provider', 'statusConc'];
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
        this.masterService.getItemsMasterTable('16'),
        this.personService.getPersonsPandR(),
        this.masterService.getItemsMasterTable('14'),
        this.masterService.getItemsMasterTable('17'),
      ]).subscribe({
        next: (response) => {
          const [masterStatus, persons, category, masterStatusCons] = response;
          this.listProviders = persons.data.providerTransform;
          this.entityTypes = persons.data.recaudadorTransform;
          const dluz = this.listProviders.find(
            (p: any) => p.servicePerson.idPerson === `${environment.ID_PERSON_DLUZ}`,
          );

          if (dluz && dluz.servicePerson.und_serv !== "N/A") {
            try {
              // Quitar los backslashes para que sea JSON válido
              const cleaned = dluz.servicePerson.und_serv.replace(/\\/g, "");

              // Ahora sí parsear
              this.listUndServicesElectrocentro = JSON.parse(cleaned);

            } catch (e) {
              console.error("Error al parsear und_serv de DLUZ:", e);
              this.listUndServicesElectrocentro = [];
            }
          } else {
            this.listUndServicesElectrocentro = [];
          }
          this.masterStatusConc = masterStatusCons.sort((a: any, b: any) => a.master_order - b.master_order);
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
    return this.serviceServ.getServicesPageKey(this.category, 'HABILITADO').pipe(
      expand(response =>
        response?.data?.nextPageKey
          ? this.serviceServ.getServicesPageKey(this.category, 'HABILITADO', response.data.nextPageKey)
          : EMPTY // ✅ Termina el flujo cuando no hay más páginas
      ),
      map(response => response?.data?.Items ?? []),
      scan((acc, items) => acc.concat(items), []),
      startWith([])
    );
  }


  /**
   * Limpia los filtros de búsqueda y recarga las transacciones.
   *
   * @returns  No retorna ningún valor. Actualiza el formulario y la tabla de transacciones.
   *
   */
  clearSearch() {
    this.formDate.get('dateEnd')?.setValue('');
    this.formDate.get('dateStart')?.setValue('');
    this.formDate.get('status')?.setValue('');
    this.formDate.get('category')?.setValue('');
    this.formDate.get('entity')?.setValue('');
    this.formDate.get('provider')?.setValue('');
    this.formDate.get('idService')?.setValue('');
    this.formDate.get('statusConc')?.setValue('-');
    this.formDate.get('numDoc')?.setValue('');
    this.formDate.get('supply')?.setValue('');
    this.formDate.get('und_service')?.setValue('');
    this.formDate.get('und_service')?.disable();
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
    this.spinner.spinnerOnOff
  }

  get dateStart() {
    return this.formDate?.get('dateStart')?.value;
  }

  get dateEnd() {
    return this.formDate?.get('dateEnd')?.value;
  }

  get numDoc() {
    return this.formDate?.get('numDoc')?.value;
  }

  get supply() {
    return this.formDate?.get('supply')?.value;
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

  get statusConc() {
    return this.formDate?.get('statusConc')?.value;
  }

  showAlarmSelectCategory() {
    if (this.category == undefined || this.category == '') {
      this.mytoastr.showError('Selecciona una Categoria Primero', '');
    }
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
      status: this.status || undefined,
      statusConc: this.statusConc !== '-' ? this.statusConc : undefined,
      idprovider: this.provider || undefined,
      idclient: this.entity || undefined,
      concept: this.numDoc || undefined,
      supply: this.supply || undefined,
      ...(this.listServicesSelected.length > 0 && {
        idService: this.listServicesSelected.map(s => s.id)
      })
    };
    // Eliminar propiedades undefined
    Object.keys(exportFilters).forEach(key => {
      if (exportFilters[key] === undefined) {
        delete exportFilters[key];
      }
    });
    const inbx = 'tr';
    const token = localStorage.getItem('fcmToken') ?? "";
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

interface ServiceItem {
  id: string;
  name: string;
}
