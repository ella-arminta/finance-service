import { Controller } from '@nestjs/common';
import { ReportStocksService } from './report-stocks.service';
import { Ctx, EventPattern, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { Exempt } from 'src/decorator/exempt.decorator';
import { ReportStockValidation } from './report-stocks.validation';
import { ValidationService } from 'src/common/validation.service';
import { LoggerService } from 'src/common/logger.service';
import { StockSourceService } from './stock-source.service';
import { ResponseDto } from 'src/common/response.dto';
import { Describe } from 'src/decorator/describe.decorator';

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

  @MessagePattern({ cmd: 'get:stock-card' })
  @Describe({
      description: 'Get stock card',
      fe: ['finance/stock-card:open'],
  })
  async getStockCard(@Payload() data: any): Promise<ResponseDto> {
      const filters = data.body;

      if (filters.dateStart != null) {
        filters.dateStart = new Date(filters.dateStart);
      }
      if (filters.dateEnd != null) {
        var endDate = new Date(filters.dateEnd);
        endDate.setHours(23, 59, 59, 0); // Sets time to 23:59:59.000
        filters.dateEnd = endDate;
      }

      const result = await this.reportStocksService.getStockCard(filters);
      console.log('result', result);
      return result;
  }

}
