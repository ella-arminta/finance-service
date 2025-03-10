import { Module } from '@nestjs/common';
import { OperationService } from './operation.service';
import { OperationController } from './operation.controller';
import { OperationValidation } from './operation.validation';

@Module({
  controllers: [OperationController],
  providers: [OperationService, OperationValidation],
})
export class OperationModule {}
