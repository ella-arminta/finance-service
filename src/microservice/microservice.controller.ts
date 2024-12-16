import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';

@Controller('microservice')
export class MicroserviceController {
    @EventPattern('event_name')
    async handleUserCreated(data: Record<string, unknown>) {
      // business logic
      console.log('Event received:', data);
    }
}
