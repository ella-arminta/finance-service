import { forwardRef, Module } from '@nestjs/common';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { AccountsService } from 'src/accounts/accounts.service';
import { CompaniesService } from 'src/companies/companies.service';
import { StoreValidation } from './stores.validation';
import { AccountsModule } from 'src/accounts/accounts.module';
import { SharedModule } from 'src/shared.module';
import { CompaniesModule } from 'src/companies/companies.module';

@Module({
  imports: [forwardRef(() => AccountsModule), SharedModule, CompaniesModule],
  controllers: [StoresController],
  providers: [StoresService, StoreValidation],
  exports: [StoresService]
})
export class StoresModule {}
