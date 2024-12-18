import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const microservice = app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'finance_queue',
        noAck: false,
        queueOptions: {
          durable: false
        },
      },  
    },
  );

  await app.startAllMicroservices();
  await app.listen(3000);
  console.log('Subscriber microservice is running...');
}
bootstrap();