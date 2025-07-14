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

  private pagUtils: PaginationUtils | undefined;

  public columns: any[] = [
    { 'name': 'Entidad', 'attribute': 'entity' },
    { 'name': 'Tipo Monto', 'attribute': 'typeAmount' },
    { 'name': 'Monto', 'attribute': 'amountTransaction' },
    { 'name': 'Moneda', 'attribute': 'currency' },
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

  listData() {
    forkJoin([
      this.masterService.getItemsMasterTable('11')
    ]).subscribe({
      next: ([typeEntity]) => {
        this.typeEntitys = typeEntity.sort((a: any, b: any) => a.master_order - b.master_order);
        console.log("ENTIDAD: ", this.typeEntitys)
      },
      error: (err: any) => {
        console.error('Error:', err);
      },
    })
  }

  getDataBalance(pageSize: any) {
    this.spinner.spinnerOnOff();
    this.resetUser(this.getDataBalance)

    let typeEntity = this.typeEntity?.master_name || undefined;
    let entity = this.entity || undefined;

    console.log("ENTIDAD: ", entity)
    console.log("TIPO DE ENTIDAD: ", typeEntity)

    if(this.typeEntity === undefined || this.typeEntity === null || this.typeEntity === '') {
        this.spinner.spinnerOnOff();
      return;
    }

    this.transactionService.getCurrentBalances(pageSize,this.page,typeEntity,entity,this.count).subscribe({
      next: (value:any) => {
        if(value.statusCode == 201){
          this.mytoastr.showWarning('No se encontraron resultados', '');
          return;
        }
        // cambiar el id entity por el servicePerson.nameAlias de la lista nameType
        let dataNew = value.data.Items.map((item: any) => {
          const person = this.nameType.find((p: any) => p.servicePerson.idPerson === item.entity);
          return {
            ...item,
            entity: person ? person.servicePerson.nameAlias : item.entity, // Asignar el nombre
          };
        });
        this.dataBalance = [...this.dataBalance,...dataNew];
        this.pageKey = value.data.hasMore;
        if(value.data.count != 0) this.count = value.data.count;
        console.log("DATA DE TRANSACTION: " ,value.data)
        if(value.statusCode == 201){
          this.mytoastr.showWarning('No se encontraron resultados', '');
        }

      },
      error: (error: any) => {
        console.error('ERROR',error);
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

  reload() {
    this.clearData();
    this.dynamic.clearSelection();
    this.functionDataCurrent(this.pageSize);
  }

  clearData() {
    this.pageKey = undefined;
    this.dataBalance = [];
    this.count = -1;
    this.page = 1;
  }

  onPageChange(event: PageEvent) {
    console.log("keyyyyyy", this.pageKey)
    this.pageSize = this.pagUtils?.updatePageSize(event.pageSize, this.pageSize);
    this.pagUtils?.onPageChange(event, this.pageSize, this.functionDataCurrent.bind(this), this.pageKey);
    console.log('Página cambiada', event);
  }

  exportDataViaAPI(fileType: 'xlsx' | 'csv'): void {
    console.log('exportDataViaAPI called with', fileType);
    this.spinner.spinnerOnOff();

    const exportFilters: Record<string, any> = {};

    this.balanceService.exportBalances(fileType, exportFilters).subscribe({
      next: (response) => {
        this.spinner.spinnerOnOff();

        // Verificar si la respuesta tiene cuerpo
        if (!response.body) {
          this.mytoastr.showError('La respuesta no contiene datos', '');
          return;
        }

        // Decodificar base64
        const responseBody = response.body || '';
        const byteCharacters = atob(responseBody); //-----
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
        }

        // Obtener nombre del archivo desde headers
        let filename = `saldos_${new Date().toISOString().split('T')[0]}.${fileType}`;
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

  cleanSearch() {
    this.assignForm.reset();
    this.clearData();
  }

  searchData() {
    if(this.typeEntity === undefined || this.typeEntity === null || this.typeEntity === '') {
      this.mytoastr.showWarning('Seleccione un Tipo Entidad', '');
      return;
    }
    this.dataBalance = [];
    this.count = -1;
    this.page = 1;
    this.getDataBalance(this.pageSize);
  }

  selecType(event: any) {
    console.log("ENTIDAD: ", event.value.master_relativeName)
    this.selectedType = event.value.master_name
    this.searchPerson(event.value.master_relativeName)
  }

  searchPerson(nameType: string) {

    this.spinner.spinnerOnOff();
    this.personService.getPerson(nameType, undefined).subscribe({
      next: (value) => {
        this.nameType = value.data
        console.log('TYPE ENTITY POR ENTIDAD: ', this.nameType)
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

}
