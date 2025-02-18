import { Test, TestingModule } from '@nestjs/testing';
import { TransAccountSettingsController } from './trans-account-settings.controller';
import { TransAccountSettingsService } from './trans-account-settings.service';

describe('TransAccountSettingsController', () => {
  let controller: TransAccountSettingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransAccountSettingsController],
      providers: [TransAccountSettingsService],
    }).compile();

    controller = module.get<TransAccountSettingsController>(TransAccountSettingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
