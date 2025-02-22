import { Injectable } from '@nestjs/common';
import { Stock_Source } from '@prisma/client';
import { BaseService } from 'src/common/base.service';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class StockSourceService extends BaseService<Stock_Source> {
    constructor(
        db: DatabaseService,
    ) {
        const relations = {
        }
        super('stock_Source', db, relations);
    }
}
