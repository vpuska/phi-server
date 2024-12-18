import { Test, TestingModule } from '@nestjs/testing';
import { PhiLoadService } from './phi-load.service';

describe('PhiLoadService', () => {
  let service: PhiLoadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PhiLoadService],
    }).compile();

    service = module.get<PhiLoadService>(PhiLoadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
