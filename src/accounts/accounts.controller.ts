import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { Prisma } from '@prisma/client';
import { ValidationService } from '../common/validation.service';
import { AccountValidation } from './account.validation';
import { ResponseDto } from 'src/common/response.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Describe } from '../decorator/describe.decorator';

@Controller('accounts')
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private validationService: ValidationService,
  ) {}

  @MessagePattern({ cmd: 'post:account' })
  @Describe('Create a new account')
  async create(@Payload() data: any) {
      data = this.validationService.validate(AccountValidation.CREATE, data);
      data = await this.accountsService.create(data);
      return ResponseDto.success('Data Found!', data, 200);
  }

  @MessagePattern({ cmd: 'get:account' })
  @Describe('Get all account')
  async findAll(payload: Record<string, any>) {
    const filters = payload.filters || {}; // Extract filters from the payload
    const data = await this.accountsService.findAll(filters); // Pass filters to the service
    return ResponseDto.success('Data Found!', data, 200);
  }
  

  @MessagePattern({ cmd: 'get:account/*' })
  @Describe('Get a account by id')
  async findOne(@Payload() data: any) {
    const param = data.params;
    param.id = parseInt(param.id);
    data =  await this.accountsService.findOne(param.id);
    return ResponseDto.success('Data Found!', data, 200);
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
