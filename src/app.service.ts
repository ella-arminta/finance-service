import { Injectable,OnModuleInit } from '@nestjs/common';
import { EventPattern, MessagePattern } from '@nestjs/microservices';


@Injectable()
export class AppService implements OnModuleInit {
  onModuleInit() {
    console.log('Subscriber microservice is listening...');
  }

  getHello(): string {
    return 'Hello World! Microservice';
  }
}
