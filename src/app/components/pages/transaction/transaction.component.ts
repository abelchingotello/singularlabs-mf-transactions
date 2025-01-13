import { Component, OnInit, ViewChild } from '@angular/core';
import { DynamicTableComponent } from '../../library/dynamic-table/dynamic-table.component';

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.component.html',
  styleUrls: ['./transaction.component.scss']
})
export class TransactionComponent implements OnInit {

  public columns: any[] = [
    { 'name': 'Concepto', 'attribute': 'name' },
    { 'name': 'Comisiones', 'attribute': 'serviceTypeName'},
    { 'name': 'Moneda', 'attribute': 'serviceTypeName'},
    { 'name': 'Zona Operación', 'attribute': 'idProvider'},
    { 'name': 'Fecha', 'attribute': 'description' },
    { 'name': 'Estado', 'attribute': 'idClient'},
  ];
  public dataTransaction : any[] = [];
  
  public pageSize: any = 5;
  public pageKey: any[] | undefined;


  @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;

  constructor() { }

  ngOnInit(): void {
  }


  clearData() {
    this.pageKey = undefined;
    this.dataTransaction = [];
    this.reload();
  }

  reload() {
    // this.clearData();
    this.dynamic.clearSelection();
    // this.functionDataCurrent(this.pageSize);
  }

}
