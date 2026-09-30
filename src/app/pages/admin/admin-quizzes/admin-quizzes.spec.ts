import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminQuizzes } from './admin-quizzes';

describe('AdminQuizzes', () => {
  let component: AdminQuizzes;
  let fixture: ComponentFixture<AdminQuizzes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminQuizzes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminQuizzes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
