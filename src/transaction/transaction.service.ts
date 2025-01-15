import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/base.service';
import { Trans } from '@prisma/client'
import { DatabaseService } from 'src/database/database.service';
@Injectable()
export class TransactionService extends BaseService<Trans> {
  constructor(db: DatabaseService) {
    const relations = {
    }
    super('trans', db, relations);
  }
}
