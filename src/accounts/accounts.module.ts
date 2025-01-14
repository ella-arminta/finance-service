import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { ValidationService } from '../common/validation.service';
import { DatabaseService } from '../database/database.service';
import { StoresService } from 'src/stores/stores.service';
import { CompaniesService } from 'src/companies/companies.service';

@Module({
  imports: [],
  controllers: [AccountsController],
  providers: [AccountsService, ValidationService, DatabaseService, StoresService, CompaniesService],
})
export class AccountsModule {}
