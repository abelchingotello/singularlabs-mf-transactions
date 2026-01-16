import { Component, OnInit, ViewChild } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { DynamicTableComponent } from 'src/app/components/library/dynamic-table/dynamic-table.component';
import { SpinnerService } from 'src/app/services/spinner.service';
import { TransactionService } from 'src/app/services/transaction.service';
import { PaginationUtils } from 'src/app/utilities/pagination-utils';

//----
import { DateService } from 'src/app/services/date.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { BalanceService } from 'src/app/services/balance.service';
//----
@Component({
  selector: 'app-report-balance',
  templateUrl: './report-balance.component.html',
  styleUrls: ['./report-balance.component.scss']
})
export class ReportBalanceComponent implements OnInit {

  private pagUtils: PaginationUtils | undefined;

  public columns: any[] = [
    { 'name': 'Nombre', 'attribute': 'concep' },
    { 'name': 'Monto transacción', 'attribute': 'amountTransaction' },
    { 'name': 'Moneda', 'attribute': 'currency' },
    { 'name': 'Saldo cliente', 'attribute': 'clientBalance' },
    {
      'name': 'Fecha', 'attribute': 'date', 'config': {
        'formatDate': { format: 'dd/MM/yyyy hh:mm a', locale: 'en-US' },
      }
    },
    {
      'name': 'Estado', 'attribute': 'status', 'config': {
        'styleClass': true
      }
    },
  ];
  public dataBalance: any[] = [];
  public pageSize: any = 5;
  public pageKey: any[] | undefined;
  public count: any = 0;

  public functionDataCurrent!: (pageSize: any) => any;

  @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;

  constructor(
    private spinner: SpinnerService,
    private router: Router,
    private transactionService: TransactionService,
    private dateService: DateService,
    private mytoastr: MytoastrService,
    private balanceService: BalanceService,
  ) {
    this.pagUtils = new PaginationUtils();
  }

  ngOnInit(): void {
    this.functionDataCurrent = this.getDataBalance.bind(this);
    this.functionDataCurrent(this.pageSize)
  }

  addBalance() {
    this.router.navigate(['balance/assign'])
  }

  getDataBalance(pageSize: any) {
    this.spinner.spinnerOnOff();
    this.resetUser(this.getDataBalance)
    this.transactionService.getBalance(pageSize, this.pageKey).subscribe({
      next: (value: any) => {
        this.dataBalance = [...this.dataBalance, ...value.data.Items];
        this.pageKey = value.data.nextPageKey ?? null
        if (value.data.Count != 0) this.count = value.data.Count;
        console.log("DATA DE TRANSACTION: ", value.data)
      },
      error: (error: any) => {
        console.error('ERROR', error);
        this.spinner.spinnerOnOff();
      },
      complete: () => {
        this.spinner.spinnerOnOff();
      }
    })
    this.functionDataCurrent = this.getDataBalance
  }

  resetUser(current: any) {
    this.pagUtils?.resetIfChanged(
      current,
      this.functionDataCurrent,
      this.clearData.bind(this)
    )
  }

  reload() {
    this.clearData();
    this.dynamic.clearSelection();
    this.functionDataCurrent(this.pageSize);
  }

  clearData() {
    this.pageKey = undefined;
    this.dataBalance = [];
  }

  onPageChange(event: PageEvent) {
    console.log("keyyyyyy", this.pageKey)
    this.pageSize = this.pagUtils?.updatePageSize(event.pageSize, this.pageSize);
    this.pagUtils?.onPageChange(event, this.pageSize, this.functionDataCurrent.bind(this), this.pageKey);
    console.log('Página cambiada', event);
  }
  exportDataViaAPI(fileType: 'xlsx' | 'csv'): void {
    console.log('exportDataViaAPI called with', fileType);
    this.spinner.spinnerOnOff();

    const exportFilters: Record<string, any> = {};

    this.balanceService.exportBalances(fileType, exportFilters, "", "").subscribe({
      next: (response) => {
        this.spinner.spinnerOnOff();

        // Verificar si la respuesta tiene cuerpo
        if (!response.body) {
          this.mytoastr.showError('La respuesta no contiene datos', '');
          return;
        }

        // Decodificar base64
        const responseBody = response.body || '';
        const byteCharacters = atob(responseBody); //-----
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
        }

        // Obtener nombre del archivo desde headers
        let filename = `saldos_${new Date().toISOString().split('T')[0]}.${fileType}`;
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
          const parts = contentDisposition.split('filename=');
          if (parts.length > 1) {
            filename = parts[1].replace(/"/g, '').trim();
          }
        }

        console.log('Downloading file:', filename);

        // Crear Blob con el tipo MIME del backend
        const blob = new Blob([byteArray], {
          type: response.headers.get('Content-Type') || 'application/octet-stream'
        });

        // Descargar
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(link.href);
      },
      error: (error) => {
        console.error('Error al exportar los datos:', error);
        this.mytoastr.showError('Error al exportar los datos', '');
        this.spinner.spinnerOnOff();
      }
    });
  }
}
