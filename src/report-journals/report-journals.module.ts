import { Module } from '@nestjs/common';
import { ReportService } from './report-journals.service';
import { ReportController } from './report-journals.controller';
import { ReportValidation } from './report-journals.validation';
import { TransAccountSettingsModule } from 'src/trans-account-settings/trans-account-settings.module';
import { ReportStocksModule } from 'src/report-stocks/report-stocks.module';

@Module({
  imports: [TransAccountSettingsModule, ReportStocksModule],
  controllers: [ReportController],
  providers: [ReportService, ReportValidation],
  exports: [ReportService]
})
export class ReportModule {}
