import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { TransactionValidation } from './transaction.validaton';
import { StoresService } from 'src/stores/stores.service';
import { CompaniesService } from 'src/companies/companies.service';
import { AccountsService } from 'src/accounts/accounts.service';
import { StoresModule } from 'src/stores/stores.module';
import { CompaniesModule } from 'src/companies/companies.module';
import { AccountsModule } from 'src/accounts/accounts.module';

@Module({
  imports: [StoresModule, CompaniesModule, AccountsModule],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    TransactionValidation,
  ],
})
export class TransactionModule {}
