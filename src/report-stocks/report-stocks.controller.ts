import { Controller } from '@nestjs/common';
import { ReportStocksService } from './report-stocks.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { Exempt } from 'src/decorator/exempt.decorator';
import { ReportStockValidation } from './report-stocks.validation';
import { ValidationService } from 'src/common/validation.service';
import { LoggerService } from 'src/common/logger.service';
import { StockSourceService } from './stock-source.service';
import { ResponseDto } from 'src/common/response.dto';

@Controller()
export class ReportStocksController {
  constructor(
    private readonly reportStocksService: ReportStocksService,
    private readonly validationService: ValidationService,
    private readonly reportStockValidation: ReportStockValidation,
    private readonly stockSourceService: StockSourceService,
    private readonly loggerService: LoggerService,
  ) { }

  private async handleEvent(
    context: RmqContext,
    callback: () => Promise<any>,
    errorMessage: string,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const maxRetries = 5;
    const headers = originalMsg.properties.headers || {};
    const retryCount = headers['x-retry-count'] ? headers['x-retry-count'] + 1 : 1;

    try {
      const response = await callback();
      if (response.success) {
        channel.ack(originalMsg);
      }
    } catch (error) {
      console.error(`${errorMessage}. Retry attempt: ${retryCount}`, error.stack);

      // Simpan log error ke file
      this.loggerService.logErrorToFile(errorMessage, error);

      if (retryCount >= maxRetries) {
        console.error(`Max retries (${maxRetries}) reached. Logging error and acknowledging message.`);
        channel.ack(originalMsg);
      } else {
        console.warn(`Retrying message (${retryCount}/${maxRetries})...`);
        channel.sendToQueue(originalMsg.fields.routingKey, originalMsg.content, {
          persistent: true,
          headers: { ...headers, 'x-retry-count': retryCount },
        });
        channel.nack(originalMsg, false, false);
      }
    }
  }

}
