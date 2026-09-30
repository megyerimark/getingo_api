import { TestBed } from '@angular/core/testing';

import { Gdpr } from './gdpr';

describe('Gdpr', () => {
  let service: Gdpr;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Gdpr);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
