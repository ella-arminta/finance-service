import { Inject, Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/base.service';
import { Stores } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class StoresService extends BaseService<Stores>{
  constructor(
    db: DatabaseService,
  ) {
    const relations = {
      company: true,
    }
    super('stores', db, relations, true);
  }
}
