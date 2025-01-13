import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { ValidationService } from '../common/validation.service';
import { DatabaseService } from '../database/database.service';

@Module({
  imports: [],
  controllers: [AccountsController],
  providers: [AccountsService, ValidationService, DatabaseService],
})
export class AccountsModule {}
