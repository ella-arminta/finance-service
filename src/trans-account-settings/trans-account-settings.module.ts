import { Module } from '@nestjs/common';
import { TransAccountSettingsService } from './trans-account-settings.service';
import { TransAccountSettingsController } from './trans-account-settings.controller';

@Module({
  controllers: [TransAccountSettingsController],
  providers: [TransAccountSettingsService],
  exports: [TransAccountSettingsService]
})
export class TransAccountSettingsModule {}
