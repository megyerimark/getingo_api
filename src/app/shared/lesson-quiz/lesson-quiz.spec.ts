import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LessonQuiz } from './lesson-quiz';

describe('LessonQuiz', () => {
  let component: LessonQuiz;
  let fixture: ComponentFixture<LessonQuiz>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonQuiz]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LessonQuiz);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
