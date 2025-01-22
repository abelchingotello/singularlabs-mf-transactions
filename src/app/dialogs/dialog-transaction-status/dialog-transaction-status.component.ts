import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MytoastrService } from 'src/app/services/mytoastr';
import { ServicesService } from 'src/app/services/services.service';

@Component({
  selector: 'app-dialog-transaction-status',
  templateUrl: './dialog-transaction-status.component.html',
  styleUrls: ['./dialog-transaction-status.component.scss']
})
export class DialogTransactionStatusComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DialogTransactionStatusComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: DialogData,
  ) { }

  ngOnInit(): void {
    console.log("DATA DE TRANSACTION: ",this.data.resp)
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}


export interface DialogData {
  resp: any;
  id: string;
  state: any;
  idClient:any;
  idProvider:any
}