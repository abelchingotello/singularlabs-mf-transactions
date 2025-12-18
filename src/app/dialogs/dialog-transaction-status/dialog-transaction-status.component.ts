import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TransactionService } from '../../services/transaction.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { MytoastrService } from 'src/app/services/mytoastr';

@Component({
  selector: 'app-dialog-transaction-status',
  templateUrl: './dialog-transaction-status.component.html',
  styleUrls: ['./dialog-transaction-status.component.scss']
})
export class DialogTransactionStatusComponent implements OnInit {

  public formOperation!: FormGroup;
  estadosDisponibles: string[] = [];
  public isDisable: any;
  private estados: any = {};

  constructor(
    private readonly TransactionService: TransactionService,
    private readonly fb: FormBuilder,
    public dialogRef: MatDialogRef<DialogTransactionStatusComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: DialogData,
    private readonly spinner: SpinnerService,
    private readonly mytoastr: MytoastrService,
  ) { }

  /**
   * Inicializa el formulario y configura los estados disponibles.
   */
  ngOnInit(): void {
    this.isDisable = true;
    this.estados = {
      trans: this.estadosTransaccion.map((e: any) => e.master_name), // extraes solo los nombres
      cons: this.estadosConciliacion.map((e: any) => e.master_name), // extraes solo los nombres
    };

    this.formOperation = this.fb.group({
      estadoTipo: ['', Validators.required],
      nuevoEstado: ['', Validators.required],
      btnActualizar: ['']
    });
  }

  /**
   * Cambia la lista de estados disponibles según el tipo seleccionado.
   * 
   * @param tipo Tipo de estado seleccionado (trans/cons).
   */
  onEstadoTipoChange(tipo: string) {
    this.estadosDisponibles = this.estados[tipo] || [];
    this.formOperation.get('nuevoEstado')?.reset();
    this.isDisable = true;
    if (tipo === 'trans') {
      this.formOperation.patchValue({ nuevoEstado: this.data.statusTrans });
    }
  }

  /**
   * Verifica si el nuevo estado es diferente al actual para habilitar el botón de actualizar.
   *
   * @param nuevoEstado Nuevo estado seleccionado.
   */
  onEstadoChange(nuevoEstado: any) {
    if (nuevoEstado == this.data.statusTrans || nuevoEstado == this.data.statusCons) {
      this.isDisable = true;

    } else {
      this.isDisable = false;
    }
  }

  /**
   * Envía la actualización del estado de la transacción al servicio.
   * Maneja spinner, notificaciones y cierre del diálogo.
   */
  updateEstado() {
    this.isDisable = true;
    this.spinner.spinnerOnOff();
    const data1 = {
      id: this.id_transaction,
      sk: this.sk,
      type: this.estadoTipo,
      status: this.nuevoEstado === 'PENDIENTE' ? '' : this.nuevoEstado
    };

    this.TransactionService.updateTransactionStatus(data1).subscribe({
      next: (resp) => {
        this.mytoastr.showSuccess(resp.message, '');
        this.isDisable = true;

      },
      error: (err) => {
        console.error('ERROR', err);
        this.mytoastr.showError('Error al guardar estado', '');
        this.spinner.spinnerOnOff();
        const cambio_realizado = false;
        this.dialogRef.close(cambio_realizado);
        this.isDisable = false;

      },
      complete: () => {
        this.spinner.spinnerOnOff();
        this.isDisable = false;
        const cambio_realizado = true;
        this.dialogRef.close(cambio_realizado);
      },
    });
  }


  get nuevoEstado() {
    return this.formOperation?.get('nuevoEstado')?.value;
  }
  get id_transaction() {
    return this.data.id
  }
  get sk() {
    return this.data.sk
  }
  get estadosTransaccion() {
    return this.data.masterStatus
  }
  get estadosConciliacion() {
    return this.data.masterStatusCons
  }
  get estadoTipo() {
    return this.formOperation?.get('estadoTipo')?.value;
  }
}

/**
 * Datos que recibe el diálogo al inicializarse.
 */
export interface DialogData {
  resp: any;
  id: string;
  statusTrans: any;
  masterStatus: any;
  masterStatusCons: any;
  statusCons: any;
  sk: any;
}
