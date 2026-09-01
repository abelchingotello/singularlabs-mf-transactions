import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SpinnerService } from 'src/app/services/spinner.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { BalanceService } from 'src/app/services/balance.service';

@Component({
  selector: 'app-dialog-adjust-balance',
  templateUrl: './dialog-adjust-balance.component.html',
  styleUrls: ['./dialog-adjust-balance.component.scss']
})
export class DialogAdjustBalanceComponent implements OnInit {

  public formOperation!: FormGroup;
  public isDisable: any;

  constructor(
    private readonly balanceService: BalanceService,
    private readonly fb: FormBuilder,
    public dialogRef: MatDialogRef<DialogAdjustBalanceComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: DialogData,
    private readonly spinner: SpinnerService,
    private readonly mytoastr: MytoastrService,
  ) { }

  /**
   * Inicializa el formulario y configura los estados disponibles.
   */
  ngOnInit(): void {
    const data = this.data
    console.log(data)
    this.formOperation = this.fb.group({
      balance: ['', Validators.required],
      entity: [{ value: '', disabled: true }, Validators.required],
      btnActualizar: ['']
    });

    this.balance?.setValue(data.balance)
    this.entity?.setValue(data.entity)
  }

  /**
   * Envía la actualización del estado de la transacción al servicio.
   * Maneja spinner, notificaciones y cierre del diálogo.
   */
  updateEstado() {
    if (this.data.balance == this.balance?.value) {
      this.mytoastr.showWarning('', 'Realice cambios')
      return
    }
    this.isDisable = true;
    this.spinner.spinnerOnOff();

    const data = {
      action: 'adjust',
      idClient: this.data.type_entity === "RECAUDADOR" ? this.id : undefined,
      idProvider: this.data.type_entity === "PROVIDER" ? this.id : undefined,
      concept: `AJUSTE DE SALDO ${this.entity?.value}`,
      balance: this.balance?.value ? this.balance?.value : undefined,
    };

    this.balanceService.adjustBalance(data).subscribe({
      next: (resp) => {
        if (resp.statusCode === "200") {
          this.mytoastr.showSuccess('', 'Saldo actualizado correctamente')
          this.dialogRef.close(200);
        }
      },
      error: (err) => {

      },
      complete: () => {
        this.isDisable = false;
        this.spinner.spinnerOnOff();
      },
    });
  }

  onNoClick(){
    this.dialogRef.close();
  }

  get entity() {
    return this.formOperation?.get('entity');
  }
  get id() {
    return this.data.id
  }
  get balance() {
    return this.formOperation?.get('balance');
  }
}

/**
 * Datos que recibe el diálogo al inicializarse.
 */
export interface DialogData {
  balance: any;
  entity: string;
  id: string;
  type_entity: any;
}
