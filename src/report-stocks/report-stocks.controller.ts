import { Controller } from '@nestjs/common';
import { ReportStocksService } from './report-stocks.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { Exempt } from 'src/decorator/exempt.decorator';
import { ReportStockValidation } from './report-stocks.validation';
import { ValidationService } from 'src/common/validation.service';
import { LoggerService } from 'src/common/logger.service';

@Controller()
export class ReportStocksController {
  constructor(
    private readonly reportStocksService: ReportStocksService,
    private readonly validationService: ValidationService,
    private readonly reportStockValidation: ReportStockValidation,
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
      if (response) {
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


  @EventPattern({ cmd: 'product_code_generated' })
  @Exempt()
  async handleProductCodeCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('generated product', data);
    // generated product {
    //   id: '3650376a-3800-484f-9c7c-2acea4cf7121',
    //   barcode: 'CHER0010100010006',
    //   product_id: '87958f93-183e-44af-bd5c-51ad8baa4391',
    //   weight: '12',
    //   fixed_price: '100000',
    //   status: 0,
    //   buy_price: '123',
    //   created_at: '2025-02-21T15:37:29.964Z',
    //   updated_at: '2025-02-21T15:37:29.964Z',
    //   deleted_at: null,
    //   product: {
    //     id: '87958f93-183e-44af-bd5c-51ad8baa4391',
    //     code: 'CHER001010001',
    //     name: 'Gelang Hello Kitty Biru',
    //     description: 'kjh',
    //     images: [ 'uploads\\product\\9ff93394-482a-4586-8c56-af9c9bea7bb5.png' ],
    //     status: 1,
    //     type_id: 'd69d62c7-5a16-4b8d-9aab-081055ea1c34',
    //     store_id: 'e344156f-49d6-4179-87b9-03d22cc18ebf',
    //     created_at: '2025-02-19T08:35:31.340Z',
    //     updated_at: '2025-02-19T08:35:31.340Z',
    //     deleted_at: null,
    //     type: {
    //       id: 'd69d62c7-5a16-4b8d-9aab-081055ea1c34',
    //       code: 'CHER00101',
    //       name: 'Hello Kitty',
    //       description: 'gelang hello kitty',
    //       category_id: 'de069412-d0da-4518-8a6d-e1368d2076d4',
    //       created_at: '2025-02-19T08:33:06.933Z',
    //       updated_at: '2025-02-19T08:33:06.933Z',
    //       deleted_at: null,
    //       prices: [Array],
    //       category: [Object]
    //     },
    //     store: {
    //       id: 'e344156f-49d6-4179-87b9-03d22cc18ebf',
    //       code: 'SUBCH',
    //       name: 'Surabaya Cabang',
    //       is_active: true,
    //       is_flex_price: false,
    //       is_float_price: false,
    //       tax_percentage: '2',
    //       company_id: 'e043ef91-9501-4b2e-8a08-3424174eef23',
    //       created_at: '2025-02-19T08:32:10.258Z',
    //       updated_at: '2025-02-19T08:32:10.258Z',
    //       deleted_at: null,
    //       company: [Object]
    //     }
    //   }
    // }
    const processData = async (data: any) => {
      const validatedData = await this.validationService.validate(this.reportStockValidation.CREATE, data);
      return await this.reportStocksService.create(validatedData);
    };

    await this.handleEvent(
      context,
      () => processData(data),
      'Error processing product_code_generated event',
    );
    // error nya apa returnnya todoella
    // console.log('product code updated: ', data);
    // acknoledge the message
  }

  @EventPattern({ cmd: 'product_code_updated' })
  @Exempt()
  async handleProductCodeUpdated(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('data updated', data)
    // status : Available, Sold Out, Taken
    // await this.handleEvent(
    //   context,
    //   () => this.reportStocksService.create(data),
    //   'Error processing account_created event',
    // );
    // console.log('product code updated: ', data);
  }

  @EventPattern({ cmd: 'product_code_deleted' })
  @Exempt()
  async handleProductCodeDeleted(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('data deleted', data)
    // data deleted { id: 'bd4efc13-2abd-48a2-9754-42a08dc64f47' }
    // await this.handleEvent(
    //   context,
    //   () => this.reportStocksService.create(data),
    //   'Error processing account_created event',
    // );
    // console.log('product code updated: ', data);
  }
}
