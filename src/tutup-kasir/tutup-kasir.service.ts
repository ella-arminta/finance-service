import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/base.service';
import { TutupKasir } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class TutupKasirService extends BaseService<TutupKasir> {
  constructor(db: DatabaseService) {
      const relations = {
      }
      super('tutupKasir', db, relations);
    }

  async countTutupKasir(store_id: string, year: number, month: number) {
    const count = await this.db.trans.count({
      where: {
        store_id: store_id,
        code: {
          startsWith: 'TK/' + year.toString().slice(-2) + month.toString().padStart(2, '0'),
        },
      },
    });

    return count;
  }
}
