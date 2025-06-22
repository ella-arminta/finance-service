import { ZodType, ZodError } from 'zod';
import { Global, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

@Global()
@Injectable()
export class ValidationService {
  async validate<T>(zodType: ZodType<T>, data: T): Promise<T> {
    try {
      return await zodType.parseAsync(data);
    } catch (error) {
      if (error instanceof ZodError) {
          throw new RpcException({
            statusCode: 400,
            message: 'Validation failed',
            errors: error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
              code: issue.code,
            })),
          });
      }
      throw error;
    }
  }
}