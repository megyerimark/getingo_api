import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminExercises } from './admin-exercises';

describe('AdminExercises', () => {
  let component: AdminExercises;
  let fixture: ComponentFixture<AdminExercises>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminExercises]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminExercises);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
