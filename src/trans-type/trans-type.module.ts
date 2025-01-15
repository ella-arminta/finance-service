import { Module } from '@nestjs/common';
import { TransTypeService } from './trans-type.service';
import { TransTypeController } from './trans-type.controller';

@Module({
  controllers: [TransTypeController],
  providers: [TransTypeService],
  exports: [TransTypeService],
})
export class TransTypeModule {}
