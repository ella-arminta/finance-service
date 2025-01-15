import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { ValidationService } from '../common/validation.service';
import { DatabaseService } from '../database/database.service';
import { StoresService } from 'src/stores/stores.service';
import { CompaniesService } from 'src/companies/companies.service';
import { AccountValidation } from './account.validation';
import { AccountTypesService } from 'src/account-types/account-types.service';
import { CompaniesModule } from 'src/companies/companies.module';
import { StoresModule } from 'src/stores/stores.module';
import { AccountTypesModule } from 'src/account-types/account-types.module';

@Module({
  imports: [CompaniesModule, StoresModule, AccountTypesModule],
  controllers: [AccountsController],
  providers: [AccountsService, AccountValidation],
  exports: [AccountsService]
})
export class AccountsModule {}
