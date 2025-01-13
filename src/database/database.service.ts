import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
    async onModuleInit() {
        await this.$connect()
        .then(() => console.log('Database connected'))
        .catch((error) => console.log('Database connection error', error));
    }

    // Method to truncate a table dynamically
    async truncateTable(tableName: string): Promise<void> {
        if (!(this as any)[tableName]) {
            throw new Error(`Table "${tableName}" does not exist in Prisma Client.`);
        }

        await this.$queryRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE`);
        console.log(`Table "${tableName}" truncated successfully.`);
    }
}
