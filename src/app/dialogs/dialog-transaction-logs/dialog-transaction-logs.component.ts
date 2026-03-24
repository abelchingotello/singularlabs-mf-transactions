import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TransactionService } from '../../services/transaction.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { MytoastrService } from 'src/app/services/mytoastr';

@Component({
  selector: 'app-dialog-transaction-logs',
  templateUrl: './dialog-transaction-logs.component.html',
  styleUrls: ['./dialog-transaction-logs.component.scss']
})
export class DialogTransactionLogsComponent implements OnInit {

  constructor(
    private readonly TransactionService: TransactionService,
    public dialogRef: MatDialogRef<DialogTransactionLogsComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: DialogData,
    private readonly mytoastr: MytoastrService,
  ) { }
  public renderTabs = true;
  public logs: any;
  public hasLogs: 'process' | 'complete' | 'empty' = 'process';
  public showLog: any;
  public activeSteeep: 'PAY' | 'CONSULT' | 'SIMULATION' | 'EXTORN' = 'PAY';
  public steeps: { key: 'PAY' | 'CONSULT' | 'SIMULATION' | 'EXTORN', label: string }[] = [
    { key: 'CONSULT', label: 'Consulta' },
    { key: 'SIMULATION', label: 'Simulación' },
    { key: 'PAY', label: 'Pago' },
    { key: 'EXTORN', label: 'Extorno' },
  ];
  // Tabs por steep
  public tabsBySteeep: Record<string, { key: string, label: string, icon: string }[]> = {
    PAY: [
      { key: 'recaudador_request', label: 'Evento Recibido', icon: 'person' },
      { key: 'proveedor_request', label: 'Request Enviado', icon: 'apps' },
      { key: 'proveedor_response', label: 'Response Proveedor', icon: 'sync_alt' },
      { key: 'recaudador_response', label: 'Respuesta Final', icon: 'check_circle' },
    ],
    CONSULT: [
      { key: 'recaudador_request', label: 'Evento Recibido', icon: 'person' },
      { key: 'proveedor_request', label: 'Request Enviado', icon: 'apps' },
      { key: 'proveedor_response', label: 'Response Proveedor', icon: 'sync_alt' },
      { key: 'recaudador_response', label: 'Respuesta Final', icon: 'check_circle' },
    ],
    SIMULATION: [
      { key: 'recaudador_request', label: 'Evento Recibido', icon: 'person' },
      { key: 'proveedor_request', label: 'Request Enviado', icon: 'apps' },
      { key: 'proveedor_response', label: 'Response Proveedor', icon: 'sync_alt' },
      { key: 'recaudador_response', label: 'Respuesta Final', icon: 'check_circle' },
    ],
    EXTORN: [
      { key: 'recaudador_request', label: 'Evento Recibido', icon: 'person' },
      { key: 'proveedor_request', label: 'Request Enviado', icon: 'apps' },
      { key: 'proveedor_response', label: 'Response Proveedor', icon: 'sync_alt' },
      { key: 'recaudador_response', label: 'Respuesta Final', icon: 'check_circle' },
    ],
  };

  get currentTabs() {
    return this.tabsBySteeep[this.activeSteeep].filter(t => this.logs?.[this.activeSteeep]?.[t.key]);
  }

  ngOnInit(): void {
    this.getLogs();
  }

  getLogs(): void {
    this.TransactionService.getLogsTransaction(this.data.pk).subscribe({
      next: ({ data: { Items }, ...value }) => {
        if (value.statusCode === 200) {
          if (Items && Object.keys(Items ?? {}).length > 0 && (Items.PAY || Items.EXTORN)) {
            this.hasLogs = 'complete';
            this.logs = Items;
            this.setDefaultSteeep();
          } else {
            this.hasLogs = 'empty';
          }
        }
      },
      error: (err) => console.log('error:', err),
    });
  }

  reload() {
    this.hasLogs = "process"
    this.getLogs()
  }

  setDefaultSteeep(): void {
    // Activa el primer steep que tenga datos
    const found = this.steeps.find(s => this.logs?.[s.key] && Object.keys(this.logs[s.key]).length > 0);
    if (found) {
      this.activeSteeep = found.key as any;
      this.setFirstLog();
    }
  }

  onSteeepChange(key: 'PAY' | 'CONSULT' | 'SIMULATION' | 'EXTORN'): void {
    this.activeSteeep = key;
    this.setFirstLog();
  }

  setFirstLog(): void {
    const first = this.currentTabs[0];
    this.showLog = first ? this.logs?.[this.activeSteeep]?.[first.key] : null;
    this.renderTabs = false;
    setTimeout(() => this.renderTabs = true, 0);
  }

  onTabChange(event: any): void {
    const tab = this.currentTabs[event.index];
    this.showLog = tab ? this.logs?.[this.activeSteeep]?.[tab.key] : null;
  }

  copyActive(copy: any): void {
    const text = typeof copy === 'string' ? copy : JSON.stringify(copy, null, 2);
    navigator.clipboard.writeText(text);
    this.mytoastr.showInfo('Copiado al portapapeles', '  ');
  }

  closedialog() { this.dialogRef.close(); }

  highlightJson(data: any): string {
    const json = JSON.stringify(data, null, 2);
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?([eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'json-number';
        if (/^"/.test(match)) cls = /:$/.test(match) ? 'json-key' : 'json-string';
        else if (/true|false/.test(match)) cls = 'json-boolean';
        else if (/null/.test(match)) cls = 'json-null';
        return `<span class="${cls}">${match}</span>`;
      }
    );
  }

  formatXml(xml: string): string {
    let formatted = '';
    let indent = 0;
    const tab = '  ';
    xml.replace(/>\s*</g, '>\n<').split('\n').forEach(node => {
      const isClosing = node.match(/^<\/\w/);
      const isSelfContained = node.match(/^<\w[^>]*>.*<\/\w[^>]*>/); // ej: <FechaPago>20260320</FechaPago>
      const isSelfClosing = node.match(/<.*\/>/);
      const isOpening = node.match(/^<\w[^>]*[^\/]>/) && !isSelfContained && !isSelfClosing;

      if (isClosing) indent--;
      formatted += tab.repeat(Math.max(indent, 0)) + node.trim() + '\n';
      if (isOpening) indent++;
    });
    return formatted.trim();
  }

  renderLog(data: any): string {
    if (!data) return '';

    // Es string XML directo
    if (typeof data === 'string') {
      return this.isXml(data)
        ? this.highlightXml(this.formatXml(data))
        : this.highlightJson(data);
    }

    // Es objeto con data XML dentro
    if (typeof data === 'object' && typeof data.data === 'string' && this.isXml(data.data)) {
      const { data: xmlData, ...rest } = data;
      const jsonStr = this.highlightJson(rest);
      const xmlStr = this.highlightXml(this.formatXml(xmlData));
      // Quita el último } y agrega el data XML
      return jsonStr.replace(/\}$/, '') +
        `  <span class="json-key">"data"</span>: \n${xmlStr}\n}`;
    }

    // Objeto normal
    return this.highlightJson(data);
  }

  isXml(data: any): boolean {
    return typeof data === 'string' && data.trim().startsWith('<');
  }

  highlightXml(xml: string): string {
    return xml
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/(&lt;\/?[\w:\-]+)(.*?)(&gt;)/g, (_, open, attrs, close) => {
        const coloredAttrs = attrs.replace(/([\w:\-]+)="([^"]*)"/g,
          '<span class="xml-attr">$1</span>=<span class="xml-string">"$2"</span>');
        return `<span class="xml-tag">${open}${coloredAttrs}${close}</span>`;
      })
      .replace(/(&gt;)([^&<]+)(&lt;)/g,
        (_, open, content, close) =>
          `${open}<span class="xml-value">${content}</span>${close}`
      );
  }
}

/**
 * Datos que recibe el diálogo al inicializarse.
 */
export interface DialogData {
  pk: string;
}
