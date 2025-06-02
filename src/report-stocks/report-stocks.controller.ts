import { Controller } from '@nestjs/common';
import { ReportStocksService } from './report-stocks.service';
import { Ctx, EventPattern, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { Exempt } from 'src/decorator/exempt.decorator';
import { ResponseDto } from 'src/common/response.dto';
import { Describe } from 'src/decorator/describe.decorator';
import { RmqHelper } from 'src/helper/rmq.helper';
import { DatabaseService } from 'src/database/database.service';

@Controller()
export class ReportStocksController {
  constructor(
    private readonly reportStocksService: ReportStocksService,
    private readonly db: DatabaseService, 
  ) { }

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
      // console.log('result', result);
      return result;
  }

  @MessagePattern({ cmd: 'get:stock-mutation' })
  @Describe({
    description: 'Get stock mutation',
    fe: ['finance/stock-mutation:open'],
  })
  async getStockMutation(@Payload() data: any): Promise<ResponseDto> {
    let body = data.body;
  
    console.log('Raw body:', body);
  
    // Ensure `body` is an object
    if (typeof body !== 'object' || body === null) {
      return ResponseDto.error('Invalid request payload', 400);
    }
  
    // Sanitize function for text inputs
    const sanitizeInput = (input: any) => {
      if (typeof input === 'string') {
        return input.trim().replace(/['";]/g, ''); // Remove quotes, semicolons
      }
      return input;
    };
  
    // Convert date to valid date format
    const parseDate = (dateStr: any, isEndDate = false) => {
      if (!dateStr || typeof dateStr !== 'string') return null;
      
      const parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime())) return null;
    
      if (isEndDate) {
        parsedDate.setHours(23, 59, 59, 999); // Set waktu ke 23:59:59.999
      } else {
        parsedDate.setHours(0, 0, 0, 0); // Set waktu ke 00:00:00.000
      }
      return parsedDate;
    };
  
    body = {
      company_id: body.auth.company_id,
      dateStart: parseDate(sanitizeInput(body.dateStart)), // 00:00:00
      dateEnd: parseDate(sanitizeInput(body.dateEnd), true), // 23:59:59
      category_id: body.category_id,
      store_id: body.store_id,
      owner_id: body.owner_id,
    };
  
    console.log('Sanitized body:', body);
  
    return this.reportStocksService.getStockMutation(body);
  }

  @EventPattern('product.code.deleted')
  @Exempt()
  async handleProductCodeCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('handleProductCodeCreated', data);
    data = data.data;
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        this.reportStocksService.handleProductCodeDeleted(data);
      },
      {
        queueName: 'product.code.deleted',
        useDLQ: true,
        dlqRoutingKey: 'dlq.product.code.deleted',
        prisma: this.db,
      },
    )();
  }
}
