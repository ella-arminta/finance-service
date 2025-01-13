import { Injectable } from '@nestjs/common';
import { Accounts } from '@prisma/client';
import { BaseService } from 'src/common/base.service';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class AccountsService extends BaseService<Accounts> {
  constructor(db: DatabaseService) {
    const relations = {
      store: true,
    }
    super('accounts', db, relations);
  }

  // addfunctionview
  // async findByEmail(id: number) {
  //   return this.db.accounts.findUnique({ where: { id } });
  // }
}
