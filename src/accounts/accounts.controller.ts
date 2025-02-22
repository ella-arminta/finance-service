import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Inject } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { Prisma } from '@prisma/client';
import { ValidationService } from '../common/validation.service';
import { AccountValidation } from './account.validation';
import { ResponseDto } from 'src/common/response.dto';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { Describe } from '../decorator/describe.decorator';
import { StoresService } from 'src/stores/stores.service';
import { Client } from '@nestjs/microservices/external/nats-client.interface';

@Controller('accounts')
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private validationService: ValidationService,
    private readonly storeService: StoresService,
    private readonly accountValidation: AccountValidation,
    @Inject('TRANSACTION') private readonly transClient: ClientProxy,
    @Inject('INVENTORY') private readonly inventoryClient: ClientProxy,
  ) {}

  @MessagePattern({ cmd: 'post:account'  })
  @Describe({
    description:'Create a new account', 
    fe: ['master/account:add']
  })
  async create(@Payload() data: any) {
    var newdata = data.body;

    newdata = await this.validationService.validate(this.accountValidation.CREATE, newdata);

    // code id unique in company_id
    var codeValidated = await this.accountsService.findAll({ code: newdata.code, company_id: newdata.company_id }, true);
    if (codeValidated.length > 0) {
      return ResponseDto.error('Code already exists in the company!', [{
        message: 'Code already exists in the company!',
        field: 'code',
        code: 'already_exists',
      }], 400);
    }
    // name unique in company_id
    if (newdata.name) {
      var nameValidated = await this.accountsService.findAll({ name: newdata.name, company_id: newdata.company_id }, true);
      if (nameValidated.length > 0) {
        return ResponseDto.error('Name already exists in the company!', [{
          message: 'Name already exists in the company!',
          field: 'name',
          code: 'already_exists',
        }], 400);
      }
    }

    if (newdata.store_id) {
      var store = await this.storeService.findOne(newdata.store_id);
      if (!store) {
        return ResponseDto.error('Store ID does not exist!', [{
          message: 'Store ID does not exist!',
          field: 'store_id',
          code: 'not_exists',
        }], 400);
      }
      newdata.company_id = store.company_id;
    }

    newdata = await this.accountsService.create(newdata);
    if (newdata) {
      this.transClient.emit({ cmd: 'account_created' }, newdata);
      this.inventoryClient.emit({ cmd: 'account_created' }, newdata);
    }
    return ResponseDto.success('Data Created!', newdata, 201);
  }

  @MessagePattern({ cmd: 'get:account' })
  @Describe({
    description:'Get all account', 
    fe:[
      'master/account:open',
      'inventory/operation:open',
      'inventory/operation:add',
      'inventory/operation:edit',
      'inventory/operation:detail',
    ]
  })
  async findAll(@Payload() data: any) {
    const params = data.params;
    var filters =  data.body || {};
    // console.log('data', data);
    filters.company_id = filters.auth.company_id;

    if (filters.account_type_id) {
      try {
        filters.account_type_id = parseInt(filters.account_type_id);
      } catch (error) {
        return ResponseDto.error('Account type ID must be a number!', [{
          message: 'Account type ID must be a number!',
          field: 'account_type_id',
          code: 'not_number',
        }], 400);
      }
    }
    filters = await this.validationService.validate(this.accountValidation.FILTERS, filters);
    data = await this.accountsService.findAll(filters);
    return ResponseDto.success('Data Found!', data, 200);
  }
  

  @MessagePattern({ cmd: 'get:account/*' })
  @Describe({
    description:'Get account by id',
    fe: [
      'master/account:edit', 
      'master/account:detail',
      'inventory/operation:open',
      'inventory/operation:add',
      'inventory/operation:edit',
      'inventory/operation:detail',
    ]
  })
  async findOne(@Payload() data: any) {
    const param = data.params;
    data =  await this.accountsService.findOne(param.id);
    return ResponseDto.success('Data Found!', data, 200);
  }

  @MessagePattern({ cmd: 'put:account/*' })
  @Describe({
    description:'update account by id',
    fe: ['master/account:edit']
  })
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
    var validatedData = await this.validationService.validate(this.accountValidation.UPDATE, newData);
    // code id unique in company_id
    if (validatedData.code != prevData.code) {
      var codeValidated = await this.accountsService.findAll({ code: validatedData.code, company_id: validatedData.company_id }, true);
      if (codeValidated.length > 0) {
        return ResponseDto.error('Code already exists in the company!', [{
          message: 'Code already exists in the company!',
          field: 'code',
          code: 'already_exists',
        }], 400);
      }
    }
    var updatedData = await this.accountsService.update(param.id, validatedData);
    if (updatedData) {
      this.transClient.emit({ cmd: 'account_updated' }, updatedData);
    }
    return ResponseDto.success('Data Updated!', updatedData, 201);
  }

  @MessagePattern({ cmd: 'delete:account/*' })
  @Describe({
    description:'Delete account',
    fe: ['master/account:delete']
  })
  async remove(@Payload() data: any) {
    const param = data.params;
    const deletedData = await this.accountsService.delete(param.id);
    if (!deletedData) {
      return ResponseDto.error('Data not found!', null, 404);
    }

    if (deletedData) {
      this.transClient.emit({ cmd: 'account_deleted' }, deletedData.id);

    }
    return ResponseDto.success('Data Deleted!', deletedData, 200);
  }

  @MessagePattern({ cmd: 'post:account-default-comp' })
  @Describe({
    description:'post account default company',
    fe: []
  })
  async generateDefaultAccountsByComp(@Payload() data: any) {
    const company_id = data.body.company_id;
    var newData = await this.accountsService.generateDefaultAccountsByComp(company_id);
    return ResponseDto.success('Default Account Created!', newData, 201);
  }

  @MessagePattern({ cmd: 'post:account-default-store' })
  @Describe({
    description:'post account default store',
    fe: []
  })
  async generateDefaultAccountsByStore(@Payload() data: any) {
    const store_id = data.body.store_id;
    var newData = await this.accountsService.generateDefaultAccountsByStore(store_id);
    return ResponseDto.success('Default Account Created!', newData, 201);
  }
}
