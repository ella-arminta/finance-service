import { ZodType } from 'zod';
import { Global, Injectable } from '@nestjs/common';

@Global()
@Injectable()
export class ValidationService {
  validate<T>(zodType: ZodType<T>, data: T): T {
    return zodType.parse(data);
  }
}