import { Component, Input, Output, OnInit, AfterViewInit, ViewChild, EventEmitter, ChangeDetectorRef, ElementRef, OnChanges, SimpleChanges, Inject } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CommonModule, formatDate } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { IconTypeComponent } from './../icons_type/icons_type.component'

@Component({
  selector: 'uni-dynamic-table',
  templateUrl: './dynamic-table.component.html',
  styleUrls: ['./dynamic-table.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    MatIconModule,
    MatMenuModule,
    MatTabsModule,
    MatTableModule,
    MatCheckboxModule,
    MatSortModule,
    MatPaginatorModule,
    MatCardModule,
    MatButtonModule,
    MatTooltipModule,
    IconTypeComponent,
  ],
})

export class DynamicTableComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() columns: TableColumn[] = [];
  @Input() data: TableRow[] = [];
  @Input() actionsOptions?: boolean;
  @Input() element_id?: string | string[];
  @Input() pageKey: string | any;
  @Input() lengthTable: number = 0;
  @Input() refreshFunction!: () => void;
  @Input()
  alwaysShowHeaderOptions: boolean = false;

  //------------
  @Input() customExportFunction: ((fileType: 'xlsx' | 'csv') => void) | null = null;
  //------------

  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() selectedIdsChange = new EventEmitter<TableRow[]>();
  @Output() selectedChange = new EventEmitter<TableRow[]>();
  @Output() cellClick: EventEmitter<string> = new EventEmitter<string>();
  @Output() clickButtonEvent = new EventEmitter<any>();

  //------------------------
  @Output() exportRequest = new EventEmitter<'xlsx' | 'csv'>();
  //------------------------

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort!: MatSort;
  @ViewChild('table') element: ElementRef | undefined;

  public displayedColumns: string[] = [];
  public attributeNames: string[] = [];
  public dataSource: MatTableDataSource<TableRow> = new MatTableDataSource<TableRow>([]);
  public dataPrint: MatTableDataSource<TableRow> = new MatTableDataSource<TableRow>([]);
  public selection = new SelectionModel<TableRow>(true, []);
  public headerOptions: boolean = false;
  public obs!: Observable<TableRow[]>;
  public selectedTab: string = 'tab1';
  public styleString: string = '';
  public isLoadingResults = true; //Revisar
  public selectedIds: any = [];
  public currentEventPage: PageEvent = new PageEvent;
  public isCheckedClass: string | undefined;
  public pageSize = 5;
  public paginatorLength: number = 0;
  public dataCurrent: boolean = false;
  public previousDataLength = 0;

  constructor(private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly http: HttpClient,
    @Inject(MatPaginatorIntl) private readonly paginatorIntl: MatPaginatorIntl) {
    this.paginatorIntl.itemsPerPageLabel = 'Elementos por página';
  }

  ngOnInit(): void {
    this.displayedColumns = this.columns.map(column => column.name);
    this.attributeNames = this.columns.map(column => column.attribute);
    this.dataSource = new MatTableDataSource(this.data);
    this.dataPrint = new MatTableDataSource(this.data);
    this.selectedTab = this.selectedTab.toLowerCase();
  }

  ngAfterViewInit(): void {
    this.initTable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['pageKey']) {
      // Actualiza el dataSource si los datos han cambiado
      if (changes['data']) {
        this.dataSource.data = this.data;
        this.dataPrint.data = this.data;
      }

      setTimeout(() => {
        if (this.paginator) {
          this.paginator.length = this.lengthTable;
          this.changeDetectorRef.detectChanges();
        }
      });
      // Iniciar o reiniciar la tabla
      this.initTable();

    }

    if (changes['columns']) {
      // Actualizamos las columnas visibles y los atributos de las columnas cuando cambien
      this.displayedColumns = this.columns.map(column => column.name);
      this.attributeNames = this.columns.map(column => column.attribute);
    }
  }

  initTable() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.obs = this.dataSource.connect();
  }

  updateSort(callback?: () => void) {
    this.changeDetectorRef.detectChanges();
    this.displayedColumns = this.columns.map(column => column.name);
    this.attributeNames = this.columns.map(column => column.attribute);
    this.dataSource.data = this.data;
    this.initTable();
    callback?.();
  }

  get displayedColumnsWithSelect(): string[] {
    if (this.actionsOptions) {
      return ['select', ...this.displayedColumns];
    }
    return this.displayedColumns;
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      this.getSelectedIds();
    } else {
      this.selection.select(...this.dataSource.data);
      this.getSelectedIds();
    }
  }

  clearSelection() { //Limpieza de elecciones despues de cada add, edit O...
    this.selectedIds = [];
    this.selection.clear();
    this.selectedIdsChange.emit(this.selectedIds);
    this.headerOptions = false;
  }

  checkboxLabel(row?: TableRow): string {
    if (!row) {
      if (this.isAllSelected()) {
        return 'deselect all';
      } else {
        return 'select all';
      }
    }

    const pos = row['position'] as number | undefined;
    if (this.selection.isSelected(row)) {
      return `deselect row ${pos !== undefined ? pos + 1 : ''}`;
    } else {
      return `select row ${pos !== undefined ? pos + 1 : ''}`;
    }
  }


  getSelectedIds() {
    // Verificar que `element_id` está definido
    if (!this.element_id) {
      return;
    }

    if (this.element_id === 'ALL') {
      this.selectedIds = this.selection.selected;
    }
    // Si `element_id` es un string, manejarlo como un solo campo
    else if (typeof this.element_id === 'string') {
      this.selectedIds = this.selection.selected.map(row => row[this.element_id!.toString()]);
    }
    // Si `element_id` es un array de strings, extraer múltiples campos
    else if (Array.isArray(this.element_id)) {
      const element: string[] = this.element_id
      this.selectedIds = this.selection.selected.map(row => {
        const result: { [key: string]: string | number | boolean | Date | undefined } = {};
        element.forEach(field => {
          if (row[field]) {
            result[field] = row[field];  // Extraer el valor de cada campo
          }
        });
        return result;
      });
    } else {
      return;
    }

    // Activar o desactivar opciones del encabezado según el resultado
    this.headerOptions = this.selectedIds.length !== 0;

    // Emitir los IDs seleccionados
    this.selectedIdsChange.emit(this.selectedIds);
    this.selectedChange.emit(this.selection.selected);
  }

  onSelectionChange() {
    this.updateSort();
  }

  onPageChange(event: PageEvent) {
    const from = event.pageIndex * event.pageSize; // 1 * 5 = 5
    const to = from + event.pageSize;              // 5 + 5 = 10
    if (from < event.length) {
      this.pageChange.emit(event);
    } else {
    }

    this.pageSize = event.pageSize;
  }

  onCellClick(value: string) {
    this.cellClick.emit(value);  // Emitir el valor clicado al componente padre
  }

  print() {
    if (this.element) {
      const tableElement = this.element.nativeElement.querySelector('table');
      const clonedTable = tableElement.cloneNode(true) as HTMLElement;
      const styles = this.componentStyles();
      const date = formatDate(new Date(), 'dd-MM-yyyy', 'en-US');
      const printWindow = window.open('', '', 'width=800,height=600');

      if (printWindow) {
        // Abrir el documento antes de escribir
        printWindow.document.open();
        printWindow.document.write(`
        <html>
          <head>
            <title>Imprimir tabla</title>
            <style>${styles}</style>
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body>
            <div>
              Información actualizada al: ${date}
            </div>
            ${clonedTable.outerHTML}
          </body>
        </html>
      `);
        printWindow.document.close(); // Importante cerrar después de escribir

        printWindow.focus();
        printWindow.print();

        setTimeout(() => {
          if (!printWindow.closed) {
            printWindow.close();
          }
        }, 1000);
      }
    }
  }

  onClickButton(value: any, element: any) {
    const event = {
      value,
      element
    }
    this.clickButtonEvent.emit(event)
  }

  getStyles() {
    this.http.get('../dynamic-table/dynamic-table.component.scss', { responseType: 'text' }).subscribe(
      styleSheet => {
        this.styleString = styleSheet;
      },
    );
  }

  componentStyles(): string {
    let styles = '';
    const styleElements = document.querySelectorAll('style');
    styleElements.forEach((styleElement) => {
      styles += styleElement.textContent;
    });
    return styles;
  }

  formatDate(date: string | number | Date | any, format: string, locale: string) {
    if (!date) {
      return '';
    }
    return formatDate(date, format, locale);
  }

  //------------
  exportExcel() {
    if (this.customExportFunction) {
      this.customExportFunction('xlsx');
    }
  }

  exportCsv() {

    if (this.customExportFunction) {
      this.customExportFunction('csv');
    }
  }
}
export interface TableColumn {
  name: string;
  attribute: string;
  config?: {
    formatDate?: {
      format?: string;
      locale?: string;
    };
    style?: string;
    styleClass?: string;
    coloricon?: string;
    renderIcon?: string;
    clickable?: string;
    icon?: string;
    type?: string;
    actions?: [{
      bgClass?: string,
      toolTip?: string,
      icon?: string,
      value?: string
    }]
  };
  style?: string;
  styleClass?: string;
}
export interface TableRow {
  [key: string]: string | number | Date | boolean | undefined;
}