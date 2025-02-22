import { Module } from '@nestjs/common';
import { ReportStocksService } from './report-stocks.service';
import { ReportStocksController } from './report-stocks.controller';
import { ReportStockValidation } from './report-stocks.validation';
import { StockSourceService } from './stock-source.service';

@Module({
  controllers: [ReportStocksController],
  providers: [ReportStocksService, ReportStockValidation, StockSourceService],
  exports: [ReportStocksService],
})
export class ReportStocksModule {}
