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
import { FormBuilder, FormGroup, Validator } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MasterService } from 'src/app/services/master.service';
import { PersonService } from 'src/app/services/person.service';
import { Toast } from 'ngx-toastr';

@Component({
  selector: 'app-list-balance',
  templateUrl: './list-balance.component.html',
  styleUrls: ['./list-balance.component.scss']
})
export class ListBalanceComponent implements OnInit {

  private pagUtils: PaginationUtils | undefined;

  public columns: any[] = [
    { 'name': 'Entidad', 'attribute': 'entity' },
    { 'name': 'Tipo Monto', 'attribute': 'typeAmount' },
    { 'name': 'Monto', 'attribute': 'amountTransaction' },
    //{ 'name': 'Moneda', 'attribute': 'currency' },
  ];
  public dataBalance: any[] = [];
  public pageSize: any = 5;
  public pageKey: any[] | undefined;
  public assignForm!: FormGroup;
  public functionDataCurrent!: (pageSize: any) => any;
  public selectedType: any;
  public typeEntitys: any;
  public nameType: any;
  public page: any = 1;
  public count: any = -1;
  @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;
  public selectType: boolean = false;

  constructor(
    private spinner: SpinnerService,
    private router: Router,
    private transactionService: TransactionService,
    private personService: PersonService,
    private dateService: DateService,
    private fb: FormBuilder,
    private masterService: MasterService,
    private mytoastr: MytoastrService,
    private balanceService: BalanceService,
  ) {
    this.pagUtils = new PaginationUtils();
  }

  ngOnInit(): void {
    this.formAssign();
    this.listData();
    this.functionDataCurrent = this.getDataBalance.bind(this);
    this.functionDataCurrent(this.pageSize)
  }

  formAssign() {
    this.assignForm = this.fb.group({
      entity: [''],
      typeEntity: [''],
    })
  }

  /**
   * Carga tipos de entidad desde la tabla maestra.
   *
   * @returns Actualiza `typeEntitys` con los valores ordenados.
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
   * Obtiene saldos actuales según filtros seleccionados.
   *
   * @param {*} pageSize - Tamaño de página para la consulta.
   * @returns Actualiza `dataBalance`, `pageKey`, `count`.
   */
  getDataBalance(pageSize: any) {
    this.spinner.spinnerOnOff();
    this.resetUser(this.getDataBalance)

    let typeEntity = this.typeEntity?.master_name || undefined;
    let entity = this.entity || undefined;


    if (this.typeEntity === undefined || this.typeEntity === null || this.typeEntity === '') {
      this.spinner.spinnerOnOff();
      return;
    }

    this.transactionService.getCurrentBalances(pageSize, this.page, typeEntity, entity, this.count).subscribe({
      next: (value: any) => {
        if (value.statusCode == 201) {
          this.mytoastr.showWarning('No se encontraron resultados', '');
          return;
        }
        // cambiar el id entity por el servicePerson.nameAlias de la lista nameType
        let dataNew = value.data.Items.map((item: any) => {
          const person = this.nameType.find((p: any) => p.servicePerson.idPerson === item.entity);
          return {
            ...item,
            amountTransaction: item.amountTransaction + ' ' + item.currency,
            entity: person ? person.servicePerson.nameAlias : item.entity, // Asignar el nombre
          };
        });
        this.dataBalance = [...this.dataBalance, ...dataNew];
        this.pageKey = value.data.hasMore;
        if (value.data.count != 0) this.count = value.data.count;
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
   * Recarga datos limpiando la tabla y restableciendo la selección.
   */
  reload() {
    this.clearData();
    this.dynamic.clearSelection();
    this.functionDataCurrent(this.pageSize);
  }

  /**
   * Limpia la tabla de balances y reinicia contadores de paginación.
   */
  clearData() {
    this.pageKey = undefined;
    this.dataBalance = [];
    this.count = -1;
    this.page = 1;
  }

  onPageChange(event: PageEvent) {
    this.page++;
    this.pageSize = this.pagUtils?.updatePageSize(event.pageSize, this.pageSize);
    this.pagUtils?.onPageChange(event, this.pageSize, this.functionDataCurrent.bind(this), this.pageKey);;
  }

  showAlarmSelectTypeEntity() {
    if (this.typeEntity === undefined || this.typeEntity === null || this.typeEntity === '') {
      this.mytoastr.showError('Seleccione un Tipo Entidad', '');
      return;
    }
  }

  exportDataViaAPI(fileType: 'xlsx' | 'csv'): void {
    console.log('exportDataViaAPI called with', fileType);
    this.spinner.spinnerOnOff();

    const exportFilters: Record<string, any> = {
      typeEntity: this.typeEntity?.master_name || undefined,
      entity: this.entity || undefined,
    };
    const bandeja = "lb";
    this.balanceService.exportBalances(fileType, exportFilters, bandeja).subscribe({
      next: (response) => {
        this.spinner.spinnerOnOff();

        // Verificar si la respuesta tiene cuerpo
        if (response.body) {
          const blob = new Blob([response.body], {
            type: fileType === 'xlsx'
              ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              : 'text/csv;charset=utf-8;'
          });
          const filename = `Lis_Saldo_${this.formatCustomDate(new Date().toISOString())}`;

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
   * Limpia los filtros del formulario de búsqueda y resetea la tabla.
   */
  cleanSearch() {
    this.assignForm.reset();
    this.clearData();
    this.dynamic.clearSelection();
    this.nameType = [];
  }

  /**
  * Ejecuta búsqueda de balances según filtros seleccionados.
  */
  searchData() {
    if (this.typeEntity === undefined || this.typeEntity === null || this.typeEntity === '') {
      this.mytoastr.showWarning('Seleccione un Tipo Entidad', '');
      return;
    }
    this.dataBalance = [];
    this.count = -1;
    this.page = 1;
    this.getDataBalance(this.pageSize);
  }
  /**
   * Selecciona un tipo de entidad y dispara búsqueda de personas asociadas.
  *
  * @param {*} event - Evento del selector de tipo de entidad.
  */
  selecType(event: any) {
    this.selectedType = event.value.master_name
    this.searchPerson(event.value.master_relativeName)
  }

  /**
 * Consulta las personas asociadas a un tipo de entidad específico.
 *
 * @param {*} nameType - Nombre relativo de la entidad.
 * @returns {void}
 */
  searchPerson(nameType: string) {

    this.spinner.spinnerOnOff();
    this.personService.getPerson(nameType, undefined).subscribe({
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

  get entity() {
    return this.assignForm?.get('entity')?.value;
  }

  get typeEntity() {
    return this.assignForm?.get('typeEntity')?.value;
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
}
