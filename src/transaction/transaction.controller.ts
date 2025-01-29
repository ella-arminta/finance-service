import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TransactionService } from './transaction.service';
import { Describe } from 'src/decorator/describe.decorator';
import { ValidationService } from 'src/common/validation.service';
import { TransactionValidation } from './transaction.validaton';
import { ResponseDto } from 'src/common/response.dto';
import { TransTypeService } from 'src/trans-type/trans-type.service';
import { validate } from 'class-validator';
import { filter } from 'rxjs';

@Controller()
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly validateService: ValidationService,
    private readonly transactionValidation: TransactionValidation,
    private readonly transTypeService: TransTypeService
  ) {}

  @MessagePattern({ cmd: 'post:uang-keluar-masuk' })
  @Describe('Create a new transaction uang keluar or masuk lain')
  async uangKeluarMasuk(@Payload() data: any) {
    var newdata = data.body;
    const params = data.params;
    
    //GENERATE TRANSACTION CODE  format : UKL/YYMM/00001 
    if (!newdata.trans_type_id) {
      return ResponseDto.error('Transaction Type Not Found!', 
      [{
        message: 'Transaction Type Not Found!',
        field: 'trans_type_id',
        code: 'not_found',
      }], 400);
    }
    const transtype = await this.transTypeService.findOne(newdata.trans_type_id);
    if (!transtype) {
      return ResponseDto.error('Transaction Type Not Found!', 
        [{
          message: 'Transaction Type Not Found!',
          field: 'trans_type_id',
          code: 'not_found',
        }], 400);
      }
    var store_id =  (params.user.store_id && params.user.store_id.length > 0) ? params.user.store_id[0] : 'ea9bd13a-2ba6-4ec1-9bbf-225131d77ded';
    if (newdata.store_id) {
      store_id = newdata.store_id;
    }
    console.log('store_id nih', store_id);
    var transactionCode = await this.transactionService.getTransCode(transtype, store_id);

    var sanitizedData = {
      ...newdata,
      account_cash_id: newdata.account_cash_id.length > 0 ? newdata.account_cash_id[0] : '',
      code: transactionCode,
      store_id: store_id,
      created_by: params.user.id,
      updated_by: params.user.id,
      trans_date: new Date(newdata.trans_date),
    }

    var validatedData = await this.validateService.validate(this.transactionValidation.CREATE, sanitizedData);
    
    // Reformat data
    if (validatedData.trans_type_id == 1) { //uang keluar
      validatedData.accounts = validatedData.accounts.map((account) => {
        account.amount = Math.abs(account.amount);
        return account;
      });
      validatedData.total = Math.abs(validatedData.total) * -1;
    } else { // uang masuk
      validatedData.accounts = validatedData.accounts.map((account) => {
        account.amount = Math.abs(account.amount) * -1;
        return account;
      });
      validatedData.total = Math.abs(validatedData.total);
    }
    validatedData.accounts.push({
      account_id: validatedData.account_cash_id,
      amount: validatedData.total,
      kas: true,
      description: ''
    })

    delete validatedData.account_cash_id;

    newdata = await this.transactionService.create(validatedData);
    return ResponseDto.success('Data Created!', newdata, 201);
  }


  @MessagePattern({ cmd: 'put:uang-keluar-masuk/*' })
  @Describe('Create a new transaction uang keluar or masuk lain')
  async uangKeluarMasukUpdate(@Payload() data: any) {
    var newdata = data.body;
    const params = data.params;

    var sanitizedData = {
      ...newdata,
      account_cash_id: newdata.account_cash_id.length > 0 ? newdata.account_cash_id[0] : '',
      updated_by: params.user.id,
      updated_at: new Date(),
    }

    var validatedData = await this.validateService.validate(this.transactionValidation.UPDATE, sanitizedData);

    // Reformat data
    if (validatedData.trans_type_id == 1) { //uang keluar
      validatedData.accounts = validatedData.accounts.map((account) => {
        account.amount = Math.abs(account.amount);
        return account;
      });
      validatedData.total = Math.abs(validatedData.total) * -1;
    } else { // uang masuk
      validatedData.accounts = validatedData.accounts.map((account) => {
        account.amount = Math.abs(account.amount) * -1;
        return account;
      });
      validatedData.total = Math.abs(validatedData.total);
    }
    validatedData.accounts.push({
      account_id: validatedData.account_cash_id,
      amount: validatedData.total,
      kas: true,
      description: ''
    })
    delete validatedData.account_cash_id;
    console.log('validatedData', validatedData);

    newdata = await this.transactionService.update(params.id, validatedData);
    return ResponseDto.success('Data Created!', newdata, 201);
  }

  @MessagePattern({ cmd: 'get:uang-keluar-masuk' })
  @Describe('Get Transaction uang keluar masuk')
  async getUangKeluarMasuk(@Payload() data:any) {
    const params = data.params;
    const filters = data.body;
    var filtersValidated = await this.validateService.validate(this.transactionValidation.FILTER, filters);
    console.log('filtersValidated', filtersValidated);
    const datas =  await this.transactionService.getReportUangKeluarMasuk(filtersValidated);

    return ResponseDto.success('Data Retrieved!', datas, 200);
  }
  

  @MessagePattern({ cmd: 'get:trans-code' })
  @Describe('Get Transaction Code')
  async getTransCode(@Payload() data:any) {
    const newdata = data.body;
    const params = data.params;
    newdata.trans_type_id = parseInt(newdata.trans_type_id);
    console.log('hai', newdata); 
    const transType = await this.transTypeService.findOne(newdata.trans_type_id);
    if (!transType) {
      return ResponseDto.error('Transaction Type Not Found!', 
        [{
          message: 'Transaction Type Not Found!',
          field: 'trans_type_id',
          code: 'not_found',
        }], 400);
    }
    var store_id =  (params.user.store_id && params.user.store_id.length > 0) ? params.user.store_id[0] : 'ea9bd13a-2ba6-4ec1-9bbf-225131d77ded';
    if (newdata.store_id) {
      store_id = newdata.store_id;
    }
    const getData = await this.transactionService.getTransCode(transType, store_id);
    return ResponseDto.success('Data Retrieved!', getData, 200);
  }

  
  @MessagePattern({ cmd: 'get:transaction' })
  @Describe('Get All Transaction')
  async findAll(@Payload() data: any) {
    const params = data.params;
    const filters = data.body;
    var filtersValidated = await this.validateService.validate(this.transactionValidation.FILTER, filters);
    if (filtersValidated.start_date) {
      filtersValidated.trans_date.gt = new Date(filtersValidated.start_date);
      delete filtersValidated.start_date;
    } else if (filtersValidated.end_date) {
      filtersValidated.trans_date.lte = new Date(filtersValidated.end_date);
      delete filtersValidated.end_date;
    }
    const datas =  await this.transactionService.findAll(filters);
    return ResponseDto.success('Data Retrieved!', datas, 200);
  }

  @MessagePattern({ cmd: 'get:transaction/*' })
  @Describe('Get All Transaction')
  async findOne(@Payload() data: any) {
    const params = data.params;
    const datas =  await this.transactionService.findOne(params.id);
    return ResponseDto.success('Data Retrieved!', datas, 200);
  }

  @MessagePattern({ cmd: 'delete:transaction/*' })
  @Describe('Delete Transaction')
  async deleteTransaction(@Payload() data:any) {
    const params = data.params;
    const id = params.id;
    const transaction = await this.transactionService.findOne(id);
    if (!transaction) {
      return ResponseDto.error('Transaction Not Found!', 
        [{
          message: 'Transaction Not Found!',
          field: 'id',
          code: 'not_found',
        }], 400);
    }
    await this.transactionService.delete(id);
    return ResponseDto.success('Data Deleted!', {}, 200);
  }

  @MessagePattern({ cmd: 'put:trans/*' })
  @Describe('update transaction by id')
  async update(@Payload() data: any) {
    // return this.transactionService.update(updateTransactionDto.id, updateTransactionDto);
  }

  @MessagePattern({ cmd: 'delete:trans/*' })
  @Describe('delete transaction by id')
  async remove(@Payload() id: number) {
    // return this.transactionService.remove(id);
  }
}
