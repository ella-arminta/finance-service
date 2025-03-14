import { Module } from '@nestjs/common';
import { TransAccountSettingsService } from './trans-account-settings.service';
import { TransAccountSettingsController } from './trans-account-settings.controller';
import { TransAccountSettingsValidation } from './trans-account-settings.validation';
import { ActionAccountSettingModule } from 'src/action-account-setting/action-account-setting.module';

@Module({
  imports: [ActionAccountSettingModule],
  controllers: [TransAccountSettingsController],
  providers: [TransAccountSettingsService, TransAccountSettingsValidation],
  exports: [TransAccountSettingsService]
})
export class TransAccountSettingsModule {}
