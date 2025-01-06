import { Injectable } from '@nestjs/common';
import { Companies } from '@prisma/client';
import { BaseService } from 'src/common/base.service';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class CompaniesService extends BaseService<Companies> {
  constructor(db: DatabaseService) {
    super('companies', db);
  }
}
