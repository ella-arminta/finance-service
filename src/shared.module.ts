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
        ]),
    ],
    exports: [ClientsModule],
})
export class SharedModule { }