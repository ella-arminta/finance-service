import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AccountsService {
  constructor(private readonly databaseService: DatabaseService) {}
  async create(createAccountDto: Prisma.AccountsCreateInput) {
    return  this.databaseService.accounts.create({
      data: createAccountDto
    })
  }

  async findAll() {
    return this.databaseService.accounts.findMany({});
  }

  async findOne(id: number) {
    return this.databaseService.accounts.findUnique({
      where: {
        account_id : id
      }
    })
  }

  async update(id: number, updateAccountDto: Prisma.AccountsUpdateInput) {
    return this.databaseService.accounts.update({
      where: {
        account_id: id
      },
      data: updateAccountDto
    });
  }

  async remove(id: number) {
    return this.databaseService.accounts.delete({
      where: {
        account_id: id
      }
    });
  }
}
