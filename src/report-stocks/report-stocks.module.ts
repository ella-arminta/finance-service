import { Module } from '@nestjs/common';
import { ReportStocksService } from './report-stocks.service';
import { ReportStocksController } from './report-stocks.controller';
import { ReportStockValidation } from './report-stocks.validation';
import { StockSourceService } from './stock-source.service';
import { TransAccountSettingsModule } from 'src/trans-account-settings/trans-account-settings.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
     ClientsModule.register([
      {
        name: 'INVENTORY_READER',
        transport: Transport.TCP,
        options: {
          host: process.env.INVENTORY_SERVICE_HOST ?? 'localhost',
          port: Number(process.env.INVENTORY_SERVICE_READER_PORT ?? '3004'),
        },
      },
    ]),
    TransAccountSettingsModule
  ],
  controllers: [ReportStocksController],
  providers: [ReportStocksService, ReportStockValidation, StockSourceService],
  exports: [ReportStocksService],
})
export class ReportStocksModule {}
