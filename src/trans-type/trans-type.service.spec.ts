import { Test, TestingModule } from '@nestjs/testing';
import { TransTypeService } from './trans-type.service';

describe('TransTypeService', () => {
  let service: TransTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransTypeService],
    }).compile();

    service = module.get<TransTypeService>(TransTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
