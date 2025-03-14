import { Test, TestingModule } from '@nestjs/testing';
import { ActionAccountSettingService } from './action-account-setting.service';

describe('ActionAccountSettingService', () => {
  let service: ActionAccountSettingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActionAccountSettingService],
    }).compile();

    service = module.get<ActionAccountSettingService>(ActionAccountSettingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
