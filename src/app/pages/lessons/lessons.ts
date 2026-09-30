import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Lesson, LessonCurriculum, LessonSection } from '../../core/models/lesson.model';
import { LessonService } from '../../services/lesson';
import { Note, NoteService } from '../../services/note';
import { FavoriteService } from '../../services/favorite';
import { ProgressService } from '../../services/progress';
import { PersonalCodeService } from '../../services/personal-code';
import { Auth } from '../../services/auth';
import { CodeRunner } from '../../shared/code-runner/code-runner';
import { LessonQuiz } from '../../shared/lesson-quiz/lesson-quiz';

@Component({
  selector: 'app-lessons',
  imports: [ReactiveFormsModule, RouterLink, CodeRunner, LessonQuiz],
  templateUrl: './lessons.html',
  styleUrl: './lessons.scss'
})
export class Lessons implements OnInit {
  lessons: Lesson[] = [];
  curriculum: LessonCurriculum | null = null;
  sections: LessonSection[] = [];
  openSectionIds = new Set<number>();
  notes: Note[] = [];
  activeLesson: Lesson | null = null;
  activeNote: Note | null = null;

  loading = true;
  codeLoading = false;
  personalCodeSaved = false;

  message = '';
  errorMessage = '';

  htmlCode = new FormControl('', { nonNullable: true });
  cssCode = new FormControl('', { nonNullable: true });
  javascriptCode = new FormControl('', { nonNullable: true });
  note = new FormControl('', { nonNullable: true });
  activeCodeTab: 'html' | 'css' | 'javascript' = 'html';
  setCodeTab(tab: 'html' | 'css' | 'javascript'): void {
  this.activeCodeTab = tab;
}

  constructor(
    private route: ActivatedRoute,
    private lessonService: LessonService,
    private noteService: NoteService,
    private favoriteService: FavoriteService,
    private progressService: ProgressService,
    private personalCodeService: PersonalCodeService,
    public auth: Auth
  ) {}

  ngOnInit(): void {
    const categoryId = Number(
      this.route.snapshot.paramMap.get('categoryId')
    );

    if (!categoryId) {
      this.errorMessage = 'Hibás kategória.';
      this.loading = false;
      return;
    }

    this.lessonService.getCurriculum(categoryId).subscribe({
      next: curriculum => {
        this.curriculum = curriculum;
        this.sections = curriculum.sections;
        this.lessons = curriculum.sections.flatMap(section => section.lessons);

        const lessonId = Number(
          this.route.snapshot.queryParamMap.get('lesson')
        );

        this.activeLesson = lessonId
          ? this.lessons.find(lesson => lesson.id === lessonId) ?? this.lessons[0] ?? null
          : this.lessons[0] ?? null;

        const activeSection = this.sections.find(section =>
          section.lessons.some(lesson => lesson.id === this.activeLesson?.id)
        );

        if (activeSection) {
          this.openSectionIds.add(activeSection.id);
        } else if (this.sections[0]) {
          this.openSectionIds.add(this.sections[0].id);
        }

        this.loading = false;

        this.auth.restoreSession().subscribe(user => {
          if (user) {
            this.loadNotes();
            this.loadPersonalCode();
          } else {
            this.loadGuestCode();
          }
        });
      },
      error: () => {
        this.errorMessage = 'Nem sikerült betölteni a tananyagokat.';
        this.loading = false;
      }
    });
  }

  toggleSection(sectionId: number): void {
    if (this.openSectionIds.has(sectionId)) {
      this.openSectionIds.delete(sectionId);
      return;
    }

    this.openSectionIds.add(sectionId);
  }

  isSectionOpen(sectionId: number): boolean {
    return this.openSectionIds.has(sectionId);
  }

  isLessonCompleted(lesson: Lesson): boolean {
    return lesson.completed === true;
  }

  sectionCompleted(section: LessonSection): number {
    return section.lessons.filter(lesson => lesson.completed).length;
  }

  getActiveSectionName(): string {
    if (!this.activeLesson) return '';
    return this.sections.find(section =>
      section.lessons.some(lesson => lesson.id === this.activeLesson?.id)
    )?.name ?? '';
  }


  selectLesson(lesson: Lesson): void {
    this.activeLesson = lesson;
    const section = this.sections.find(item => item.lessons.some(entry => entry.id === lesson.id));
    if (section) this.openSectionIds.add(section.id);
    this.message = '';
    this.errorMessage = '';

    this.loadActiveNote();

    if (this.auth.isLoggedIn()) {
      this.loadPersonalCode();
    } else {
      this.loadGuestCode();
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

loadGuestCode(): void {
  if (!this.activeLesson) return;

  this.personalCodeSaved = false;

  this.htmlCode.setValue(
    this.activeLesson.example_html ?? ''
  );

  this.cssCode.setValue(
    this.activeLesson.example_css ?? ''
  );

  this.javascriptCode.setValue(
    this.activeLesson.example_javascript ??
    this.activeLesson.example_code ??
    ''
  );
}

  loadPersonalCode(): void {
    if (!this.activeLesson) return;

    this.codeLoading = true;

    this.personalCodeService.get(this.activeLesson.id).subscribe({
      next: response => {
        this.htmlCode.setValue(response.html ?? '');
        this.cssCode.setValue(response.css ?? '');
        this.javascriptCode.setValue(response.javascript ?? '');

        this.personalCodeSaved = response.saved;
        this.codeLoading = false;
      },
      error: () => {
        this.loadGuestCode();
        this.codeLoading = false;
      }
    });
  }

  savePersonalCode(): void {
    if (!this.activeLesson) return;

    if (!this.auth.isLoggedIn()) {
      this.errorMessage =
        'A saját kód mentéséhez be kell jelentkezned.';
      return;
    }

    this.personalCodeService.save(
      this.activeLesson.id,
      this.htmlCode.value,
      this.cssCode.value,
      this.javascriptCode.value
    ).subscribe({
      next: response => {
        this.personalCodeSaved = response.saved;
        this.message =
          response.message ?? 'Saját kód elmentve.';
        this.errorMessage = '';
      },
      error: error => {
        this.handleError(error);
      }
    });
  }

  resetPersonalCode(): void {
    if (!this.activeLesson) return;

    if (!this.auth.isLoggedIn()) {
      this.loadGuestCode();
      return;
    }

    if (!confirm('Biztosan visszaállítod az eredeti kódot?')) {
      return;
    }

    this.personalCodeService.reset(
      this.activeLesson.id
    ).subscribe({
      next: response => {
        this.htmlCode.setValue(response.html ?? '');
        this.cssCode.setValue(response.css ?? '');
        this.javascriptCode.setValue(
          response.javascript ?? ''
        );

        this.personalCodeSaved = false;
        this.message =
          response.message ?? 'Kód visszaállítva.';
        this.errorMessage = '';
      },
      error: error => {
        this.handleError(error);
      }
    });
  }

  loadNotes(): void {
    this.noteService.getAll().subscribe({
      next: notes => {
        this.notes = notes;
        this.loadActiveNote();
      },
      error: error => {
        this.handleError(error);
      }
    });
  }

  loadActiveNote(): void {
    if (!this.activeLesson) return;

    this.activeNote =
      this.notes.find(
        note => note.lesson_id === this.activeLesson!.id
      ) ?? null;

    this.note.setValue(
      this.activeNote?.content ?? ''
    );
  }

  saveNote(): void {
    if (
      !this.activeLesson ||
      !this.note.value.trim()
    ) {
      return;
    }

    this.noteService.save(
      this.activeLesson.id,
      this.note.value.trim()
    ).subscribe({
      next: response => {
        this.message = response.message;
        this.errorMessage = '';

        const index = this.notes.findIndex(
          item =>
            item.lesson_id === response.note.lesson_id
        );

        if (index >= 0) {
          this.notes[index] = response.note;
        } else {
          this.notes.push(response.note);
        }

        this.activeNote = response.note;
      },
      error: error => {
        this.handleError(error);
      }
    });
  }

  deleteNote(): void {
    if (!this.activeNote) return;

    if (!confirm('Biztosan törlöd a jegyzetet?')) {
      return;
    }

    const noteId = this.activeNote.id;

    this.noteService.delete(noteId).subscribe({
      next: response => {
        this.notes = this.notes.filter(
          item => item.id !== noteId
        );

        this.activeNote = null;
        this.note.setValue('');
        this.message = response.message;
        this.errorMessage = '';
      },
      error: error => {
        this.handleError(error);
      }
    });
  }

  toggleFavorite(): void {
    if (!this.activeLesson) return;

    this.favoriteService.toggle(
      this.activeLesson.id
    ).subscribe({
      next: response => {
        this.message =
          response.message ?? 'Kedvencek frissítve.';
        this.errorMessage = '';
      },
      error: error => {
        this.handleError(error);
      }
    });
  }

  completeLesson(): void {
    if (!this.activeLesson) return;

    this.progressService.complete(
      this.activeLesson.id
    ).subscribe({
      next: response => {
        this.message =
          response.message ?? 'Lecke teljesítve.';
        this.errorMessage = '';
        this.markActiveLessonCompleted();
      },
      error: error => {
        this.handleError(error);
      }
    });
  }

  private markActiveLessonCompleted(): void {
    if (!this.activeLesson || this.activeLesson.completed) return;

    this.activeLesson.completed = true;
    const section = this.sections.find(item =>
      item.lessons.some(lesson => lesson.id === this.activeLesson?.id)
    );

    if (section) {
      const completed = this.sectionCompleted(section);
      section.progress.completed = completed;
      section.progress.percentage = section.progress.total > 0
        ? Math.round((completed / section.progress.total) * 100)
        : 0;
    }

    if (this.curriculum) {
      const completed = this.lessons.filter(lesson => lesson.completed).length;
      this.curriculum.progress.completed = completed;
      this.curriculum.progress.percentage = this.curriculum.progress.total > 0
        ? Math.round((completed / this.curriculum.progress.total) * 100)
        : 0;
    }
  }

  private handleError(error: any): void {
    this.message = '';

    if (error.status === 401) {
      this.errorMessage =
        'Ehhez a funkcióhoz be kell jelentkezned.';
      return;
    }

    if (error.status === 419) {
      this.errorMessage =
        'A munkamenet lejárt. Frissítsd az oldalt és próbáld újra.';
      return;
    }

    if (error.status === 422) {
      this.errorMessage =
        error.error?.message ?? 'Hibás adatok.';
      return;
    }

    this.errorMessage =
      error.error?.message ?? 'Hiba történt.';
  }
}