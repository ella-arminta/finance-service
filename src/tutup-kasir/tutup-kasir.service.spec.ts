import { Test, TestingModule } from '@nestjs/testing';
import { TutupKasirService } from './tutup-kasir.service';

describe('TutupKasirService', () => {
  let service: TutupKasirService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TutupKasirService],
    }).compile();

    service = module.get<TutupKasirService>(TutupKasirService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
