import { Test, TestingModule } from '@nestjs/testing';
import { ReportStocksService } from './report-stocks.service';

describe('ReportStocksService', () => {
  let service: ReportStocksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportStocksService],
    }).compile();

    service = module.get<ReportStocksService>(ReportStocksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
