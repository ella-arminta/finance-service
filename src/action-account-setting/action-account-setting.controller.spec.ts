import { Test, TestingModule } from '@nestjs/testing';
import { ActionAccountSettingController } from './action-account-setting.controller';
import { ActionAccountSettingService } from './action-account-setting.service';

describe('ActionAccountSettingController', () => {
  let controller: ActionAccountSettingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActionAccountSettingController],
      providers: [ActionAccountSettingService],
    }).compile();

    controller = module.get<ActionAccountSettingController>(ActionAccountSettingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
