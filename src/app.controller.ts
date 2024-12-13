import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { EventPattern } from '@nestjs/microservices';

@Controller()
export class AppController {
  @EventPattern('event_name')
  async handleUserCreated(data: Record<string, unknown>) {
    // business logic
    console.log('Event received:', data);
  }
}
