import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { Prisma } from '@prisma/client';
import { ValidationService } from '../common/validation.service';
import { AccountValidation } from './account.validation';
import { ResponseDto } from 'src/common/response.dto';

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
    return new ResponseDto(data, 'success', 201);
  }

  @Get()
  findAll() {
    return this.accountsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.accountsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateAccountDto: any) {
    return this.accountsService.update(+id, updateAccountDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.accountsService.delete(+id);
  }
}
