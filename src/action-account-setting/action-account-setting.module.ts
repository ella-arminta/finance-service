import { Module } from '@nestjs/common';
import { ActionAccountSettingService } from './action-account-setting.service';
import { ActionAccountSettingController } from './action-account-setting.controller';

@Module({
  controllers: [ActionAccountSettingController],
  providers: [ActionAccountSettingService],
  exports: [ActionAccountSettingService]
})
export class ActionAccountSettingModule {}
