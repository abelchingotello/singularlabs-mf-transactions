import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TransactionService } from '../../services/transaction.service';
import { MytoastrService } from 'src/app/services/mytoastr';

export interface DialogData { pk: string; }

type StepKey = 'PAY' | 'CONSULT' | 'SIMULATION' | 'EXTORN';
type HasLogs = 'process' | 'complete' | 'empty';
type TabConfig = { key: string; label: string; icon: string };

const DEFAULT_TABS: TabConfig[] = [
  { key: 'recaudador_request', label: 'Evento Recibido', icon: 'person' },
  { key: 'proveedor_request', label: 'Request Enviado', icon: 'apps' },
  { key: 'proveedor_response', label: 'Response Proveedor', icon: 'sync_alt' },
  { key: 'recaudador_response', label: 'Respuesta Final', icon: 'check_circle' },
];

const STEPS: { key: StepKey; label: string }[] = [
  { key: 'CONSULT', label: 'Consulta' },
  { key: 'SIMULATION', label: 'Simulación' },
  { key: 'PAY', label: 'Pago' },
  { key: 'EXTORN', label: 'Extorno' },
];

const TABS_BY_STEP: Record<StepKey, TabConfig[]> = {
  PAY: DEFAULT_TABS,
  CONSULT: DEFAULT_TABS,
  SIMULATION: DEFAULT_TABS,
  EXTORN: DEFAULT_TABS,
};

const fmt = (data: any): string | null => {
  if (!data) return null;
  return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
};

const section = (condition: any, header: string, line: string): string[] =>
  condition ? [header, '', line, ''] : [];

const cwLine = (log: any, label: string, value: string): string => {
  if (!log) return value;
  const utc = new Date(log.log_date);
  const local = new Date(utc.getTime() + (-5 * 60 * 60 * 1000));
  const toIso = (d: Date, offset: string) => d.toISOString().replace('Z', offset);
  return [
    toIso(local, '-05:00'),
    `${toIso(utc, 'Z')}\t${log.log_id}\tINFO\t${label}: ${value}`,
  ].join('\n');
};

@Component({
  selector: 'app-dialog-transaction-logs',
  templateUrl: './dialog-transaction-logs.component.html',
  styleUrls: ['./dialog-transaction-logs.component.scss'],
})
export class DialogTransactionLogsComponent implements OnInit {

  constructor(
    private readonly TransactionService: TransactionService,
    public dialogRef: MatDialogRef<DialogTransactionLogsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private readonly mytoastr: MytoastrService,
  ) { }

  public renderTabs = true;
  public logs: any;
  public hasLogs: HasLogs = 'process';
  public showLog: any;
  public activeSteeep: StepKey = 'PAY';

  // Expone las constantes al template
  public readonly steeps = STEPS;
  public readonly tabsBySteeep = TABS_BY_STEP;

  get currentTabs(): TabConfig[] {
    return this.tabsBySteeep[this.activeSteeep]
      .filter(t => this.logs?.[this.activeSteeep]?.[t.key]);
  }

  ngOnInit(): void { this.getLogs(); }

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

  reload(): void {
    this.hasLogs = 'process';
    this.getLogs();
  }

  setDefaultSteeep(): void {
    const found = this.steeps.find(s => this.logs?.[s.key] && Object.keys(this.logs[s.key]).length > 0);
    if (found) {
      this.activeSteeep = found.key;
      this.setFirstLog();
    }
  }

  onSteeepChange(key: StepKey): void {
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

  closedialog(): void { this.dialogRef.close(); }

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
      const isSelfContained = node.match(/^<\w[^>]*>.*<\/\w[^>]*>/);
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

    if (typeof data === 'string') {
      return this.isXml(data)
        ? this.highlightXml(this.formatXml(data))
        : this.highlightJson(data);
    }

    if (typeof data === 'object' && typeof data.data === 'string' && this.isXml(data.data)) {
      const { data: xmlData, ...rest } = data;
      const jsonStr = this.highlightJson(rest);
      const xmlStr = this.highlightXml(this.formatXml(xmlData));
      return jsonStr.replace(/\}$/, '') +
        `  <span class="json-key">"data"</span>: \n${xmlStr}\n}`;
    }

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

  generateTxt(): void {
    const step = this.activeSteeep;
    const logs = this.logs?.[step];
    if (!logs) return;

    const provReq = logs['proveedor_request'];
    const provRes = logs['proveedor_response'];
    if (!provReq) return;

    const url = provReq?.log_url;
    const req = Object.keys(provReq?.log_data ?? {}).length > 0 ? fmt(provReq?.log_data) : null;
    const status = fmt(provRes?.log_data?.statusCode);
    const { statusCode: _, ...logData } = provRes?.log_data ?? {};
    const data = fmt(logData);

    const rawDate = provReq?.log_date ?? provRes?.log_date;
    const ts = new Date(rawDate).toISOString().replace(/[-:T]/g, '').slice(0, 12);
    const typelog = provReq?.log_type.toLowerCase();

    const content = [
      ...section(url, `///////////////////// URL //////////////////////`, cwLine(provReq, 'Service URL', url!)),
      ...section(req, `//////////////////// REQUEST ///////////////////`, cwLine(provReq, 'Request', req!)),
      ...section(status, `//////////////////// STATUS ////////////////////`, cwLine(provRes, 'Response Status', status!)),
      ...section(data, `///////////////////// DATA /////////////////////`, cwLine(provRes, 'Data', data!)),
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `logs_${ts}_${typelog}_${step.toLowerCase()}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
    this.mytoastr.showInfo('Archivo generado', ' ');
  }
}