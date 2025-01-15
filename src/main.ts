import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ZodFilter } from './filters/http-exception.filter';

async function bootstrap() {  
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new ZodFilter());

  const microserviceTcp = app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.TCP,
      options: { port: 3002 }, // Unique port for this TCP service
    },
  );

  const rabbitMQService = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'finance_service_queue',
      noAck: false,
    },
  });

  const rabbitMQService2 = app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'auth_service_queue1',
        noAck: false,
      },
  });

  await app.startAllMicroservices();
}
bootstrap();