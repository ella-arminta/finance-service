import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { Prisma } from '@prisma/client';
import { ValidationService } from 'src/common/validation.service';
import { AccountValidation } from './account.validation';

@Controller('accounts')
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private validationService: ValidationService,
  ) {}

  @Post()
  async create(@Body() createAccountDto: Prisma.AccountsCreateInput) {
    var data = this.validationService.validate(AccountValidation.CREATE, createAccountDto);
    data = await this.accountsService.create(data);
    return  {
      error: [],
      message: 'success',
      statusCode : 200,
      data
    }
  }

  @Get()
  findAll() {
    return this.accountsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAccountDto: Prisma.AccountsUpdateInput) {
    return this.accountsService.update(+id, updateAccountDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountsService.remove(+id);
  }
}
