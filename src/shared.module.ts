import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'MASTER',
                transport: Transport.RMQ,
                options: {
                    urls: ['amqp://localhost:5672'],
                    queue: 'master_service_queue',
                    queueOptions: {
                        durable: true,
                    },
                },
            },
            {
                name: 'MARKETPLACE',
                transport: Transport.RMQ,
                options: {
                    urls: ['amqp://localhost:5672'],
                    queue: 'marketplace_service_queue',
                    queueOptions: {
                        durable: true,
                    },
                },
            },
            {
                name: 'INVENTORY',
                transport: Transport.RMQ,
                options: {
                    urls: ['amqp://localhost:5672'],
                    queue: 'inventory_service_queue',
                    queueOptions: {
                        durable: true,
                    },
                },
            },
            {
                name: 'TRANSACTION',
                transport: Transport.RMQ,
                options: {
                    urls: ['amqp://localhost:5672'],
                    queue: 'transaction_service_queue',
                    queueOptions: {
                        durable: true,
                    },
                },
            },
            {
                name: 'FINANCE',
                transport: Transport.RMQ,
                options: {
                    urls: ['amqp://localhost:5672'],
                    queue: 'finance_service_queue',
                    queueOptions: {
                        durable: true,
                    },
                },
            },
            {
                name: 'TRANSACTION_TCP',
                transport: Transport.TCP,
                options: {
                    host: process.env.TRANSACTION_SERVICE_HOST ?? 'localhost',
                    port: 3005,
                },
            },
        ]),
    ],
    exports: [ClientsModule],
})
export class SharedModule { }