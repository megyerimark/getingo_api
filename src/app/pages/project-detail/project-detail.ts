import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  Project,
  ProjectCheckResponse,
  ProjectWorkspacePayload
} from '../../core/models/project.model';
import { ProjectService } from '../../services/project';

type EditorTab = 'html' | 'css' | 'javascript' | 'console';
type MentorTone = 'idle' | 'tip' | 'warning' | 'success';

interface RunnerMessage {
  source: 'getingo-project-runner';
  token: string;
  projectId: number;
  output: string[];
  done: boolean;
}

@Component({
  selector: 'app-project-detail',
  imports: [FormsModule, RouterLink],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss'
})
export class ProjectDetail implements OnInit {
  @ViewChild('previewFrame') previewFrame?: ElementRef<HTMLIFrameElement>;

  project: Project | null = null;
  loading = true;
  error = '';

  activeTab: EditorTab = 'javascript';
  htmlCode = '';
  cssCode = '';
  javascriptCode = '';
  consoleOutput: string[] = [];

  savedMessage = '';
  checkMessage = '';
  checkPassed: boolean | null = null;
  saving = false;
  running = false;
  checking = false;

  mentorOpen = false;
  mentorHint = 'Futtasd a kódot, majd kérj segítséget. A Mentor nem adja oda a kész megoldást, hanem rávezet a hibára.';
  mentorTone: MentorTone = 'idle';
  mentorAnalyzing = false;

  private pendingCheck = false;
  private pendingMentor = false;
  private runnerToken = '';

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.error = 'Érvénytelen projektazonosító.';
      this.loading = false;
      return;
    }

    this.projectService.getById(id).subscribe({
      next: response => {
        this.project = response.project;
        const submission = response.submission;

        this.htmlCode = submission?.html_code ?? response.project.starter_html ?? '';
        this.cssCode = submission?.css_code ?? response.project.starter_css ?? '';
        this.javascriptCode = submission?.javascript_code ?? response.project.starter_javascript ?? '';

        if (this.javascriptCode.trim()) {
          this.activeTab = 'javascript';
        } else if (this.htmlCode.trim()) {
          this.activeTab = 'html';
        } else if (this.cssCode.trim()) {
          this.activeTab = 'css';
        }

        this.loading = false;
        setTimeout(() => this.runProject(), 0);
      },
      error: () => {
        this.error = 'A projekt nem található vagy most nem tölthető be.';
        this.loading = false;
      }
    });
  }

  setTab(tab: EditorTab): void {
    this.activeTab = tab;
  }

  saveWorkspace(): void {
    if (!this.project || this.saving) return;

    this.saving = true;
    this.savedMessage = '';

    this.projectService.saveWorkspace(this.project.id, this.workspacePayload()).subscribe({
      next: response => {
        this.savedMessage = response.message;
        this.saving = false;
      },
      error: () => {
        this.savedMessage = 'A mentés most nem sikerült. Próbáld újra.';
        this.saving = false;
      }
    });
  }

  runProject(checkAfterRun = false, mentorAfterRun = false): void {
    if (!this.project || !this.previewFrame) return;

    this.runnerToken = this.createRunnerToken();
    this.pendingCheck = checkAfterRun;
    this.pendingMentor = mentorAfterRun;
    this.consoleOutput = [];
    this.checkMessage = checkAfterRun ? 'A megoldás futtatása és ellenőrzése...' : '';
    this.checkPassed = null;
    this.running = true;

    this.previewFrame.nativeElement.srcdoc = this.buildPreviewDocument(
      this.project.id,
      this.runnerToken
    );
  }

  checkProject(): void {
    if (!this.project || this.checking) return;

    if (!this.project.validation_configured) {
      this.checkPassed = false;
      this.checkMessage = 'Ehhez a projekthez az adminnak még be kell állítania az ellenőrzést.';
      return;
    }

    this.checking = true;
    this.runProject(true);
  }

  askMentor(): void {
    if (!this.project || this.running) return;

    this.mentorOpen = true;
    this.mentorAnalyzing = true;
    this.mentorTone = 'idle';
    this.mentorHint = 'Átnézem a futási eredményt és keresek egy olyan nyomot, ami közelebb visz a megoldáshoz...';
    this.runProject(false, true);
  }

  resetToStarter(): void {
    if (!this.project) return;
    if (!confirm('Visszaállítod a szerkesztőt az admin által megadott kezdőkódra?')) return;

    this.htmlCode = this.project.starter_html ?? '';
    this.cssCode = this.project.starter_css ?? '';
    this.javascriptCode = this.project.starter_javascript ?? '';
    this.consoleOutput = [];
    this.checkMessage = '';
    this.checkPassed = null;
    this.mentorTone = 'idle';
    this.mentorHint = 'A kezdőkód visszaállt. Futtasd, majd ha elakadsz, kérdezd meg a Mentort.';
    this.runProject();
  }

  @HostListener('window:message', ['$event'])
  onRunnerMessage(event: MessageEvent<unknown>): void {
    if (!this.project || !this.isRunnerMessage(event.data)) return;

    const message = event.data;
    if (message.token !== this.runnerToken || message.projectId !== this.project.id) return;

    this.consoleOutput = message.output;

    if (!message.done) return;

    this.running = false;

    if (this.pendingMentor) {
      this.pendingMentor = false;
      this.mentorAnalyzing = false;
      this.generateMentorHint();
    }

    if (this.pendingCheck) {
      this.pendingCheck = false;
      this.sendCheck();
    }
  }

  validationLabel(): string {
    return this.project?.validation_type === 'console_contains'
      ? 'Elvárt konzolsorok'
      : 'Pontos konzolkimenet';
  }

  mentorIcon(): string {
    if (this.mentorTone === 'warning') return 'bi-exclamation-triangle-fill';
    if (this.mentorTone === 'success') return 'bi-check-circle-fill';
    if (this.mentorTone === 'tip') return 'bi-lightbulb-fill';
    return 'bi-stars';
  }

  private sendCheck(): void {
    if (!this.project) return;

    this.projectService.check(this.project.id, {
      ...this.workspacePayload(),
      console_output: this.consoleOutput
    }).subscribe({
      next: response => this.handleCheckResponse(response),
      error: error => {
        const validationMessage = error?.error?.errors?.project?.[0];
        this.checkPassed = false;
        this.checkMessage = validationMessage ?? error?.error?.message ?? 'Az ellenőrzés most nem sikerült.';
        this.checking = false;
      }
    });
  }

  private handleCheckResponse(response: ProjectCheckResponse): void {
    this.checkPassed = response.passed;
    this.checkMessage = response.message;
    this.checking = false;

    if (response.passed && this.project) {
      this.project.is_completed = true;
      this.mentorOpen = true;
      this.mentorTone = 'success';
      this.mentorHint = response.already_completed
        ? 'A megoldás továbbra is átmegy az ellenőrzésen. Most már próbáld meg egyszerűsíteni vagy szebben strukturálni a kódot.'
        : 'Sikerült. Nézd meg, melyik gondolat volt a kulcs, mert ezt a mintát később más feladatoknál is használni fogod.';
      return;
    }

    if (!response.passed) {
      this.mentorOpen = true;
      this.generateMentorHint(true);
    }
  }

  private generateMentorHint(validationFailed = false): void {
    const errorLine = this.consoleOutput.find(line => line.startsWith('HIBA:')) ?? '';
    const lowerError = errorLine.toLowerCase();
    const js = this.javascriptCode;
    const html = this.htmlCode;

    this.mentorOpen = true;

    if (!js.trim() && !html.trim()) {
      this.mentorTone = 'warning';
      this.mentorHint = 'A szerkesztő még üres. Indulj el a feladatleírás első konkrét lépésével, majd futtasd újra.';
      return;
    }

    if (lowerError.includes('is not defined')) {
      this.mentorTone = 'warning';
      this.mentorHint = 'A JavaScript egy olyan névre hivatkozik, amit nem talál. Ellenőrizd, hogy a változót létrehoztad-e a használata előtt, és pontosan ugyanúgy írtad-e a nevét.';
      return;
    }

    if (lowerError.includes('assignment to constant variable')) {
      this.mentorTone = 'warning';
      this.mentorHint = 'Egy const változónak új értéket próbálsz adni. Ha a feladat szerint később módosítani kell az értéket, gondold át, hogy inkább let legyen-e.';
      return;
    }

    if (
      lowerError.includes('unexpected token') ||
      lowerError.includes('unexpected end') ||
      lowerError.includes('missing') ||
      lowerError.includes('syntax')
    ) {
      this.mentorTone = 'warning';
      this.mentorHint = 'Szintaktikai hibának tűnik. Nézd végig a zárójeleket, idézőjeleket és kapcsos zárójeleket azon a részen, amit legutóbb módosítottál.';
      return;
    }

    if (lowerError.includes('cannot read properties of null') || lowerError.includes('cannot read property')) {
      this.mentorTone = 'warning';
      this.mentorHint = 'A kód valószínűleg olyan HTML-elemet keres, amit nem talált meg. Ellenőrizd az id/class nevet és azt, hogy az elem valóban szerepel-e a HTML-ben.';
      return;
    }

    if (errorLine) {
      this.mentorTone = 'warning';
      this.mentorHint = `A futás hibát jelzett: „${errorLine.replace(/^HIBA:\s*/i, '')}”. A hibaüzenet kulcsszavait keresd meg abban a sorban, amelyet legutóbb módosítottál.`;
      return;
    }

    if (!js.includes('console.log') && this.project?.validation_type?.startsWith('console')) {
      this.mentorTone = 'tip';
      this.mentorHint = 'Ez a projekt konzolkimenetet ellenőriz, de a JavaScriptben nem látok console.log() hívást. Nézd meg, mely értékeket kér kiírni a feladat.';
      return;
    }

    if (validationFailed) {
      this.mentorTone = 'tip';
      this.mentorHint = 'A program lefutott, tehát most inkább logikai eltérés van. Ellenőrizd a kiírt értékek sorrendjét, a felesleges console.log() sorokat és azt, hogy minden kért módosítás megtörtént-e.';
      return;
    }

    if (this.consoleOutput.length > 0) {
      this.mentorTone = 'success';
      this.mentorHint = 'A kód hibamentesen lefutott. Ha az ellenőrzés mégsem sikerül, a következő lépés a kimenet sorrendjének és a feladat pontos követelményeinek összevetése.';
      return;
    }

    this.mentorTone = 'tip';
    this.mentorHint = 'Nem látok futási hibát, de konzolkimenet sincs. Menj végig a feladaton lépésenként, és minden fontos köztes értéket írj ki ideiglenesen a konzolra.';
  }

  private workspacePayload(): ProjectWorkspacePayload {
    return {
      html_code: this.htmlCode,
      css_code: this.cssCode,
      javascript_code: this.javascriptCode
    };
  }

  private buildPreviewDocument(projectId: number, token: string): string {
    const safeCss = this.cssCode.replace(/<\/style/gi, '<\\/style');
    const safeJs = this.javascriptCode.replace(/<\/script/gi, '<\\/script');
    const tokenJson = JSON.stringify(token);

    return `<!doctype html>
<html lang="hu">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none';">
  <style>
    :root { color-scheme: light; }
    body { margin: 0; padding: 18px; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #172033; background: #ffffff; }
    ${safeCss}
  </style>
</head>
<body>
  ${this.htmlCode}
  <script>
    (() => {
      const output = [];
      const token = ${tokenJson};
      const formatValue = (value) => {
        if (typeof value === 'string') return value;
        try {
          const json = JSON.stringify(value);
          return json === undefined ? String(value) : json;
        } catch {
          return String(value);
        }
      };
      const send = (done = false) => {
        parent.postMessage({
          source: 'getingo-project-runner',
          token,
          projectId: ${projectId},
          output: [...output],
          done
        }, '*');
      };
      ['log', 'info', 'warn', 'error'].forEach((method) => {
        const original = console[method].bind(console);
        console[method] = (...args) => {
          output.push(args.map(formatValue).join(' '));
          original(...args);
          send(false);
        };
      });
      window.addEventListener('error', (event) => {
        output.push('HIBA: ' + event.message);
        send(false);
      });
      try {
        ${safeJs}
      } catch (error) {
        output.push('HIBA: ' + (error instanceof Error ? error.message : String(error)));
      }
      window.setTimeout(() => send(true), 180);
    })();
  <\/script>
</body>
</html>`;
  }

  private createRunnerToken(): string {
    if (globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private isRunnerMessage(value: unknown): value is RunnerMessage {
    if (!value || typeof value !== 'object') return false;

    const candidate = value as Partial<RunnerMessage>;
    return candidate.source === 'getingo-project-runner'
      && typeof candidate.token === 'string'
      && typeof candidate.projectId === 'number'
      && Array.isArray(candidate.output)
      && candidate.output.every(item => typeof item === 'string')
      && typeof candidate.done === 'boolean';
  }
}
