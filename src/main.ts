import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ZodFilter } from './filters/http-exception.filter';
import { RmqHelper } from './helper/rmq.helper';

async function bootstrap() {  
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: { 
        host: process.env.TCP_HOST || 'localhost',
        port: Number(process.env.TCP_PORT ?? '3003'),
      }, // Unique port for this TCP service
    },
  );

  app.useGlobalFilters(new ZodFilter());

  // const rabbitMQService =
  // await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  //   transport: Transport.RMQ,
  //   options: {
  //     urls: ['amqp://localhost:5672'],
  //     queue: 'finance_service_queue',
  //     noAck: false,
  //   },
  // });
  // RabbitMQ Setup queue name
  const queueName = process.env.RMQ_QUEUE_NAME || 'finance_service_queue_1';
  const rabbitMQService =
    await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RMQ_URL || 'amqp://localhost:5672'],
        queue: queueName,
        noAck: false,
        queueOptions: { durable: true },
      },
    });
  // Setup the topic yang di subscribe
  const routingKeys = [
    'company.*',
    'operation.*',
    'product.code.deleted',
    'product.code.created',
    'product.code.updated',
    'store.*',
    'transaction.finance.created', 
    'transaction.finance.updated',
    'transaction.finance.paid',
    'transaction.finance.deleted',
    'stock.out',
    'stock.unstock.out',
    'stock.repaired',
    'stock.opname.approved',
    'stock.opname.disapproved',
  ];
  await RmqHelper.setupSubscriptionQueue(queueName, routingKeys);

  // const rabbitMQService2 =
  //   await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  //     transport: Transport.RMQ,
  //     options: {
  //       urls: ['amqp://localhost:5672'],
  //       queue: 'auth_service_queue1',
  //       noAck: false,
  //     },
  //   });

  await Promise.all([
    app.listen(), 
    rabbitMQService.listen()
  ]);
}
bootstrap();