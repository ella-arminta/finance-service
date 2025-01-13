
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
        // response.status(status).json({
        //   errors: exception.errors,
        //   message: exception.message,
        //   statusCode: status,
        // });

        return ResponseDto.error(exception.message, exception.errors, status, false);
      }    
}
