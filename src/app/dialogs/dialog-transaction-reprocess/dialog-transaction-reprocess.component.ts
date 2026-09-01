import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TransactionService } from '../../services/transaction.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SpinnerService } from 'src/app/services/spinner.service';
import { DialogAdjustBalanceComponent } from '../dialog-adjust-balance/dialog-adjust-balance.component';

@Component({
  selector: 'app-dialog-transaction-reprocess',
  templateUrl: './dialog-transaction-reprocess.component.html',
  styleUrls: ['./dialog-transaction-reprocess.component.scss'],
})
export class DialogTransactionReprocessComponent implements OnInit {

  public isDisable: any;

  constructor(
    public dialogRef: MatDialogRef<DialogAdjustBalanceComponent>,
    public transactionService: TransactionService,
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

  }

  /**
   * Envía la actualización del estado de la transacción al servicio.
   * Maneja spinner, notificaciones y cierre del diálogo.
   */
  reprocessReconciliation(): void {
    // lógica para reprocesar la conciliación
    const body = { "amount": this.data.amount, "supply": this.data.supply, "opNumber": this.data.reference }
    this.transactionService.postReprocessTransaction(this.data.pk, body).subscribe({
      next: () => {

      }
    })
  }

  onNoClick() {
    this.dialogRef.close();
  }


}

/**
 * Datos que recibe el diálogo al inicializarse.
 */
export interface DialogData {
  pk: any;
  amount: any;
  supply: string;
  concep: any,
  reference: any,
}
