import { Injectable } from '@nestjs/common';
import { Trans_Type } from '@prisma/client';
import { BaseService } from 'src/common/base.service';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class TransTypeService extends BaseService<Trans_Type> {
  constructor(db: DatabaseService) {
    const relations = {
    }
    super('trans_Type', db, relations);
  }
}
