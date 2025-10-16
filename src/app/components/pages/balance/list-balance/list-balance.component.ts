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
import { forkJoin } from 'rxjs';
import { MasterService } from 'src/app/services/master.service';
import { PersonService } from 'src/app/services/person.service';

@Component({
  selector: 'app-list-balance',
  templateUrl: './list-balance.component.html',
  styleUrls: ['./list-balance.component.scss']
})
export class ListBalanceComponent implements OnInit {

  private readonly pagUtils: PaginationUtils | undefined;

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
    private readonly spinner: SpinnerService,
    private readonly router: Router,
    private readonly transactionService: TransactionService,
    private readonly personService: PersonService,
    private readonly DdateService: DateService,
    private readonly fb: FormBuilder,
    private readonly masterService: MasterService,
    private readonly mytoastr: MytoastrService,
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

    const typeEntity = this.typeEntity?.master_name || undefined;
    const entity = this.entity || undefined;


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
        const dataNew = value.data.Items.map((item: any) => {
          const person = this.nameType.find((p: any) => p.servicePerson.idPerson === item.entity);
          return {
            ...item,
            amountTransaction: item.amountTransaction + ' ' + item.currency,
            entity: person ? person.servicePerson.nameAlias : item.entity, // Asignar el nombre
          };
        });
        this.dataBalance = [...this.dataBalance, ...dataNew];
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
    }
  }

  exportDataViaAPI(fileType: 'xlsx' | 'csv'): void {
    console.log('exportDataViaAPI called with', fileType);
    this.spinner.spinnerOnOff();

    const exportFilters: Record<string, any> = {
      typeEntity: this.typeEntity?.master_name || undefined,
      entity: this.entity || undefined,
    };
    const inbx = 'lb';
    const token = localStorage.getItem('fcmToken');
    this.balanceService.exportBalances(fileType, exportFilters, inbx, token).subscribe({
      next: (response) => {
        this.spinner.spinnerOnOff();
        if (response.statusCode === 200) {
          this.mytoastr.showWarningTime('', 'Procesando Archivo...', 1000)
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
