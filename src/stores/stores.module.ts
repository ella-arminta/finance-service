import { Module } from '@nestjs/common';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { AccountsService } from 'src/accounts/accounts.service';
import { CompaniesService } from 'src/companies/companies.service';

@Module({
  controllers: [StoresController],
  providers: [StoresService, AccountsService, CompaniesService],
})
export class StoresModule {}
