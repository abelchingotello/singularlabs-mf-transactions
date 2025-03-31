import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { CookieService } from 'ngx-cookie-service';
import { forkJoin } from 'rxjs';
import { DynamicTableComponent } from 'src/app/components/library/dynamic-table/dynamic-table.component';
import { AuthService } from 'src/app/services/auth.service';
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

  private pagUtils: PaginationUtils | undefined;
  public functionDataCurrent!: ((pageSize: any) => any);


  public columns: any[] = [
    { 'name': 'Titular', 'attribute': 'bill'},
    { 'name': 'Recaudador', 'attribute': 'client'},
    { 'name': 'Num. recibo', 'attribute': 'concep'},
    { 'name': 'Monto', 'attribute': 'amountTransaction'},
    // { 'name': 'Moneda', 'attribute': 'currency'},
    { 'name': 'Proveedor', 'attribute': 'provider'},
    { 'name': 'Fecha', 'attribute': 'date','config': {
      'formatDate': { format: 'dd/MM/yyyy hh:mm a', locale: 'en-US' },
    } 
  },
  { 'name': 'Cod. respuesta', 'attribute': 'reference' },
    { 'name': 'Estado', 'attribute': 'status', 'config': { 'styleClass': true }},
  ];

  public params: any = {};

  public typePersonMapping: Record<string, string> = {
  "PROVIDER": "idprovider",
  "RECAUDADOR": "idclient"
};

  public formDate! : FormGroup<any>;
  

  public dataTransaction : any;
  public pageKey : any[] | undefined;
  public pageSize: any = 5;
  public personId :string = '';
  public typePerson : string  = '';
  public masterStatus: any[] = [];
  public serviceName : any;

    @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;
  

  constructor(
    private transactionService : TransactionService,
    private spinner : SpinnerService,
    private mytoastr : MytoastrService,
    private person : PersonService,
    private cookie : CookieService,
    private fb : FormBuilder,
    private masterService : MasterService,
    private personService : PersonService,
    private dateService : DateService,
    private serviceServ : ServicesService
  ) { 
    this.pagUtils = new PaginationUtils();
  }

  ngOnInit(): void {
    this.personId= this.cookie.get('person_id')
    console.log("dataUser: ",this.personId)
    // this.getPerson(this.personId)
    this.typePerson = this.cookie.get('prefix');
    this.initialForm();
    this.listData();
    this.functionDataCurrent = this.getDataIdTransaction.bind(this);
    this.functionDataCurrent(this.pageSize);
  }

  initialForm(){
      this.formDate = this.fb.group({
        dateStart: [''],
        dateEnd: [''],
        entity: [''],
        idService : [''],
        numDoc : [''],
        status: [''],
      });
    }
  

  getPerson(id:string){
    this.spinner.spinnerOnOff();
    this.person.getIdPerson(id).subscribe({
      next:(value)=> {
         this.typePerson= value.Items[0].PREFIX;
         console.log("typePerson: ",this.typePerson)
      },
      error:(error)=>{
        console.log("error: ",error)
        this.spinner.spinnerOnOff();
      },
      complete:() =>{
          this.spinner.spinnerOnOff();
      },
    })
  }


  getDataIdTransaction(pageSize?: any){
    this.spinner.spinnerOnOff();
    this.resetUser(this.getDataIdTransaction)
    const key = this.typePersonMapping[this.typePerson];

    console.log("typePersn: ",this.typePerson)
    console.log("key: ",key)
    
    if (key) {
      this.params[key] = this.personId;
    }

    console.log("params: ",this.params)

    this.transactionService.getTransaction(this.params?.idclient,this.params?.idprovider,undefined,undefined,undefined,pageSize,this.pageKey).subscribe({
      next: (value:any) => {
        if(value.statusCode === 201 || value.data.statusCode === 201){
          this.mytoastr.showWarning(value.data.messages || 'No se encontraron transacciones','');
          return
        }
        this.dataTransaction = [...this.dataTransaction,...value.data.Items];
        // this.count = value.data.Count
        // this.amountTransaction = (value.data.Total).toFixed(2)
        this.pageKey = value.data.nextPageKey ?? null
        console.log("DATA DE TRANSACTION: " ,value.data)
      },
      error: (error: any) => {
        console.error('ERROR',error);
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

  clearData() {
    this.pageKey = undefined;
    this.dataTransaction = [];
    // this.reload();
  }

  reload() {
    this.clearData();
    this.dynamic.clearSelection();
    this.functionDataCurrent(this.pageSize);
  }

  onPageChange(event: PageEvent) {
    console.log("keyyyyyy", this.pageKey)
    this.pageSize = this.pagUtils?.updatePageSize(event.pageSize, this.pageSize);
    this.pagUtils?.onPageChange(event, this.pageSize, this.functionDataCurrent.bind(this), this.pageKey);
    console.log('Página cambiada', event);
  }

  listData() {
    this.spinner.spinnerOnOff();
    forkJoin([
      this.masterService.getItemsMasterTable('16'), // Tipos de documentos de identidad
      this.serviceServ.getServices()
    ]).subscribe({
      next: (response) => {
        const [masterStatus, service] = response;
        this.masterStatus = masterStatus.sort((a: any, b: any) => a.master_order - b.master_order);
        this.serviceName = service.data
        console.log("ESTADOS: ", this.masterStatus)
        console.log("SERVICIOS: ", this.serviceName)

        this.spinner.spinnerOnOff();
      },
      error: (error) => {
        this.spinner.spinnerOnOff();
        console.error("Error loading master table data:", error);
      }
    });
  }





}

