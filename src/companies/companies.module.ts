import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { AccountsService } from 'src/accounts/accounts.service';
import { StoresService } from 'src/stores/stores.service';

@Module({
  controllers: [CompaniesController],
  providers: [CompaniesService, AccountsService, StoresService],
})
export class CompaniesModule {}
