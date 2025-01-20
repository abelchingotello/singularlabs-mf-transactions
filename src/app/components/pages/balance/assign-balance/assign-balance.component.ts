import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BalanceService } from 'src/app/services/balance.service';
import { MasterService } from 'src/app/services/master.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { PersonService } from 'src/app/services/person.service';
import { SpinnerService } from 'src/app/services/spinner.service';

@Component({
  selector: 'app-assign-balance',
  templateUrl: './assign-balance.component.html',
  styleUrls: ['./assign-balance.component.scss']
})
export class AssignBalanceComponent implements OnInit {

  public assignForm!: FormGroup;
  public selectedType: any;
  public typeEntity: any;
  public nameType: any[] = []

  constructor(
    private fb: FormBuilder,
    private assignService: BalanceService,
    private masterService: MasterService,
    private personService: PersonService,
    private spinner: SpinnerService,
    private router: Router,
    private mytoastr: MytoastrService
  ) { }

  ngOnInit(): void {
    this.formAssign();
    this.listData();

    this.assignForm.get('concept')?.valueChanges.subscribe(value => {
      if (value) {
        this.assignForm.get('concept')?.setValue(value.toUpperCase(), { emitEvent: false });
      }
    });

  }

  formAssign() {
    this.assignForm = this.fb.group({
      concept: ['', Validators.required],
      billHolder: "API",
      idProvider: [],
      idClient: [],
      amountTransaction: ['', Validators.required],
      currency: [{ value: 'PEN', disabled: true }]
    })


  }



  listData() {
    forkJoin([
      this.masterService.getItemsMasterTable('11')

    ]).subscribe({
      next: ([typeEntity]) => {
        this.typeEntity = typeEntity.sort((a: any, b: any) => a.master_order - b.master_order);
        console.log("ENTIDAD: ", this.typeEntity)
      },
      error: (err: any) => {
        console.error('Error:', err);
      },
    })
  }

  selecType(event: any) {
    console.log("ENTIDAD: ", event.value.master_relativeName)
    this.selectedType = event.value.master_name
    this.searchPerson(event.value.master_relativeName)
  }

  idPerson: string | undefined
  selectEntity(event: any) {
    console.log("ENTIDAD para asignar: ", event.value.idPerson)
    this.idPerson = event.value.idPerson
    if (this.selectedType == 'PROVIDER') {
      this.idProvider?.setValue(event.value.idPerson)
      this.idClient?.setValue(null)
    } else {
      this.idClient?.setValue(event.value.idPerson)
      this.idProvider?.setValue(null)
    }
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

  onPrevious() {
    this.router.navigate(['/balance'])
  }

  saveAssign() {
    if (!this.assignForm.valid || this.typeEntity.length < 0 || this.idPerson == null) {
      this.mytoastr.showWarning('Completar el formulario', '')
      return
    }
    this.spinner.spinnerOnOff();
    console.log("FORMULARIO DATA: ", this.assignForm.getRawValue())
    const data = this.assignForm.getRawValue();
    // return
    this.assignService.assignBalance(data).subscribe({
      next: (value) => {
        if (value?.statusCode !== 200) {
          this.mytoastr.showError('Error al asignar saldo', value?.messages)
          this.spinner.spinnerOnOff();
          return
        }
        this.mytoastr.showSuccess(value.message, '')
        console.log(value)
      },
      error: (error) => {
        this.spinner.spinnerOnOff();
        console.error(error)
      },
      complete: () => {
        this.spinner.spinnerOnOff();
        this.router.navigate(['/balance'])
      }

    })
  }

  get currency() {
    return this.assignForm.get('currency');
  }

  get idProvider() {
    return this.assignForm.get('idProvider');
  }

  get idClient() {
    return this.assignForm.get('idClient');
  }


}
