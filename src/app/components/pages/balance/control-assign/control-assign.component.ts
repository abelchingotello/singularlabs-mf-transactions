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

  private pagUtils: PaginationUtils | undefined;

  public columns: any[] = [
    { 'name': 'Nombre', 'attribute': 'concep' },
    { 'name': 'Monto transacción', 'attribute': 'amountTransaction' },
    //{ 'name': 'Moneda', 'attribute': 'currency'},
    { 'name': 'Fecha', 'attribute': 'date', 'config': {
      'formatDate': { format: 'dd/MM/yyyy hh:mm a', locale: 'en-US' },
    }},
    // { 'name': 'Estado', 'attribute': 'status','config':{
    //   'styleClass':true
    // }},
  ];
  public dataBalance: any[] = [];
  public pageSize: any = 5;
  public typeEntitys: any;
  public selectedType: any;
  public pageKey: any;
  public page:any = 1;
  public count: any = -1;
  public assignForm!: FormGroup;
  public functionDataCurrent!: (pageSize: any) => any;
  public nameType: any[] = [];
  public idClient: any;
  public idProvider: any;

  @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;

  constructor(
    private spinner : SpinnerService,
    private router: Router,
    private transactionService: TransactionService,
    private personService: PersonService,
    private fb: FormBuilder,
    private dateService : DateService,
    private mytoastr: MytoastrService,
    private masterService: MasterService,
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

  addBalance(){
    this.router.navigate(['balance/assign'])
  }

  formAssign(){
    this.assignForm = this.fb.group({
      status:[''],
      entity: [''],
      typeEntity: [''],
      typeAssign: [''],
      dateStart: [''],
      dateEnd: [''],
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

  getDataBalance(pageSize:any){
    this.spinner.spinnerOnOff();
    this.resetUser(this.getDataBalance)

    let typeEntity = this.typeEntity?.master_name || undefined;
    let entity = this.entity || undefined;
    let typeAssign = this.typeAssign || undefined;
    let dateStart= this.dateService.formatStartDate(this.dateStart).replace(/\//g, '')  || undefined;
    let dateEnd = this.dateService.formatEndDate(this.dateEnd).replace(/\//g, '')  || undefined

    console.log("ENTIDAD: ", entity)
    console.log("TIPO DE ENTIDAD: ", typeEntity)
    console.log("TIPO DE ASIGNACION: ", typeAssign)
    console.log("FECHA INICIO: ", dateStart)
    console.log("FECHA FIN: ", dateEnd)

    this.transactionService.getBalance(pageSize,this.page,typeEntity,entity,typeAssign,dateStart,dateEnd,this.count).subscribe({
      next: (value:any) => {
        if(value.statusCode == 201){
          this.mytoastr.showWarning('No se encontraron resultados', '');
          return;
        }
        //recorrer lista y concatenar el monto con la moneda
        let datanew = value.data.Items.map((item: any) => {
          return {
            ...item,
            amountTransaction: item.amountTransaction+' '+item.currency,
          };
        });
        console.log("DATA DE BALANCE: ", datanew)
        this.dataBalance = [...this.dataBalance,...datanew];
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
    //this.reload();
  }

  onPageChange(event: PageEvent) {
    console.log("event onPageChange", event)
    this.pageSize = this.pagUtils?.updatePageSize(event.pageSize, this.pageSize);
    this.page++;
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
        console.log('TYPE ENTITU POR ENTIDAD: ', this.nameType)
      },
      error: (error) => {
        console.log(error)
      },
      complete: () => {
        this.spinner.spinnerOnOff();
      }
    })
  }

  searchData(){
    this.dataBalance = [];
    this.count = -1;
    this.page = 1;
    this.getDataBalance(this.pageSize);
  }


  cleanSearch(){
    this.assignForm.reset();
    this.clearData();
  }



  get dateStart(){
    return this.assignForm?.get('dateStart')?.value;
  }

  get entity(){
      return this.assignForm?.get('entity')?.value;
    }

  get dateEnd(){
    return this.assignForm?.get('dateEnd')?.value;
  }
  get typeAssign(){
    return this.assignForm?.get('typeAssign')?.value;
  }

  get typeEntity(){
    return this.assignForm?.get('typeEntity')?.value;
  }

}
