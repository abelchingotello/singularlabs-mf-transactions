import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-search-operation',
  templateUrl: './dialog-search-operation.component.html',
  styleUrls: ['./dialog-search-operation.component.scss']
})
export class DialogSearchOperationComponent implements OnInit {


  public transaction : any;
  constructor(
    public dialogRef: MatDialogRef<DialogSearchOperationComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: DialogData,
  ) { }

  ngOnInit(): void {
    this.transaction = this.data.resp
  }


  onNoClick(): void {
    this.dialogRef.close();
  }


}

export interface DialogData {
  resp: any;
}
