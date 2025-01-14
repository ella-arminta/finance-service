import { Injectable } from '@nestjs/common';
import { Account_Types } from '@prisma/client';
import { BaseService } from 'src/common/base.service';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class AccountTypesService extends BaseService<Account_Types> {
  constructor(db: DatabaseService) {
    const relations = {
    }
    super('account_Types', db, relations, true);
  }

}
