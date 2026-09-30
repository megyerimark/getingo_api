import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PortfolioProject } from '../../core/models/portfolio.model';
import { ProjectService } from '../../services/project';

@Component({
  selector: 'app-portfolio',
  imports: [RouterLink],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.scss'
})
export class Portfolio implements OnInit {
  projects: PortfolioProject[] = [];
  loading = true;
  error = '';

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    this.projectService.getPortfolio().subscribe({
      next: response => {
        this.projects = response.projects;
        this.loading = false;
      },
      error: () => {
        this.error = 'A portfólió most nem tölthető be.';
        this.loading = false;
      }
    });
  }

  previewDocument(project: PortfolioProject): string {
    const safeCss = (project.css_code ?? '').replace(/<\/style/gi, '<\\/style');
    const safeJs = (project.javascript_code ?? '').replace(/<\/script/gi, '<\\/script');

    return `<!doctype html>
<html lang="hu">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none';">
  <style>
    body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #172033; background: #fff; }
    ${safeCss}
  </style>
</head>
<body>
  ${project.html_code ?? ''}
  <script>
    try { ${safeJs} } catch (error) { console.error(error); }
  <\/script>
</body>
</html>`;
  }

  completedDate(value: string): string {
    return new Intl.DateTimeFormat('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(value));
  }
}
