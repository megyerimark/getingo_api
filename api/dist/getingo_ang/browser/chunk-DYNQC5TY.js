import{a as x}from"./chunk-2UYHUBW7.js";import{$a as s,Ha as b,O as m,Ra as g,S as d,Sa as v,Sb as E,Y as c,Z as l,ab as o,bb as h,cb as u,hb as p,ib as y,kb as C,lb as w,mb as _,qb as a,ua as f}from"./chunk-W3C6Y7KB.js";var F=["previewFrame"];function P(n,t){if(n&1){let e=u();s(0,"button",8),p("click",function(){c(e);let r=y();return l(r.clear())}),a(1," T\xF6rl\xE9s "),o()}}var O=class n{html="";css="";javascript="";previewFrame;hasRun=!1;run(){this.previewFrame&&(this.previewFrame.nativeElement.srcdoc=this.buildDocument(),this.hasRun=!0)}clear(){this.previewFrame&&(this.previewFrame.nativeElement.srcdoc="",this.hasRun=!1)}buildDocument(){let t=this.css.replace(/<\/style/gi,"<\\/style"),e=this.javascript.replace(/<\/script/gi,"<\\/script");return`
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

        ${t}
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
        ${e}
      <\/script>
    </body>
    </html>
  `}static \u0275fac=function(e){return new(e||n)};static \u0275cmp=b({type:n,selectors:[["app-code-runner"]],viewQuery:function(e,i){if(e&1&&C(F,5),e&2){let r;w(r=_())&&(i.previewFrame=r.first)}},inputs:{html:"html",css:"css",javascript:"javascript"},decls:10,vars:1,consts:[["previewFrame",""],[1,"runner"],[1,"runner-toolbar"],[1,"runner-title"],[1,"runner-actions"],["type","button",1,"btn","btn-success","btn-sm",3,"click"],["type","button",1,"btn","btn-outline-secondary","btn-sm"],["title","K\xF3d eredm\xE9nye","sandbox","allow-scripts",1,"preview-frame"],["type","button",1,"btn","btn-outline-secondary","btn-sm",3,"click"]],template:function(e,i){if(e&1){let r=u();s(0,"div",1)(1,"div",2)(2,"span",3),a(3,"Eredm\xE9ny"),o(),s(4,"div",4)(5,"button",5),p("click",function(){return c(r),l(i.run())}),a(6," \u25B6 Futtat\xE1s "),o(),g(7,P,2,0,"button",6),o()(),h(8,"iframe",7,0),o()}e&2&&(f(7),v(i.hasRun?7:-1))},styles:[".runner[_ngcontent-%COMP%]{overflow:hidden;border-top:1px solid rgba(255,255,255,.06);background:#fff}.runner-toolbar[_ngcontent-%COMP%]{min-height:48px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 13px;background:#0b203d;color:#fff}.runner-title[_ngcontent-%COMP%]{color:#b8c9e1;font-size:.78rem;font-weight:800}.runner-actions[_ngcontent-%COMP%]{display:flex;gap:8px}.runner-actions[_ngcontent-%COMP%]   .btn-success[_ngcontent-%COMP%]{border-color:#1677ff;background:#1677ff}.runner-actions[_ngcontent-%COMP%]   .btn-outline-secondary[_ngcontent-%COMP%]{border-color:#ffffff2e;color:#b9c9df}.runner-actions[_ngcontent-%COMP%]   .btn-outline-secondary[_ngcontent-%COMP%]:hover{background:#ffffff14;color:#fff}.preview-frame[_ngcontent-%COMP%]{display:block;width:100%;min-height:260px;border:0;background:#fff}@media(max-width:600px){.runner-toolbar[_ngcontent-%COMP%]{align-items:stretch;flex-direction:column}}"]})};var M=class n{constructor(t){this.http=t}http;apiUrl=x.apiUrl;getByCategory(t){return this.http.get(`${this.apiUrl}/categories/${t}/lessons`)}getCurriculum(t){return this.http.get(`${this.apiUrl}/categories/${t}/curriculum`)}static \u0275fac=function(e){return new(e||n)(d(E))};static \u0275prov=m({token:n,factory:n.\u0275fac,providedIn:"root"})};export{O as a,M as b};
