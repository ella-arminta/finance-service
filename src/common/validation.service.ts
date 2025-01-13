import { ZodType } from 'zod';
import { Global, Injectable } from '@nestjs/common';

@Global()
@Injectable()
export class ValidationService {
  async validate<T>(zodType: ZodType<T>, data: T): Promise<T> {
    console.log('Validating data:', data);
    return zodType.parseAsync(data);
  }
}