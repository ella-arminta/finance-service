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
      options: { port: 3002 }, // Unique port for this TCP service
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
    'product_code.deleted',
    'product_code.generated',
    'store.*',
    'transaction.approved', // setting jadi approve disapprove doang
    'transaction.disapproved',
    'stock_out',
    'unstock_out',
    'stock_repaired',
    'stock_opname.approved',
    'stock_opname.disapproved',
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