import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ZodFilter } from './filters/http-exception.filter';

async function bootstrap() {  
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: { port: 3002 }, // Unique port for this TCP service
    },
  );

  app.useGlobalFilters(new ZodFilter());

  const rabbitMQService =
  await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'finance_service_queue',
      noAck: false,
    },
  });

  const rabbitMQService2 =
    await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'auth_service_queue',
        noAck: false,
      },
    });

  await Promise.all([
    app.listen(), 
    rabbitMQService.listen(), 
    rabbitMQService2.listen()
  ]);
}
bootstrap();