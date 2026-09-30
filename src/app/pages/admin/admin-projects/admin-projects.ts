import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminProject } from '../../../core/models/admin.model';
import { AdminService } from '../../../services/admin';

@Component({
  selector: 'app-admin-projects',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-projects.html'
})
export class AdminProjects implements OnInit {
  projects: AdminProject[] = [];
  editing: AdminProject | null = null;

  form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: Validators.required }),
    description: new FormControl('', { nonNullable: true, validators: Validators.required }),
    difficulty: new FormControl('kezdő', { nonNullable: true }),
    estimated_time: new FormControl(30, { nonNullable: true, validators: [Validators.min(1)] }),
    xp_reward: new FormControl(25, { nonNullable: true, validators: [Validators.min(0)] }),
    starter_html: new FormControl('', { nonNullable: true }),
    starter_css: new FormControl('', { nonNullable: true }),
    starter_javascript: new FormControl('', { nonNullable: true }),
    validation_type: new FormControl<'console_exact' | 'console_contains'>('console_exact', { nonNullable: true }),
    expected_output: new FormControl('', { nonNullable: true }),
    solution: new FormControl('', { nonNullable: true })
  });

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.adminService.getProjects().subscribe(p => this.projects = p);
  }

  save(): void {
    if (this.form.invalid) return;

    const data = this.form.getRawValue();

    const request = this.editing
      ? this.adminService.updateProject(this.editing.id, data)
      : this.adminService.createProject(data);

    request.subscribe(() => {
      this.reset();
      this.load();
    });
  }

  edit(project: AdminProject): void {
    this.editing = project;

    this.form.setValue({
      title: project.title,
      description: project.description,
      difficulty: project.difficulty,
      estimated_time: project.estimated_time,
      xp_reward: project.xp_reward ?? 25,
      starter_html: project.starter_html ?? '',
      starter_css: project.starter_css ?? '',
      starter_javascript: project.starter_javascript ?? '',
      validation_type: project.validation_type ?? 'console_exact',
      expected_output: project.expected_output ?? '',
      solution: project.solution ?? ''
    });
  }

  remove(id: number): void {
    if (!confirm('Biztosan törlöd a projektet?')) return;
    this.adminService.deleteProject(id).subscribe(() => this.load());
  }

  reset(): void {
    this.editing = null;

    this.form.reset({
      title: '',
      description: '',
      difficulty: 'kezdő',
      estimated_time: 30,
      xp_reward: 25,
      starter_html: '',
      starter_css: '',
      starter_javascript: '',
      validation_type: 'console_exact',
      expected_output: '',
      solution: ''
    });
  }
}
