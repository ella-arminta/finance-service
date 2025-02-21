import { Injectable } from '@nestjs/common';
import { Report_Stocks } from '@prisma/client';
import { BaseService } from 'src/common/base.service';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ReportStocksService extends BaseService<Report_Stocks> {
    constructor(
        db: DatabaseService,
    ) {
        const relations = {
        }
        super('report_Stocks', db, relations);
    }
}
