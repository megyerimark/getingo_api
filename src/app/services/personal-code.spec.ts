import { TestBed } from '@angular/core/testing';

import { PersonalCode } from './personal-code';

describe('PersonalCode', () => {
  let service: PersonalCode;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PersonalCode);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
