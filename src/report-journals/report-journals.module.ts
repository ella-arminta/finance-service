import { Module } from '@nestjs/common';
import { ReportService } from './report-journals.service';
import { ReportController } from './report-journals.controller';
import { ReportValidation } from './report-journals.validation';

@Module({
  controllers: [ReportController],
  providers: [ReportService, ReportValidation],
  exports: [ReportService]
})
export class ReportModule {}
