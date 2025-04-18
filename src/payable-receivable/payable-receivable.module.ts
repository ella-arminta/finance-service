import { Module } from '@nestjs/common';
import { PayableReceivableService } from './payable-receivable.service';
import { PayableReceivableController } from './payable-receivable.controller';
import { ReportModule } from 'src/report-journals/report-journals.module';
import { PayableReceivableValidation } from './payable-receivable.validation';

@Module({
  imports: [ReportModule],
  controllers: [PayableReceivableController],
  providers: [PayableReceivableService,PayableReceivableValidation],
})
export class PayableReceivableModule {}
