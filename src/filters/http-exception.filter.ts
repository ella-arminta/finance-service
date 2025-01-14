
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseDto } from 'src/common/response.dto';
import { ZodError } from 'zod';

@Catch(ZodError)
export class ZodFilter<T extends ZodError> implements ExceptionFilter {
    catch(exception: T, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const status = 400;
        const errors = this.formatZodError(exception);
        return ResponseDto.error("Validation failed", errors, status, false);
      }    

  private formatZodError(error: ZodError): Record<string, any>[] {
    return error.issues.map((issue) => {
      const formattedIssue: Record<string, any> = {
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      };

      // Narrow down to issue types and include relevant properties
      if ('expected' in issue) formattedIssue.expected = issue.expected;
      if ('received' in issue) formattedIssue.received = issue.received;
      if ('minimum' in issue) formattedIssue.minimum = issue.minimum;
      if ('maximum' in issue) formattedIssue.maximum = issue.maximum;
      if ('inclusive' in issue) formattedIssue.inclusive = issue.inclusive;
      if ('exact' in issue) formattedIssue.exact = issue.exact;

      return formattedIssue;
    });
  }
}
