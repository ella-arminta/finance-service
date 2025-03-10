import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        super(); // Ensure PrismaClient is initialized once
    }

    async onModuleInit() {
        await this.$connect().catch((error) => console.error('Database connection error', error));
    }

    async onModuleDestroy() {
        await this.$disconnect(); // Prevent connection leaks
    }
}