import { Injectable } from '@nestjs/common';
import { Journals } from '@prisma/client';
import { BaseService } from 'src/common/base.service';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class JournalsService extends BaseService<Journals> {
    constructor(
        db: DatabaseService) {
        const relations = {
        }
        super('journals', db, relations, true);
    }

    async getReport() {
        return [
            {
                id: 1,
                name: 'Sales Journal',
                code: 'S',
                debit: 0,
                credit: 2,
                balance: 1
            },
            {
                id: 2,
                name: 'Sales Journal',
                code: 'S',
                debit: 1,
                credit: 1,
                balance: 1
            },
            {
                id: 3,
                name: 'Purchase Journal',
                code: 'P',
                debit: 2,
                credit: 2,
                balance: 2
            }
        ]
    }
}
