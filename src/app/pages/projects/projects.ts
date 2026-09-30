import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../core/models/project.model';
import { ProjectService } from '../../services/project';

@Component({
  selector: 'app-projects',
  imports: [RouterLink],
  templateUrl: './projects.html',
  styleUrl: './projects.scss'
})
export class Projects implements OnInit {
  projects: Project[] = [];
  loading = true;
  error = '';

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    this.projectService.getAll().subscribe({
      next: projects => {
        this.projects = projects;
        this.loading = false;
      },
      error: () => {
        this.error = 'A projektek most nem tölthetők be.';
        this.loading = false;
      }
    });
  }

  difficultyLabel(value: string): string {
    const normalized = value.toLowerCase();
    if (normalized.includes('haladó')) return 'Haladó';
    if (normalized.includes('közep')) return 'Közepes';
    return 'Kezdő';
  }
}
