import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Inject,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { Prisma } from '@prisma/client';
import { ValidationService } from '../common/validation.service';
import { AccountValidation } from './account.validation';
import { ResponseDto } from 'src/common/response.dto';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { Describe } from '../decorator/describe.decorator';
import { StoresService } from 'src/stores/stores.service';
import { Client } from '@nestjs/microservices/external/nats-client.interface';
import { RmqHelper } from 'src/helper/rmq.helper';

@Controller('accounts')
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private validationService: ValidationService,
    private readonly storeService: StoresService,
    private readonly accountValidation: AccountValidation,
  ) {}

  @MessagePattern({ cmd: 'post:account' })
  @Describe({
    description: 'Create a new account',
    fe: ['master/account:add'],
  })
  async create(@Payload() data: any) {
    // console.log('data in create account', data);
    // data in create account {
    //   params: {
    //     '0': 'account',
    //     service: 'finance',
    //     user: {
    //       id: '4c941698-5246-43cc-8983-0ca0cf7f48c4',
    //       email: 'leonardo.andrianto@petra.ac.id',
    //       is_owner: true,
    //       timestamp: '2025-06-22T12:26:23.493Z',
    //       iat: 1750595183,
    //       exp: 1750681583
    //     }
    //   },
    //   body: {
    //     auth: {
    //       company_id: 'ff188ca1-625f-4c5b-98a8-02a71b3144b7',
    //       store_id: 'efdbb3b7-1438-445a-b608-9586cdbe7ca6'
    //     },
    //     owner_id: '4c941698-5246-43cc-8983-0ca0cf7f48c4',
    //     code: 30002,
    //     name: 'Modal Owner hehe',
    //     description: '',
    //     company_id: 'ff188ca1-625f-4c5b-98a8-02a71b3144b7',
    //     account_type_id: 6,
    //     store_id: '71f41205-5dcf-4001-8d0f-a40cfb362b34'
    //   },
    //   method: 'POST'
    // }
    var newdata = data.body;

    newdata = await this.validationService.validate(
      this.accountValidation.CREATE,
      newdata,
    );
    newdata.created_by = data.params.user.id;

    // code id unique in company_id
    var codeValidated = await this.accountsService.findAll(
      { code: newdata.code, company_id: newdata.company_id },
      true,
    );
    if (codeValidated.length > 0) {
      return ResponseDto.error(
        'Code already exists in the company!',
        [
          {
            message: 'Code already exists in the company!',
            field: 'code',
            code: 'already_exists',
          },
        ],
        400,
      );
    }
    // name unique in company_id
    if (newdata.name) {
      var nameValidated = await this.accountsService.findAll(
        { name: newdata.name, company_id: newdata.company_id },
        true,
      );
      if (nameValidated.length > 0) {
        return ResponseDto.error(
          'Name already exists in the company!',
          [
            {
              message: 'Name already exists in the company!',
              field: 'name',
              code: 'already_exists',
            },
          ],
          400,
        );
      }
    }

    if (newdata.store_id) {
      var store = await this.storeService.findOne(newdata.store_id);
      if (!store) {
        return ResponseDto.error(
          'Store ID does not exist!',
          [
            {
              message: 'Store ID does not exist!',
              field: 'store_id',
              code: 'not_exists',
            },
          ],
          400,
        );
      }
      newdata.company_id = store.company_id;
    }

    newdata = await this.accountsService.create(newdata, data.params.user.id);
    return ResponseDto.success('Data Created!', newdata, 201);
  }

  @MessagePattern({ cmd: 'get:account' })
  @Describe({
    description: 'Get all account',
    fe: [
      'master/account:open',
      'inventory/operation:open',
      'inventory/operation:add',
      'inventory/operation:edit',
      'inventory/operation:detail',
      'transaction/purchase:add',
      'transaction/purchase:edit',
      'transaction/trade:add',
      'transaction/trade:edit',
    ],
  })
  async findAll(@Payload() data: any) {
    const params = data.params;
    var filters = data.body || {};

    if (!filters.company_id) {
      filters.company_id = filters.auth?.company_id;
    }

    // 🌟 Handle account_type_id: number or array
    if (
      filters.account_type_id !== undefined &&
      filters.account_type_id !== null
    ) {
      if (Array.isArray(filters.account_type_id)) {
        // Check if all values in the array are numbers
        const allNumbers = filters.account_type_id.every(
          (val) => !isNaN(parseInt(val)),
        );
        if (!allNumbers) {
          return ResponseDto.error(
            'Account type ID must be a number!',
            [
              {
                message: 'Account type ID in array must be a number!',
                field: 'account_type_id',
                code: 'not_number',
              },
            ],
            400,
          );
        }
        filters.account_type_id = {
          in: filters.account_type_id.map((val) => parseInt(val)),
        };
      } else {
        const parsed = parseInt(filters.account_type_id);
        if (isNaN(parsed)) {
          return ResponseDto.error(
            'Account type ID must be a number!',
            [
              {
                message: 'Account type ID must be a number!',
                field: 'account_type_id',
                code: 'not_number',
              },
            ],
            400,
          );
        }
        filters.account_type_id = parsed;
      }
    }
    filters = await this.validationService.validate(
      this.accountValidation.FILTERS,
      filters,
    );
    console.log('filters get account', filters);
    const dataResult = await this.accountsService.findAll(filters);
    return ResponseDto.success('Data Found!', dataResult, 200);
  }

  @MessagePattern({ cmd: 'get:account/*' })
  @Describe({
    description: 'Get account by id',
    fe: [
      'master/account:edit',
      'master/account:detail',
      'inventory/operation:open',
      'inventory/operation:add',
      'inventory/operation:edit',
      'inventory/operation:detail',
    ],
  })
  async findOne(@Payload() data: any) {
    const param = data.params;
    data = await this.accountsService.findOne(param.id);
    return ResponseDto.success('Data Found!', data, 200);
  }

  @MessagePattern({ cmd: 'put:account/*' })
  @Describe({
    description: 'update account by id',
    fe: ['master/account:edit'],
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
      var nameValidated = await this.accountsService.findAll(
        { name: newData.name, company_id: company_id },
        true,
      );
      if (nameValidated.length > 0) {
        return ResponseDto.error(
          'Name already exists in the company!',
          {
            message: 'Name already exists in the company!',
            field: 'name',
            code: 'already_exists',
          },
          400,
        );
      }
    }
    var validatedData = await this.validationService.validate(
      this.accountValidation.UPDATE,
      newData,
    );
    // code id unique in company_id
    if (validatedData.code != prevData.code) {
      var codeValidated = await this.accountsService.findAll(
        { code: validatedData.code, company_id: validatedData.company_id },
        true,
      );
      if (codeValidated.length > 0) {
        return ResponseDto.error(
          'Code already exists in the company!',
          [
            {
              message: 'Code already exists in the company!',
              field: 'code',
              code: 'already_exists',
            },
          ],
          400,
        );
      }
    }
    var updatedData = await this.accountsService.update(
      param.id,
      validatedData,
      param.user.id,
    );
    if (updatedData) {
      RmqHelper.publishEvent('account.updated', {
        data: updatedData,
        user: param.user.id,
      });
    }
    return ResponseDto.success('Data Updated!', updatedData, 201);
  }

  @MessagePattern({ cmd: 'delete:account/*' })
  @Describe({
    description: 'Delete account',
    fe: ['master/account:delete'],
  })
  async remove(@Payload() data: any) {
    const param = data.params;
    const deletedData = await this.accountsService.delete(
      param.id,
      param.user.id,
    );
    if (!deletedData) {
      return ResponseDto.error('Data not found!', null, 404);
    }

    if (deletedData) {
      RmqHelper.publishEvent('account.deleted', {
        data: deletedData.id,
        user: param.user.id,
      });
    }

    return ResponseDto.success('Data Deleted!', deletedData, 200);
  }

  @MessagePattern({ cmd: 'post:account-default-comp' })
  @Describe({
    description: 'post account default company',
    fe: [],
  })
  async generateDefaultAccountsByComp(@Payload() data: any) {
    const company_id = data.body.company_id;
    var newData =
      await this.accountsService.generateDefaultAccountsByComp(company_id);
    return ResponseDto.success('Default Account Created!', newData, 201);
  }

  @MessagePattern({ cmd: 'post:account-default-store' })
  @Describe({
    description: 'post account default store',
    fe: [],
  })
  async generateDefaultAccountsByStore(@Payload() data: any) {
    const store_id = data.body.store_id;
    var newData =
      await this.accountsService.generateDefaultAccountsByStore(store_id);
    return ResponseDto.success('Default Account Created!', newData, 201);
  }
}
