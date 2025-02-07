import { Module } from '@nestjs/common';
import { RecurringService } from './recurring.service';
import { RecurringController } from './recurring.controller';
import { RecurringValidation } from './recurring.validation';
import { TransactionModule } from 'src/transaction/transaction.module';

@Module({
  imports: [
    TransactionModule
  ],
  controllers: [RecurringController],
  providers: [RecurringService, RecurringValidation],
})
export class RecurringModule {}
