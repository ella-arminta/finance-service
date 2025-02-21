import { Module } from '@nestjs/common';
import { ReportStocksService } from './report-stocks.service';
import { ReportStocksController } from './report-stocks.controller';
import { ReportStockValidation } from './report-stocks.validation';

@Module({
  controllers: [ReportStocksController],
  providers: [ReportStocksService, ReportStockValidation],
})
export class ReportStocksModule {}
