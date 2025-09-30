import { forkJoin } from 'rxjs';
import { Component, OnInit, ViewChild } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { DynamicTableComponent } from 'src/app/components/library/dynamic-table/dynamic-table.component';
import { SpinnerService } from 'src/app/services/spinner.service';
import { TransactionService } from 'src/app/services/transaction.service';
import { PaginationUtils } from 'src/app/utilities/pagination-utils';
import { DateService } from 'src/app/services/date.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { BalanceService } from 'src/app/services/balance.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PersonService } from 'src/app/services/person.service';
import { MasterService } from 'src/app/services/master.service';
//----
@Component({
  selector: 'app-report-balance',
  templateUrl: './control-assign.component.html',
  styleUrls: ['./control-assign.component.scss']
})
export class ReportBalanceComponent implements OnInit {

  private readonly pagUtils: PaginationUtils | undefined;

  public columns: any[] = [
    { 'name': 'Nombre', 'attribute': 'concep' },
    { 'name': 'Monto transacción', 'attribute': 'amountTransaction' },
    {
      'name': 'Fecha', 'attribute': 'date', 'config': {
        'formatDate': { format: 'dd/MM/yyyy hh:mm a', locale: 'en-US' },
      }
    },
  ];
  public dataBalance: any[] = [];
  public pageSize: any = 5;
  public typeEntitys: any;
  public selectedType: any;
  public pageKey: any;
  public page: any = 1;
  public count: any = -1;
  public assignForm!: FormGroup;
  public functionDataCurrent!: (pageSize: any) => any;
  public nameType: any[] = [];
  public idClient: any;
  public idProvider: any;

  @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;

  constructor(
    private readonly spinner: SpinnerService,
    private readonly router: Router,
    private readonly transactionService: TransactionService,
    private readonly personService: PersonService,
    private readonly fb: FormBuilder,
    private readonly dateService: DateService,
    private readonly mytoastr: MytoastrService,
    private readonly masterService: MasterService,
    private readonly balanceService: BalanceService,
  ) {
    this.pagUtils = new PaginationUtils();
  }

  ngOnInit(): void {
    this.formAssign();
    this.listData();
    this.functionDataCurrent = this.getDataBalance.bind(this);
    this.functionDataCurrent(this.pageSize)
  }

  /**
   * Redirige a la vista de asignación de saldo.
   */
  addBalance() {
    this.router.navigate(['balance/assign'])
  }

  /**
   * Construye el formulario reactivo para asignación de balances.
   */
  formAssign() {
    this.assignForm = this.fb.group({
      status: [''],
      entity: [''],
      typeEntity: [''],
      typeAssign: [''],
      dateStart: [''],
      dateEnd: [''],
    })
  }

  /**
   * Carga tipos de entidad desde la tabla maestra y los ordena.
   */
  listData() {
    forkJoin([
      this.masterService.getItemsMasterTable('11')

    ]).subscribe({
      next: ([typeEntity]) => {
        this.typeEntitys = typeEntity.sort((a: any, b: any) => a.master_order - b.master_order);
      },
      error: (err: any) => {
        console.error('Error:', err);
      },
    })
  }

  /**
  * Obtiene saldos según filtros seleccionados y gestiona paginación.
  * 
  * @param {*} pageSize - Tamaño de página a consultar.
  */
  getDataBalance(pageSize: any) {
    this.spinner.spinnerOnOff();
    this.resetUser(this.getDataBalance)

    const typeEntity = this.typeEntity?.master_name || undefined;
    const entity = this.entity || undefined;
    const typeAssign = this.typeAssign || undefined;
    const dateStart = this.dateService.formatStartDate(this.dateStart).replace(/\//g, '') || undefined;
    const dateEnd = this.dateService.formatEndDate(this.dateEnd).replace(/\//g, '') || undefined

    const listfilters = {
      entity: entity,
      typeEntity: typeEntity,
      typeAssign: typeAssign,
      dateStart: dateStart,
      dateEnd: dateEnd
    }
    console.log('listfilters', listfilters)
    // return 
    this.transactionService.getBalance(listfilters, pageSize, this.page, this.count).subscribe({
      next: (value: any) => {
        if (value.statusCode == 201) {
          this.mytoastr.showWarning('No se encontraron resultados', '');
          return;
        }
        //recorrer lista y concatenar el monto con la moneda
        const datanew = value.data.Items.map((item: any) => {
          return {
            ...item,
            amountTransaction: item.amountTransaction + ' ' + item.currency,
          };
        });
        this.dataBalance = [...this.dataBalance, ...datanew];
        this.pageKey = value.data.hasMore;
        if (value.data.count != 0) {
          this.count = value.data.count
        };
        if (value.statusCode == 201) {
          this.mytoastr.showWarning('No se encontraron resultados', '');
        }
      },
      error: (error: any) => {
        console.error('ERROR', error);
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

  /**
   * Recarga datos: limpia tabla, selección y vuelve a consultar.
   */
  reload() {
    this.clearData();
    this.dynamic.clearSelection();
    this.functionDataCurrent(this.pageSize);
  }

  /**
   * Limpia la tabla y reinicia contadores de paginación.
   */
  clearData() {
    this.pageKey = undefined;
    this.dataBalance = [];
    this.count = -1;
    this.page = 1;
  }

  onPageChange(event: PageEvent) {
    this.pageSize = this.pagUtils?.updatePageSize(event.pageSize, this.pageSize);
    this.page++;
    this.pagUtils?.onPageChange(event, this.pageSize, this.functionDataCurrent.bind(this), this.pageKey);
  }

  showAlarmSelectTypeEntity() {
    if (this.typeEntity === undefined || this.typeEntity === null || this.typeEntity === '') {
      this.mytoastr.showError('Selecciona un tipo de entidad', '');
    }
  }

  exportDataViaAPI(fileType: 'xlsx' | 'csv'): void {
    console.log('exportDataViaAPI called with', fileType);
    this.spinner.spinnerOnOff();

    const exportFilters: Record<string, any> = {
      entity: this.entity || undefined,
      typeEntity: this.typeEntity?.master_name || undefined,
      typeAssign: this.typeAssign || undefined,
      dateStart: this.dateService.formatStartDate(this.dateStart).replace(/\//g, '') || undefined,
      dateEnd: this.dateService.formatEndDate(this.dateEnd).replace(/\//g, '') || undefined
    };
    const bandeja = "ca";
    this.balanceService.exportBalances(fileType, exportFilters, bandeja).subscribe({
      next: (response) => {
        this.spinner.spinnerOnOff();

        // Verificar si la respuesta tiene cuerpo
        if (response?.body) {

          const byteCharacters = atob(response.body);
          const byteArray = new Uint8Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteArray[i] = byteCharacters.charCodeAt(i);
          } const blob = new Blob([byteArray], {
            type: fileType === 'xlsx'
              ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              : 'text/csv;charset=utf-8;'
          });
          const filterParts: string[] = [];
          if (exportFilters['dateStart']) { filterParts.push(`${exportFilters['dateStart'].split(' ')[0]}`) };
          if (exportFilters['dateEnd']) { filterParts.push(`${exportFilters['dateEnd'].split(' ')[0]}`) };

          let filename = `cntrl_assing_`;
          if (filterParts.length) {
            if (exportFilters['dateStart'].split(' ')[0] === exportFilters['dateEnd'].split(' ')[0]) {
              const diainicio = this.formatCustomDate(exportFilters['dateEnd']);
              filename += `${diainicio}`;
            } else {
              const diainicio = this.formatCustomDate(exportFilters['dateStart']);
              const diafin = this.formatCustomDate(exportFilters['dateEnd']);
              filename += `${diainicio}_${diafin}`;
            }
          } else {
            filename += this.formatCustomDate(new Date().toISOString());
          }
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${filename}.${fileType}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } else {
          this.mytoastr.showError('No se recibió ningún dato para exportar', '');
        }
      },
      error: (error) => {
        console.error('Error al exportar los datos:', error);
        this.mytoastr.showError('Error al exportar los datos', '');
        this.spinner.spinnerOnOff();
      }
    });
  }

  /**
   * Selecciona un tipo de entidad y busca personas asociadas.
   * 
   * @param {*} event - Evento del selector de tipo de entidad.
   */
  selecType(event: any) {
    this.selectedType = event.value.master_name
    this.searchPerson(event.value.master_relativeName)
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

  /**
 * Busca personas asociadas a un tipo de entidad.
 * 
 * @param {*} nameType - Nombre relativo de la entidad.
 */
  searchPerson(nameType: string) {

    this.spinner.spinnerOnOff();
    this.personService.getPerson(nameType).subscribe({
      next: (value) => {
        this.nameType = value.data
      },
      error: (error) => {
        console.log(error)
      },
      complete: () => {
        this.spinner.spinnerOnOff();
      }
    })
  }

  /**
   * Ejecuta búsqueda con los filtros del formulario.
   */
  searchData() {
    if (this.assignForm.get('dateEnd')?.value == '' &&
      this.assignForm.get('typeAssign')?.value == '' &&
      this.assignForm.get('entity')?.value == '' &&
      this.assignForm.get('typeEntity')?.value == '') {
      this.mytoastr.showWarning("Seleccione un filtro", "")
      return
    }
    this.dataBalance = [];
    this.count = -1;
    this.page = 1;
    this.getDataBalance(this.pageSize);
  }

  /**
   * Limpia filtros y reinicia la tabla de balances.
   */
  cleanSearch() {
    this.assignForm.reset();
    this.clearData();
    this.nameType = [];
    this.assignForm.get('dateEnd')?.setValue('')
    this.assignForm.get('typeAssign')?.setValue('')
    this.assignForm.get('entity')?.setValue('')
    this.assignForm.get('typeEntity')?.setValue('')
    this.getDataBalance(this.pageSize);
  }



  get dateStart() {
    return this.assignForm?.get('dateStart')?.value;
  }

  get entity() {
    return this.assignForm?.get('entity')?.value;
  }

  get dateEnd() {
    return this.assignForm?.get('dateEnd')?.value;
  }
  get typeAssign() {
    return this.assignForm?.get('typeAssign')?.value;
  }

  get typeEntity() {
    return this.assignForm?.get('typeEntity')?.value;
  }
}
