import { forwardRef, Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { AccountsService } from 'src/accounts/accounts.service';
import { StoresService } from 'src/stores/stores.service';
import { CompanyValidation } from './companies.validation';
import { AccountsModule } from 'src/accounts/accounts.module';
import { SharedModule } from 'src/shared.module';

@Module({
  imports: [forwardRef(() => AccountsModule), SharedModule],
  controllers: [CompaniesController],
  providers: [CompaniesService, CompanyValidation],
  exports: [CompaniesService, CompanyValidation]
})
export class CompaniesModule {}
