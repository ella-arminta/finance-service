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
import { TransTypeModule } from 'src/trans-type/trans-type.module';
import { TransAccountSettingsModule } from 'src/trans-account-settings/trans-account-settings.module';
import { ReportModule } from 'src/report-journals/report-journals.module';
import { ReportStocksModule } from 'src/report-stocks/report-stocks.module';

@Module({
  imports: [StoresModule, CompaniesModule, AccountsModule, TransTypeModule,TransAccountSettingsModule, ReportModule, ReportStocksModule],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    TransactionValidation,
  ],
  exports: [TransactionService]
})
export class TransactionModule {}
