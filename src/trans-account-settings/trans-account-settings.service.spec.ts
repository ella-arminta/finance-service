import { Test, TestingModule } from '@nestjs/testing';
import { TransAccountSettingsService } from './trans-account-settings.service';

describe('TransAccountSettingsService', () => {
  let service: TransAccountSettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransAccountSettingsService],
    }).compile();

    service = module.get<TransAccountSettingsService>(TransAccountSettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
