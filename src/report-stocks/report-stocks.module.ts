import { Module } from '@nestjs/common';
import { ReportStocksService } from './report-stocks.service';
import { ReportStocksController } from './report-stocks.controller';
import { ReportStockValidation } from './report-stocks.validation';
import { StockSourceService } from './stock-source.service';
import { TransAccountSettingsModule } from 'src/trans-account-settings/trans-account-settings.module';

@Module({
  imports: [TransAccountSettingsModule],
  controllers: [ReportStocksController],
  providers: [ReportStocksService, ReportStockValidation, StockSourceService],
  exports: [ReportStocksService],
})
export class ReportStocksModule {}
