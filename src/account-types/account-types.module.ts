import { Module } from '@nestjs/common';
import { AccountTypesService } from './account-types.service';
import { AccountTypesController } from './account-types.controller';

@Module({
  controllers: [AccountTypesController],
  providers: [AccountTypesService],
})
export class AccountTypesModule {}
