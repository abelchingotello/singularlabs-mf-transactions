import { Component, OnInit, ViewChild } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { CookieService } from 'ngx-cookie-service';
import { DynamicTableComponent } from 'src/app/components/library/dynamic-table/dynamic-table.component';
import { AuthService } from 'src/app/services/auth.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { PersonService } from 'src/app/services/person.service';
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

  public dataTransaction : any;
  public pageKey : any[] | undefined;
  public pageSize: any = 5;
  public personId :string = '';
  public typePerson : string  = '';

    @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;
  

  constructor(
    private transactionService : TransactionService,
    private spinner : SpinnerService,
    private mytoastr : MytoastrService,
    private person : PersonService,
    private cookie : CookieService
  ) { 
    this.pagUtils = new PaginationUtils();
  }

  ngOnInit(): void {
    this.personId= this.cookie.get('person_id')
    console.log("dataUser: ",this.personId)
    this.getPerson(this.personId)
    this.functionDataCurrent = this.getDataIdTransaction.bind(this);
    this.functionDataCurrent(this.pageSize);
  }

  getPerson(id:string){
    this.spinner.spinnerOnOff();
    this.person.getIdPerson(id).subscribe({
      next:(value)=> {
         this.typePerson= value.Items[0].PREFIX
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
    let searchId ;
    if(this.typePerson =="PROVIDER") {
      // searchId = 
    } else if(this.typePerson == 'RECAUDADOR'){

    }
    this.transactionService.getIdTransaction(this.personId,pageSize,this.pageKey).subscribe({
      next: (value:any) => {
        if(value.statusCode === 201 || value.data.statusCode === 201){
          this.mytoastr.showWarning(value.data.messages || 'No se encontraron transacciones','');
          return
        }
        this.dataTransaction = [...this.dataTransaction,...value.data.items];
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





}

