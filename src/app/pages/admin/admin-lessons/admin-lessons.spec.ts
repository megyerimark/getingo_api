import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminLessons } from './admin-lessons';

describe('AdminLessons', () => {
  let component: AdminLessons;
  let fixture: ComponentFixture<AdminLessons>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLessons]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminLessons);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
