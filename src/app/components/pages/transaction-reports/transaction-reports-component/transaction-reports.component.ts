import { TransactionService } from '../../../../services/transaction.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { DynamicTableComponent } from '../../../library/dynamic-table/dynamic-table.component';
import { PaginationUtils } from 'src/app/utilities/pagination-utils';
import { PageEvent } from '@angular/material/paginator';
import { SpinnerService } from 'src/app/services/spinner.service';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MytoastrService } from 'src/app/services/mytoastr';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { MasterService } from 'src/app/services/master.service';
import { PersonService } from 'src/app/services/person.service';
import { DateService } from 'src/app/services/date.service';
import { ServicesService } from 'src/app/services/services.service';
import { expand, filter, EMPTY, scan, startWith, lastValueFrom, finalize, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction-reports.component.html',
  styleUrls: ['./transaction-reports.component.scss']
})
export class TransactionReportsComponent implements OnInit {

  private readonly pagUtils: PaginationUtils | undefined;

  public columns: any[] = [
    { name: 'Recaudador', attribute: 'client' },
    { name: 'Proveedor', attribute: 'provider' },
    { name: 'Servicio', attribute: 'service' },
    { name: 'Monto', attribute: 'amountTransaction' },
    { name: 'Num Operaciones', attribute: 'numOperations' },
  ];

  public type: string = ''; // se setea según la ruta

  public dataTransaction: any[] = [];

  public pageSize: any = 5;
  public pageKey: any;
  public disabledEditOption: any;
  public functionDataCurrent!: ((pageSize: any) => any);
  public formDate!: FormGroup<any>;
  public transaction: any;
  public respSearch: any;
  public entityTypes: any[] = [];
  public count: any = -1;
  public bodyexport: any;
  public page: any = 1;
  public amountTransaction: any = -1;
  public filteredServices: ServiceItem[] = [];
  public allItems1: ServiceItem[] = [];
  public allItems: any[] = [];
  public serviceFilter: string = '';
  public categoryTypes: any[] = [];
  public listProviders: any[] = [];
  public selectedCategory: boolean = false;
  public listServicesSelected: ServiceItem[] = [];
  public listServicesSelected1: ServiceItem[] = [];
  public listUndServicesElectrocentro: any[] = [];

  public lastFilters: any = {};

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
    private activeRouter: ActivatedRoute,
    public dialog: MatDialog,
  ) {
    this.pagUtils = new PaginationUtils();
  }

  ngOnInit(): void {
    // Cuando cambia :type, limpiar todo y recargar (Si no al compartir componente no actualiza hasta recargar)
    this.activeRouter.params.subscribe(params => {
      const rawType = params['type'];
      this.type = rawType === 'provider' ? 'Proveedores' : 'Recaudadores';

      // limpiar filtros, tabla, columnas
      this.clearData();
      this.clearFilter();
      this.resetColumnsBase();

      this.initialForm();
      this.initializeAsyncCore();
    });
  }

  private async initializeAsyncCore(): Promise<void> {
    try {
      await this.listData();
      this.functionDataCurrent = this.getDataTransaction.bind(this);
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
    }
  }

  initialForm() {
    this.formDate = this.fb.group({
      dateStart: [''],
      dateEnd: [''],
      entity: [''],
      provider: [''],
      category: [''],
      idService: [''],
      und_service: [{ value: '', disabled: true }],
    });
  }

  get servicesNames(): string {
    return this.listServicesSelected.map(s => s.name).join(', ');
  }

  onServicesChange(event: any) {
    const selectedIds: string[] = event.value;
    const idsCategoriaActual = new Set(this.allItems1.map(s => s.id));

    const selectedObjects = this.allItems1
      .filter(s => selectedIds.includes(s.id))
      .map(s => ({ id: s.id, name: s.name }));

    const filteredPrev = this.listServicesSelected.filter(
      item => !idsCategoriaActual.has(item.id)
    );

    this.listServicesSelected = [...filteredPrev, ...selectedObjects].filter(
      (item, index, self) => index === self.findIndex(t => t.id === item.id)
    );

    console.log("this.listServicesSelected:", this.listServicesSelected);


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
      console.error('❌ Error al cargar servicios:', error);
      this.filteredServices = [];
      this.mytoastr.showError('', 'No tiene Servicios');
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

  private resetColumnsBase() {
    this.columns = [
      { name: 'Recaudador', attribute: 'client' },
      { name: 'Proveedor', attribute: 'provider' },
      { name: 'Servicio', attribute: 'service' },
      { name: 'Negocio', attribute: 'und_serv' },
      { name: 'Monto', attribute: 'amountTransaction' },
      { name: 'Num Operaciones', attribute: 'numOperations' },
    ];
  }

  private applyCommissionColumn() {
    let cols = [
      { name: 'Proveedor', attribute: 'provider' },
      { name: 'Servicio', attribute: 'service' },
      { name: 'Negocio', attribute: 'und_serv' },
      { name: 'Monto', attribute: 'amountTransaction' },
      { name: 'Num Operaciones', attribute: 'numOperations' },
    ];

    if (this.type === 'Recaudadores') {
      cols = [
        { name: 'Recaudador', attribute: 'client' },
        ...cols,
        { name: 'Comision Cliente', attribute: 'comision_rec' },
      ];
    } else if (this.type === 'Proveedores') {
      cols = [
        ...cols,
        { name: 'Comision Proveedor', attribute: 'comision_prov' },
      ];
    }

    this.columns = cols;
  }

  getDataTransaction(pageSize?: any) {
    if (!this.dateStart || !this.dateEnd) {
      this.mytoastr.showError("", "Selecciona un margen de Fechas")
      return
    }

    this.spinner.spinnerOnOff();
    this.resetUser(this.getDataTransaction);

    const filters = {
      idclient: this.entity || undefined,
      typeEntity: this.type === 'Proveedores' ? 'provider' : 'client',
      idprovider: this.provider || undefined,
      dateStart: this.dateService.formatStartDate(this.dateStart).replace(/\//g, '') || undefined,
      dateEnd: this.dateService.formatEndDate(this.dateEnd).replace(/\//g, '') || undefined,
      ...(this.listServicesSelected.length > 0 && {
        idService: this.listServicesSelected.map(s => s.id)
      }),
      idundServ: this.id_und_service
    }

    this.lastFilters = filters;
    this.applyCommissionColumn();

    this.transactionService
      .getTransactionReports(filters, pageSize, this.page, this.count, this.amountTransaction)
      .subscribe({
        next: (value: any) => {
          if (value.error === 'Unauthorized: Invalid or expired token.') {
            this.mytoastr.showWarning('Vuelve a iniciar Sesion', '');
          }
          if (value.statusCode === 201 || value.data.type === 'ERROR') {
            this.amountTransaction = 0;
            if (value.statusCode === 201) {
              this.mytoastr.showWarning(value.data.messages || 'No se encontraron transacciones', '');
            }
            if (value.data.type === 'ERROR') {
              this.mytoastr.showError('Ha ocurrido un error ', '');
            }
            return;
          }

          const updatedItems = value.data.Items.map((item: any) => {
            const person = this.entityTypes
              .find((p: any) => p.servicePerson.idPerson === item.client);
            const provider = this.listProviders
              .find((p: any) => p.servicePerson.idPerson === item.provider);
            const undServi = this.listUndServicesElectrocentro?.find((und: any) => String(und.id) === String(item.und_serv));

            return {
              ...item,
              und_serv: undServi ? undServi.name : item.und_serv,
              client: person ? person.servicePerson.nameAlias : item.client,
              provider: provider ? provider.servicePerson.nameAlias : item.provider,
            };
          });

          this.dataTransaction = [...this.dataTransaction, ...updatedItems];
          this.pageKey = value.data.hasMore;
          if (value.data.count != 0) {
            this.count = value.data.count;
          }
          if (value.data.totalAmount != 0) {
            this.amountTransaction = Number.parseFloat(value.data.totalAmount).toFixed(2);
          }
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
    );
  }

  clearData() {
    this.pageKey = undefined;
    this.dataTransaction = [];
    this.count = -1;
    this.page = 1;
    this.amountTransaction = -1;
    this.allItems = [];
  }

  clearFilter() {
    this.serviceFilter = '';
    this.filteredServices = [];
    this.selectedCategory = false;
    this.listServicesSelected = [];
    this.listServicesSelected1 = [];
    if (this.formDate) {
      this.formDate.reset();
      this.formDate.get('und_service')?.disable();
    }
  }

  reload() {
    this.clearData();
    this.dynamic.clearSelection();
    if (this.dateStart || this.dateEnd) {
      this.functionDataCurrent(this.pageSize);
    }
  }

  lastPageEvent!: PageEvent;

  onPageChange(event: PageEvent) {
    this.lastPageEvent = event;
    this.pageSize = this.pagUtils?.updatePageSize(event.pageSize, this.pageSize);
    this.page++;
    this.pagUtils?.onPageChange(event, this.pageSize, this.functionDataCurrent.bind(this), this.pageKey);
  }

  private isEmptyForm(): boolean {
    const fields = ['dateEnd', 'idService', 'entity', 'provider'];
    return fields.every(field => this.formDate.get(field)?.value === '');
  }

  search() {
    if (this.isEmptyForm()) {
      this.mytoastr.showWarning('Seleccione un filtro', '');
      return;
    }
    this.clearData();
    this.getDataTransaction(this.pageSize);
  }

  async listData(): Promise<void> {
    this.spinner.spinnerOnOff();
    return new Promise((resolve, reject) => {
      forkJoin([
        this.personService.getPersonsPandR(),
        this.masterService.getItemsMasterTable('14'),
      ]).subscribe({
        next: (response) => {
          const [persons, category] = response;
          this.listProviders = persons.data.providerTransform;
          this.entityTypes = persons.data.recaudadorTransform;

          this.categoryTypes = category;

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

          this.spinner.spinnerOnOff();
          resolve();
        },
        error: (error) => {
          this.spinner.spinnerOnOff();
          console.error('Error loading master table data:', error);
          reject(new Error(error));
        }
      });
    });
  }

  loadAllServices() {
    return this.serviceServ.getServicesPageKey(this.category, 'HABILITADO').pipe(
      expand(response =>
        response?.data?.nextPageKey
          ? this.serviceServ.getServicesPageKey(this.category, 'HABILITADO', response.data.nextPageKey)
          : EMPTY
      ),
      map(response => response?.data?.Items ?? []),
      scan((acc, items) => acc.concat(items), []),
      startWith([])
    );
  }

  clearSearch() {
    if (this.formDate) {
      this.formDate.reset();
    }
    this.clearData();
    this.clearFilter();
  }

  filterServices() {
    const value = this.serviceFilter?.toLowerCase() || '';
    this.filteredServices = this.allItems1.filter(service =>
      service.name.toLowerCase().includes(value)
    );
    this.spinner.spinnerOnOff;
  }

  get dateStart() {
    return this.formDate?.get('dateStart')?.value;
  }

  get dateEnd() {
    return this.formDate?.get('dateEnd')?.value;
  }

  get id_und_service() {
    return this.formDate?.get('und_service')?.value;
  }

  get entity() {
    return this.formDate?.get('entity')?.value;
  }

  get provider() {
    return this.formDate?.get('provider')?.value;
  }

  get idService(): any[] {
    return this.listServicesSelected;
  }

  get category() {
    return this.formDate?.get('category')?.value;
  }

  showAlarmSelectCategory() {
    if (this.category == undefined || this.category == '') {
      this.mytoastr.showError('Selecciona una Categoria Primero', '');
    }
  }

  exportDataViaAPI(fileType: 'xlsx' | 'csv'): void {
    console.log('exportDataViaAPI called with', fileType);

    if (!this.dateStart || !this.dateEnd) {
      this.mytoastr.showError("", "Selecciona un margen de Fechas")
      return
    }

    this.spinner.spinnerOnOff();

    const exportFilters: Record<string, any> = {
      typeEntity: this.type === 'Proveedores' ? 'provider' : 'client',
      dateStart: this.dateStart
        ? `${this.dateService.formatTrayDate(this.dateStart).replace(/\//g, '-')} 00:00:00`
        : undefined,
      dateEnd: this.dateEnd
        ? `${this.dateService.formatTrayDate(this.dateEnd).replace(/\//g, '-')} 23:59:59`
        : undefined,
      idprovider: this.provider || undefined,
      idclient: this.entity || undefined,
      ...(this.listServicesSelected.length > 0 && {
        idService: this.listServicesSelected.map(s => s.id)
      })
    };
    Object.keys(exportFilters).forEach(key => {
      if (exportFilters[key] === undefined) {
        delete exportFilters[key];
      }
    });
    const inbx = this.type === 'Proveedores' ? 'rp_prv' : 'rp_rec';
    const token = localStorage.getItem('fcmToken') ?? '';
    this.transactionService.exportTransactions(fileType, exportFilters, inbx, token).subscribe({
      next: (response) => {
        this.spinner.spinnerOnOff();
        if (response.statusCode === 200) {
          this.mytoastr.showWarningTime('', 'Procesando Archivo...', 1000);
        } else {
          this.mytoastr.showError('', 'Error al enviar la solicitud');
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
