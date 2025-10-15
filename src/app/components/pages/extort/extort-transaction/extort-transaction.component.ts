/*import { Component, ViewChild } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { DynamicTableComponent } from 'src/app/components/library/dynamic-table/dynamic-table.component';
import { PaginationUtils } from 'src/app/utilities/pagination-utils';

@Component({
  selector: 'app-extort-transaction',
  templateUrl: './extort-transaction.component.html',
  styleUrls: ['./extort-transaction.component.scss']
})
export class ExtortTransactionComponent {

  private readonly pagUtils: PaginationUtils | undefined;
  public columns: any[] = [
    { 'name': 'Concepto', 'attribute': 'concep' },
    { 'name': 'Comisión', 'attribute': 'comission'},
    { 'name': 'Saldo', 'attribute': 'clientBalance'},
    { 'name': 'Moneda', 'attribute': 'currency'},
    { 'name': 'Zona Operación', 'attribute': 'operationZone'},
    { 'name': 'Fecha', 'attribute': 'date','config': {
        'formatDate': { format: 'dd/MM/yyyy hh:mm a', locale: 'en-US' },
      } },
    { 'name': 'Estado', 'attribute': 'status', 'config': { 'styleClass': true }},
  ];

  public dataExtort : any[] = [];
  public pageSize: any = 5;
  public pageKey: any[] | undefined;
  public functionDataCurrent!: ((pageSize: any) => any);
  
  
  @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;

  constructor() {
    this.pagUtils = new PaginationUtils();
   }

  reload() {
    this.clearData();
    this.dynamic.clearSelection();
    this.functionDataCurrent(this.pageSize);
  }

  clearData() {
    this.pageKey = undefined;
    this.dataExtort = [];
  }

  onPageChange(event: PageEvent) {
      console.log("keyyyyyy", this.pageKey)
      this.pageSize = this.pagUtils?.updatePageSize(event.pageSize, this.pageSize);
      this.pagUtils?.onPageChange(event, this.pageSize, this.functionDataCurrent.bind(this), this.pageKey);
      console.log('Página cambiada', event);
  }

}
*/
import { Component } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { MytoastrService } from 'src/app/services/mytoastr';
import { ChangeDetectorRef } from '@angular/core';
import { SpinnerService } from 'src/app/services/spinner.service';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-extort-transaction',
  templateUrl: './extort-transaction.component.html',
  styleUrls: ['./extort-transaction.component.scss']
})
export class ExtortTransactionComponent {
  public Notificaciones: any[] = [];
  public limit:any = 5;
  constructor(
    private readonly userService: UserService,
    private readonly mytoastr: MytoastrService,
    private readonly cdr: ChangeDetectorRef,
    private readonly spinner: SpinnerService,
    private readonly cookieService: CookieService
  ) { }

  ngOnInit(): void {
    console.log("🔥 ngOnInit ejecutado");
    this.spinner.spinnerOnOff();

    this.getNotificaciones();

  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Justo ahora';
    if (diffMinutes < 60) return `Hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;

    // Si es mayor a 7 días, mostramos fecha completa en AM/PM
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
  }
  reload() {
    this.spinner.spinnerOnOff();
    this.Notificaciones = [];
    this.getNotificaciones();
  }
  markAllNotificationsAsRead() {
    const userId = this.cookieService.get('userId');
    this.userService.markAllNotificationsAsRead(userId).subscribe({
      next: (value: any) => {
        if (value.statusCode === 200) {
          console.log("notificaciones: ", this.Notificaciones)
          this.reload();
        } else {
          this.mytoastr.showError('Intentelo luego', '');
        }
      }
    })
  }

  onChangeStatus(notificacion: any) {
    if (notificacion.status !== 'leido') {
      this.changeStatus(notificacion.PK);
    }
  }

  changeStatus(pk: any) {
    this.userService.changeNotificacion(pk).subscribe({
      next: (value: any) => {
        if (value.statusCode === 200) {
          console.log("notificaciones: ", this.Notificaciones)
          const index = this.Notificaciones.findIndex(n => n.PK === pk);
          console.log("index", index)
          if (index !== -1) {
            this.Notificaciones = [
              ...this.Notificaciones.slice(0, index),
              { ...this.Notificaciones[index], status: 'leido' },
              ...this.Notificaciones.slice(index + 1)
            ];
            this.cdr.detectChanges(); // fuerza actualización de la UI
          }
        } else {
          this.mytoastr.showError('Intentelo luego', '');
        }
      },
      error: () => {
        this.mytoastr.showError('Error en la actualización', '');
      }
    });
  }

  getNotificaciones() {
    this.userService.getNotificaciones().subscribe({
      next: (value: any) => {
        const items = Array.isArray(value.data?.Items)
          ? value.data.Items
          : (value.data?.Items?.Items || []);

        // Ordenar por fecha descendente (más recientes primero)
        items.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Formatear fecha si lo deseas
        this.Notificaciones = items.map((item: any) => ({
          ...item,
          date: this.formatDateTime(item.date)
        }));

        console.log("✅ Notificaciones cargadas y ordenadas:", this.Notificaciones);
        this.spinner.spinnerOnOff();

      }, error: (err) => {
        console.error("❌ Error al obtener notificaciones:", err);
      }
    });
  }
}
