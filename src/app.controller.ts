import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Ctx, EventPattern, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { Exempt } from './decorator/exempt.decorator';
import { MessagePatternDiscoveryService } from './discovery/message-pattern-discovery.service';
import { ResponseDto } from './common/response.dto';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly discovery: MessagePatternDiscoveryService) {}
  @MessagePattern({ cmd: 'get_routes' })
  @Exempt()
  async getAllRoutes(): Promise<any> {
    // console.log('helloo');
    const patterns = this.discovery.getMessagePatterns();
    // console.log(patterns);
    return ResponseDto.success('Pattern Found!', patterns, 200);
  }
}
