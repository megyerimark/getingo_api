import { Component, ElementRef, Input, ViewChild } from '@angular/core';

@Component({
  selector: 'app-code-runner',
  imports: [],
  templateUrl: './code-runner.html',
  styleUrl: './code-runner.scss'
})
export class CodeRunner {
  @Input() html = '';
  @Input() css = '';
  @Input() javascript = '';

  @ViewChild('previewFrame')
  previewFrame?: ElementRef<HTMLIFrameElement>;

  hasRun = false;

  run(): void {
    if (!this.previewFrame) return;

    this.previewFrame.nativeElement.srcdoc = this.buildDocument();
    this.hasRun = true;
  }

  clear(): void {
    if (!this.previewFrame) return;

    this.previewFrame.nativeElement.srcdoc = '';
    this.hasRun = false;
  }

 private buildDocument(): string {
  const safeCss = this.css.replace(/<\/style/gi, '<\\/style');
  const safeJavascript = this.javascript.replace(/<\/script/gi, '<\\/script');

  return `
    <!doctype html>
    <html lang="hu">
    <head>
      <meta charset="utf-8">

      <meta
        http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none';"
      >

      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          margin: 0;
        }

        #console-output {
          margin-top: 20px;
          padding: 15px;
          min-height: 60px;
          background: #1e1e1e;
          color: #f8f8f2;
          border-radius: 6px;
          white-space: pre-wrap;
          font-family: monospace;
        }

        #console-output:empty {
          display: none;
        }

        ${safeCss}
      </style>
    </head>

    <body>
      <div id="app">
        ${this.html}
      </div>

      <pre id="console-output"></pre>

      <script>
        const output = document.getElementById('console-output');

        function formatValue(value) {
          if (typeof value === 'object') {
            try {
              return JSON.stringify(value, null, 2);
            } catch {
              return String(value);
            }
          }

          return String(value);
        }

        function writeConsole(type, values) {
          const text = values
            .map(formatValue)
            .join(' ');

          output.textContent +=
            (type ? type + ': ' : '') +
            text +
            '\\n';
        }

        const originalLog = console.log.bind(console);
        const originalError = console.error.bind(console);
        const originalWarn = console.warn.bind(console);

        console.log = (...values) => {
          writeConsole('', values);
          originalLog(...values);
        };

        console.error = (...values) => {
          writeConsole('Error', values);
          originalError(...values);
        };

        console.warn = (...values) => {
          writeConsole('Warning', values);
          originalWarn(...values);
        };

        window.addEventListener('error', event => {
          writeConsole('Error', [event.message]);
        });
      <\/script>

      <script>
        ${safeJavascript}
      <\/script>
    </body>
    </html>
  `;
}
}