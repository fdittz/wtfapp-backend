import { TestBed } from '@angular/core/testing';

import { ServerServiceService } from './server-service.service';

describe('ServerServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ServerServiceService = TestBed.get(ServerServiceService);
    expect(service).toBeTruthy();
  });
});
