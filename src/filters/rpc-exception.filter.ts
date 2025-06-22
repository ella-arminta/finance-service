import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Catch()
export class RPCExceptionFilter<T = any> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToRpc();
    const data = ctx.getData();

    // ✅ If it's a RpcException, unwrap the inner error
    if (exception instanceof RpcException) {
      const innerError = exception.getError();

      // ✅ Use shape-check instead of instanceof (for deserialized errors like ZodError)
      if (
        typeof innerError === 'object' &&
        innerError !== null &&
        'issues' in innerError &&
        Array.isArray((innerError as any).issues)
      ) {
        return {
          statusCode: 400,
          message: 'Validation failed',
          errors: this.formatZodError(innerError as ZodError),
        };
      }

      return {
        statusCode: 500,
        message:
          typeof innerError === 'object' && 'message' in innerError
            ? (innerError as any).message
            : typeof innerError === 'string'
            ? innerError
            : 'Unknown RPC error',
        error: innerError,
      };
    }



    // ✅ Handle direct ZodError just in case
    if (exception instanceof ZodError) {
      return {
        statusCode: 400,
        message: 'Validation failed',
        errors: this.formatZodError(exception),
      };
    }

    // ✅ Prisma DB error
    if (exception instanceof PrismaClientKnownRequestError) {
      const formattedErrors = this.formatPrismaError(exception);
      return {
        statusCode: 400,
        message: formattedErrors[0].message,
        errors: formattedErrors,
      };
    }

    // 🔁 Fallback
    return {
      statusCode: 500,
      message:
        exception instanceof Error ? exception.message : 'Internal server error',
      error: exception instanceof Error ? exception.message : exception,
      data,
    };
  }

  private formatZodError(error: ZodError): Record<string, any>[] {
    return error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
      ...(issue as any),
    }));
  }

  private formatPrismaError(error: PrismaClientKnownRequestError): Record<string, any>[] {
    const formattedIssue: Record<string, any> = {
      code: error.code,
      message: error.message,
    };

    switch (error.code) {
      case 'P2002':
        formattedIssue.message = `${error.meta?.target?.[0]} already exists`;
        formattedIssue.field = error.meta?.target?.[0] ?? '';
        break;
      case 'P2003':
        formattedIssue.message = 'Foreign key constraint failed';
        break;
      case 'P2025':
        formattedIssue.message = 'Record not found';
        break;
    }

    return [formattedIssue];
  }
}