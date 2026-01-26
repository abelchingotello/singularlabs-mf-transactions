import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MasterService } from 'src/app/services/master.service';
import { PersonService } from 'src/app/services/person.service';

@Component({
  selector: 'app-dialog-min-balance',
  templateUrl: './dialog-min-balance.component.html',
  styleUrls: ['./dialog-min-balance.component.scss']
})
export class DialogMinBalanceComponent implements OnInit {
  public stateMaster!: any;  // Definite assignment - populated in ngOnInit
  public person: string = '';
  public minBalanceDB!: number;  // Definite assignment - set conditionally
  public formMinBalance!: FormGroup;  // Definite assignment - created in initialForm()

  constructor(
    public dialogRef: MatDialogRef<DialogMinBalanceComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: DialogData,
    private masterService: MasterService,
    private personService: PersonService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    console.log('data in ngOnInit', this.data);
    this.person = this.data.person_name!;

    // Safe assignment with fallback - satisfies TypeScript strict mode
    this.minBalanceDB = this.data.min_balance !== 'N/A'
      ? Number(this.data.min_balance)
      : 0;

    console.log('minBalanceDB', this.minBalanceDB);
    this.initialForm();

    this.masterService.getItemsMasterTable(1).subscribe({
      next: (data) => {
        this.stateMaster = data;
        console.log("DATAMASTER", data);
      }
    });
  }

  initialForm() {
    this.formMinBalance = this.fb.group({
      entidad: [{ value: this.person, disabled: true }, Validators.required],
      minBalance: [{ value: this.minBalanceDB || 0, disabled: false }, Validators.required],
      btnActualizar: ['']
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  disableDialog() {
    console.log("DESACTIVAR: ");
  }

  updateMinBalance() {
    const data = {
      idPerson: this.data.person_id,
      minBalance: this.formMinBalance.get('minBalance')?.value
    };
    console.log("data", data);

    this.personService.updateMinBalancePerson(data).subscribe({
      next: (response) => {
        console.log("RESPUESTA", response);
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Error updating min balance:', error);
      }
    });
  }

  get minBalance() {
    return this.formMinBalance.get('minBalance')?.value;
  }
}

export interface DialogData {
  person_id: string,
  person_name: string,
  min_balance: any
}
