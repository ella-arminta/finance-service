import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { ReportValidation } from './report.validation';

@Module({
  controllers: [ReportController],
  providers: [ReportService, ReportValidation],
})
export class ReportModule {}
