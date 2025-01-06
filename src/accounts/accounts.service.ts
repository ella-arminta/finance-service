import { Injectable } from '@nestjs/common';
import { Accounts } from '@prisma/client';
import { BaseService } from 'src/common/base.service';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class AccountsService extends BaseService<Accounts> {
  constructor(db: DatabaseService) {
    super('accounts', db);
  }

  // addfunctionview
  async findByEmail(id: number) {
    return this.db.accounts.findUnique({ where: { id } });
  }
}
