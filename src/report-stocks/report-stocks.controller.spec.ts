import { Test, TestingModule } from '@nestjs/testing';
import { ReportStocksController } from './report-stocks.controller';
import { ReportStocksService } from './report-stocks.service';

describe('ReportStocksController', () => {
  let controller: ReportStocksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportStocksController],
      providers: [ReportStocksService],
    }).compile();

    controller = module.get<ReportStocksController>(ReportStocksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
