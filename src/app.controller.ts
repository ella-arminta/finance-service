import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { ClientProxy, Ctx, EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { Exempt } from './decorator/exempt.decorator';
import { MessagePatternDiscoveryService } from './discovery/message-pattern-discovery.service';
import { ResponseDto } from './common/response.dto';
import { DatabaseService } from './database/database.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly db: DatabaseService,
    private readonly discovery: MessagePatternDiscoveryService,
    @Inject('FINANCE') private readonly financeClient: ClientProxy,
  ) {}
  @MessagePattern({ cmd: 'get_routes' })
  @Exempt()
  async getAllRoutes(): Promise<any> {
    const patterns = this.discovery.getMessagePatterns();
    return ResponseDto.success('Pattern Found!', patterns, 200);
  }

  
  @MessagePattern({ cmd: 'post:run-failed-message/*' })
  @Exempt()
  async runFailedMessage(@Payload() data: any): Promise<ResponseDto> {
    console.log('run failed message', data);

    try {
      const id = parseInt(data.params.id);
      const failedMessage = await this.db.failed_Message.findUnique({
        where: { id },
      })
      if (!failedMessage) {
        return ResponseDto.error('Failed message not found!', null, 404);
      }
      const queueName =  failedMessage.queue;
      const payload = failedMessage.payload['data'];
      console.log('this is payload data', payload);

      try {
        await this.financeClient.emit({ cmd: queueName }, payload).toPromise();
        return ResponseDto.success('Message reprocessed successfully!', null, 200);
      } catch (err) {
        return ResponseDto.error('Failed to reprocess message!', err.message, 500);
      }  
    } catch (error) {
      console.error('Error running failed message:', error);
      return ResponseDto.error('Failed to run message!', error.message, 500);
    }
  }
}
