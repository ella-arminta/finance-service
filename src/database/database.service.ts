import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
    async onModuleInit() {
        await this.$connect()
        .then(() => console.log('Database connected'))
        .catch((error) => console.log('Database connection error', error));
    }
}
