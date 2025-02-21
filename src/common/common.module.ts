import { Global, Module } from '@nestjs/common';
import { ValidationService } from './validation.service';
import { LoggerService } from './logger.service';

@Global()
@Module({
  imports: [],
  providers: [
    ValidationService,
    LoggerService,
  ],
  exports: [ValidationService, LoggerService],
})
export class CommonModule {}