import { Injectable } from '@nestjs/common';
import { Operations } from '@prisma/client';
import { BaseService } from 'src/common/base.service';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class OperationService extends BaseService<Operations> {
    constructor(
        db: DatabaseService,
    ) {
    const relations = {
        store: true,
        account: true,
    }
    super('operations', db, relations, true);
    }
}
