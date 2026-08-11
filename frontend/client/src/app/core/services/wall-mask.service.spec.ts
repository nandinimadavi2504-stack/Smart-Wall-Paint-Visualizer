import { TestBed } from '@angular/core/testing';

import { WallMaskService } from './wall-mask.service';

describe('WallMaskService', () => {
  let service: WallMaskService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WallMaskService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
