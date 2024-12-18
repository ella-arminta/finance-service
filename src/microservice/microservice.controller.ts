import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

@Controller('microservice')
export class MicroserviceController {
    @EventPattern('event_name')
    async handleUserCreated(@Payload() data: Record<string, unknown>, @Ctx() context: RmqContext) {
      // business logic
      console.log('Event received:', data);
      console.log(`Pattern: ${context.getPattern()}`);
      console.log(context.getMessage());
      console.log(context.getChannelRef());

      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);
    }
}
