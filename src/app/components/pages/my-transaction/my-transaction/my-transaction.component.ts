import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { CookieService } from 'ngx-cookie-service';
import { EMPTY, expand, filter, finalize, forkJoin, lastValueFrom, map, scan, startWith } from 'rxjs';
import { DynamicTableComponent } from 'src/app/components/library/dynamic-table/dynamic-table.component';
import { DateService } from 'src/app/services/date.service';
import { MasterService } from 'src/app/services/master.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { PersonService } from 'src/app/services/person.service';
import { ServicesService } from 'src/app/services/services.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { TransactionService } from 'src/app/services/transaction.service';
import { PaginationUtils } from 'src/app/utilities/pagination-utils';

@Component({
  selector: 'app-my-transaction',
  templateUrl: './my-transaction.component.html',
  styleUrls: ['./my-transaction.component.scss']
})
export class MyTransactionComponent implements OnInit {

  private readonly pagUtils: PaginationUtils | undefined;
  public functionDataCurrent!: ((pageSize: any) => any);


  public columns: any[] = [
    { 'name': 'Titular', 'attribute': 'bill' },
    { 'name': 'Servicio', 'attribute': 'service' },
    { 'name': 'Negocio', 'attribute': 'und_serv' },
    { 'name': 'N° Suministro', 'attribute': 'supply' },
    { 'name': 'N° Recibo', 'attribute': 'concep' },
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

  public params: any = {};

  public typePersonMapping: Record<string, string> = {
    "PROVIDER": "idprovider",
    "RECAUDADOR": "idclient"
  };

  public formDate!: FormGroup<any>;


  public dataTransaction: any;
  public pageKey: string | number | undefined;
  public pageSize: any = 5;
  public page: any = 1;
  public personId: string = '';
  public personName: string = '';
  public typePerson: string = '';
  public masterStatus: any[] = [];
  public serviceName: any;
  public count: any
  public masterStatusConc: any;
  public selectedCategory: any;
  public categoryTypes: any;

  public serviceFilter: string = '';

  public filteredServices: ServiceItem[] = []; // Lista filtrada que se mostrará
  public allItems1: ServiceItem[] = []; // Lista filtrada que se mostrará
  public listServicesSelected: ServiceItem[] = [];
  public listServicesSelected1: ServiceItem[] = [];

  @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;


  constructor(
    private readonly transactionService: TransactionService,
    private readonly spinner: SpinnerService,
    private readonly mytoastr: MytoastrService,
    private readonly person: PersonService,
    private readonly cookie: CookieService,
    private readonly fb: FormBuilder,
    private readonly masterService: MasterService,
    private readonly personService: PersonService,
    private readonly dateService: DateService,
    private readonly serviceServ: ServicesService
  ) {
    this.pagUtils = new PaginationUtils();
  }

  ngOnInit(): void {
    this.personId = this.cookie.get('person_id')
    console.log("dataUser: ", this.personId)
    this.getPerson(this.personId)
    this.typePerson = this.cookie.get('prefix');
    this.initialForm();
    this.listData();
    this.functionDataCurrent = this.getDataIdTransaction.bind(this);
    this.functionDataCurrent(this.pageSize);
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
  loadAllServices() {
    return this.serviceServ.getServicesPageKey(this.category, 'HABILITADO', undefined, this.personId, this.typePerson).pipe(
      expand(response =>
        response?.data?.nextPageKey
          ? this.serviceServ.getServicesPageKey(this.category, 'HABILITADO', response.data.nextPageKey, this.personId, this.typePerson)
          : EMPTY // ✅ Termina el flujo cuando no hay más páginas
      ),
      map(response => response?.data?.Items ?? []),
      scan((acc, items) => acc.concat(items), []),
      startWith([])
    );
  }
  filterServices() {
    const value = this.serviceFilter?.toLowerCase() || '';
    this.filteredServices = this.allItems1.filter(service =>
      service.name.toLowerCase().includes(value)
    );
    this.spinner.spinnerOnOff
  }
  initialForm() {
    this.formDate = this.fb.group({
      dateStart: [''],
      dateEnd: [''],
      entity: [''],
      category: [''],
      idService: [''],
      numDoc: [''],
      status: [''],
      supply: [''],
      statusConc: ['']
    });
  }
  showAlarmSelectCategory() {
    if (this.category == undefined || this.category == '') {
      this.mytoastr.showError('Selecciona una Categoria Primero', '');
    }
  }

  getPerson(id: string) {
    this.spinner.spinnerOnOff();
    this.person.getIdPerson(id).subscribe({
      next: (value) => {
        this.typePerson = value.Items[0].PREFIX;
        this.personName = value.Items[0].NAME;
      },
      error: (error) => {
        console.log("error: ", error)
        this.spinner.spinnerOnOff();
      },
      complete: () => {
        this.spinner.spinnerOnOff();
      },
    })
  }
  getDataIdTransaction(pageSize?: any) {
    this.spinner.spinnerOnOff();
    this.resetUser(this.getDataIdTransaction)
    // return
    const key = this.typePersonMapping[this.typePerson];
    if (key) {
      this.params[key] = this.personId;
    }
    const filters = {
      idclient: this.params?.idclient,
      idprovider: this.params?.idprovider,
      status: this.status || undefined,
      dateStart: this.dateService.formatStartDate(this.dateStart).replace(/\//g, '') || undefined,
      dateEnd: this.dateService.formatEndDate(this.dateEnd).replace(/\//g, '') || undefined,
      idundServ: this.id_und_service || undefined,
      numDoc: this.numDoc || undefined,
      supply: this.supply || undefined,
      ...(this.listServicesSelected.length > 0 && {
        idService: this.listServicesSelected.map(s => s.id)
      })
    }
    this.transactionService.getTransaction(filters, pageSize, this.page, this.count).subscribe({
      next: (value: any) => {
        if (value.error === "Unauthorized: Invalid or expired token.") {
          this.mytoastr.showWarning('Vuelve a iniciar Sesion', '');
        }
        if (value.statusCode === 201 || value.data.type === 'ERROR') {
          if (value.statusCode === 201) this.mytoastr.showWarning(value.data.messages || 'No se encontraron transacciones', '');
          if (value.data.type === 'ERROR') this.mytoastr.showError('Ha ocurrido un error ', '');
          return
        }

        // Actualizar client con nameAlias
        const updatedItems = value.data.Items

        this.dataTransaction = [...this.dataTransaction, ...updatedItems];
        this.pageKey = value.data.hasMore;
        if (value.data.count != 0) {
          this.count = value.data.count
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

    this.functionDataCurrent = this.getDataIdTransaction
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

  lastPageEvent!: PageEvent;

  onPageChange(event: PageEvent) {
    this.lastPageEvent = event;
    this.pageSize = this.pagUtils?.updatePageSize(event.pageSize, this.pageSize);
    this.page++;
    this.pagUtils?.onPageChange(event, this.pageSize, this.functionDataCurrent.bind(this), this.pageKey);
  }

  clearSearch() {
    this.formDate.get('dateEnd')?.setValue('');
    this.formDate.get('dateStart')?.setValue('');
    this.formDate.get('status')?.setValue('');
    this.formDate.get('category')?.setValue('');
    this.formDate.get('idService')?.setValue('');
    this.formDate.get('numDoc')?.setValue('');
    this.formDate.get('supply')?.setValue('');
    this.formDate.get('und_service')?.setValue('');
    this.formDate.get('und_service')?.disable();
    //limpiar tabla de transacciones
    this.clearData();
    this.clearFilter();
    this.getDataIdTransaction(this.pageSize)
  }
  private isEmptyForm(): boolean {
    const fields = ['dateEnd', 'status', 'numDoc', 'supply', 'idService'];
    return fields.every(field => this.formDate.get(field)?.value === '');
  }
  search() {
    if (this.isEmptyForm()) {
      this.mytoastr.showWarning("Seleccione un filtro", "")
      return
    }
    this.clearData();
    this.getDataIdTransaction(this.pageSize)
  }
  clearData() {
    this.pageKey = undefined; //Reinicia los valores de paginación (`pageKey`, `page`).
    this.dataTransaction = []; //Limpia la lista de transacciones (`dataTransaction`).
    this.count = -1; //Resetea los contadores (`count`, `amountTransaction`) a -1.
    this.page = 1;
  }

  clearFilter() {
    this.serviceFilter = '';
    this.filteredServices = [];
    this.selectedCategory = false;
    this.listServicesSelected = [];
  }

  listData() {
    this.spinner.spinnerOnOff();
    forkJoin([
      this.masterService.getItemsMasterTable('16'), // Tipos de documentos de identidad
      this.masterService.getItemsMasterTable('14')
    ]).subscribe({
      next: (response) => {
        const [masterStatus, category] = response;
        this.masterStatus = masterStatus.sort((a: any, b: any) => a.master_order - b.master_order);
        this.masterStatusConc = ["CONCILIADO", "NO CONCILIADO", "PENDIENTE"];
        this.categoryTypes = category;
        this.spinner.spinnerOnOff();
      },
      error: (error) => {
        this.spinner.spinnerOnOff();
        console.error("Error loading master table data:", error);
      }
    });
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
  get servicesNames(): string {
    return this.listServicesSelected.map(s => s.name).join(', ');
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


}

interface ServiceItem {
  id: string;
  name: string;
}
