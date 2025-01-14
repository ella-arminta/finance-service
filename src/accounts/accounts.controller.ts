import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { Prisma } from '@prisma/client';
import { ValidationService } from '../common/validation.service';
import { AccountValidation } from './account.validation';
import { ResponseDto } from 'src/common/response.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Describe } from '../decorator/describe.decorator';
import { StoresService } from 'src/stores/stores.service';

@Controller('accounts')
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private validationService: ValidationService,
    private readonly storeService: StoresService,
  ) {}

  @MessagePattern({ cmd: 'post:account' })
  @Describe('Create a new account')
  async create(@Payload() data: any) {
    var newdata = data.body;

    // code id unique in company_id
    var codeValidated = await this.accountsService.findAll({ code: newdata.code, company_id: newdata.company_id }, true);
    if (codeValidated.length > 0) {
      return ResponseDto.error('Code already exists in the company!', {
        message: 'Code already exists in the company!',
        field: 'code',
        code: 'already_exists',
      }, 400);
    }
    // name unique in company_id
    if (newdata.name) {
      var nameValidated = await this.accountsService.findAll({ name: newdata.name, company_id: newdata.company_id }, true);
      if (nameValidated.length > 0) {
        return ResponseDto.error('Name already exists in the company!', {
          message: 'Name already exists in the company!',
          field: 'name',
          code: 'already_exists',
        }, 400);
      }
    }

    if (newdata.store_id) {
      var store = await this.storeService.findOne(newdata.store_id);
      if (!store) {
        return ResponseDto.error('Store ID does not exist!', {
          message: 'Store ID does not exist!',
          field: 'store_id',
          code: 'not_exists',
        }, 400);
      }
      newdata.company_id = store.company_id;
    }

    newdata = await this.validationService.validate(AccountValidation.CREATE, newdata);
    newdata = await this.accountsService.create(newdata);
    return ResponseDto.success('Data Created!', newdata, 201);
  }

  @MessagePattern({ cmd: 'get:account' })
  @Describe('Get all account')
  async findAll(@Payload() data: any) {
    const params = data.params;
    var filters =  data.body || {};
    filters = await this.validationService.validate(AccountValidation.FILTERS, filters);
    data = await this.accountsService.findAll(filters);
    return ResponseDto.success('Data Found!', data, 200);
  }
  

  @MessagePattern({ cmd: 'get:account/*' })
  @Describe('Get a account by id')
  async findOne(@Payload() data: any) {
    const param = data.params;
    data =  await this.accountsService.findOne(param.id);
    return ResponseDto.success('Data Found!', data, 200);
  }

  @MessagePattern({ cmd: 'put:account/*' })
  @Describe('update account by id')
  async update(@Payload() data: any) {
    const param = data.params;
    const newData = data.body;

    const prevData = await this.accountsService.findOne(param.id);
    if (!prevData) {
      return ResponseDto.error('Data not found!', null, 404);
    }

    // Name unique in company_id
    if (newData.name && newData.name !== prevData.name) {
      var company_id = newData.company_id || prevData.company_id;
      var nameValidated = await this.accountsService.findAll({ name: newData.name, company_id: company_id }, true);
      if (nameValidated.length > 0) {
        return ResponseDto.error('Name already exists in the company!', {
          message: 'Name already exists in the company!',
          field: 'name',
          code: 'already_exists',
        }, 400);
      }
    }

    var validatedData = await this.validationService.validate(AccountValidation.UPDATE, newData);
    var updatedData = await this.accountsService.update(param.id, validatedData);
    return ResponseDto.success('Data Updated!', updatedData, 201);
  }

  @MessagePattern({ cmd: 'delete:account/*' })
  @Describe('Delete account')
  async remove(@Payload() data: any) {
    const param = data.params;
    const deletedData = await this.accountsService.delete(param.id);
    if (!deletedData) {
      return ResponseDto.error('Data not found!', null, 404);
    }
    return ResponseDto.success('Data Deleted!', deletedData, 200);
  }
}
