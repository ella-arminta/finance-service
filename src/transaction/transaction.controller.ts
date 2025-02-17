import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { TransactionService } from './transaction.service';
import { Describe } from 'src/decorator/describe.decorator';
import { ValidationService } from 'src/common/validation.service';
import { TransactionValidation } from './transaction.validaton';
import { ResponseDto } from 'src/common/response.dto';
import { TransTypeService } from 'src/trans-type/trans-type.service';
import { validate } from 'class-validator';
import { filter } from 'rxjs';
import { Exempt } from 'src/decorator/exempt.decorator';

@Controller()
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly validateService: ValidationService,
    private readonly transactionValidation: TransactionValidation,
    private readonly transTypeService: TransTypeService
  ) {}

  @MessagePattern({ cmd: 'post:uang-keluar-masuk' })
  @Describe({
    description: 'Create a new transaction uang keluar or masuk lain',
    fe: [
      'finance/mexpenses:add',
      'finance/mincomes:add',
    ]
  })
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
    var store_id = newdata.auth.store_id;
    if (newdata.store_id) {
      store_id = newdata.store_id;
    }
    var transactionCode = await this.transactionService.getTransCode(transtype, store_id);

    // SANITIZE DATA
    var sanitizedData = {
      ...newdata,
      account_cash_id: newdata.account_cash_id.length > 0 ? newdata.account_cash_id[0] : '',
      code: transactionCode,
      store_id: store_id,
      created_by: params.user.id,
      updated_by: params.user.id,
      trans_date: new Date(newdata.trans_date),
    }

    // RECURRING SETTINGS
    if (sanitizedData.recurring) {
      // VALIDATE
      if (!sanitizedData.recurring_period_code) {
        return ResponseDto.error('Recurring Period Not Found!', 
          [{
            message: 'Recurring period must be filled if recurring is checked!',
            field: 'recurring_period_code',
            code: 'not_found',
          }], 400);
      }
    }
    const recurring = sanitizedData.recurring;

    // VALIDATE DATA
    var validatedData = await this.validateService.validate(this.transactionValidation.CREATE, sanitizedData);
    
    const recurring_period = validatedData.recurring_period_code;

    // REFORMAT DATA
    if (validatedData.trans_type_id == 1) { // UANG KELUAR
      validatedData.accounts = validatedData.accounts.map((account) => {
        account.amount = Math.abs(account.amount);
        return account;
      });
      validatedData.total = Math.abs(validatedData.total) * -1;
    } else { // UANG MASUK
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

    // CREATE TRANSACTION
    newdata = await this.transactionService.create(validatedData);
    
    // RECURRING
    if (recurring) {
      var newRecurring = await this.transactionService.createRecurring(validatedData);
    }

    return ResponseDto.success('Data Created!', newdata, 201);
  }


  @MessagePattern({ cmd: 'put:uang-keluar-masuk/*' })
  @Describe({
    description: 'Update transaction uang keluar or masuk lain',
    fe: [
      'finance/mexpenses:edit',
      'finance/mincomes:edit',
    ]
  })
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

    newdata = await this.transactionService.update(params.id, validatedData);
    return ResponseDto.success('Data Created!', newdata, 201);
  }

  // Set status approve / disapprove / draft
  @MessagePattern({ cmd: 'put:uang-keluar-masuk-approve/*' })
  @Describe({
    description: 'Update transaction uang keluar or masuk lain',
    fe: [
      'finance/mexpenses:approve',
      'finance/mincomes:approve',
    ]
  })
  async uangKeluarMasukApprove(@Payload() data: any) {
    var newdata = data.body;
    const params = data.params;
    var newstatus = newdata.approve;
    
    // Validation
    if (!Number.isInteger(newstatus) || newstatus < 0 || newstatus > 2) {
      return ResponseDto.error('Status not valid!', 
        [{
          message: 'Status not valid!',
          field: 'approve',
          code: 'not_valid',
        }], 400);
    }

    newdata = await this.transactionService.updateStatus(params.id, newstatus);
    return ResponseDto.success('Data Updated!', newdata, 201);
  }
  @MessagePattern({ cmd: 'put:uang-keluar-masuk-disapprove/*' })
  @Describe({
    description: 'Update transaction uang keluar or masuk lain',
    fe: [
      'finance/mexpenses:disapprove',
      'finance/mincomes:disapprove',
    ]
  })
  async uangKeluarMasukDisapprove(@Payload() data: any) {
    var newdata = data.body;
    const params = data.params;
    var newstatus = newdata.approve;
    
    // Validation
    if (!Number.isInteger(newstatus) || newstatus < 0 || newstatus > 2) {
      return ResponseDto.error('Status not valid!', 
        [{
          message: 'Status not valid!',
          field: 'approve',
          code: 'not_valid',
        }], 400);
    }

    newdata = await this.transactionService.updateStatus(params.id, newstatus);
    return ResponseDto.success('Data Updated!', newdata, 201);
  }

  @MessagePattern({ cmd: 'get:uang-keluar-masuk' })
  @Describe({
    description: 'Get Transaction uang keluar masuk',
    fe: [
      'finance/mexpenses:open',
      'finance/mincomes:open',
      'finance/mexpenses:detail',
      'finance/mincomes:detail',
    ]
  })
  async getUangKeluarMasuk(@Payload() data:any) {
    const params = data.params;
    const filters = data.body;
    var filtersValidated = await this.validateService.validate(this.transactionValidation.FILTER, filters);
    const datas =  await this.transactionService.getReportUangKeluarMasuk(filtersValidated);

    return ResponseDto.success('Data Retrieved!', datas, 200);
  }
  

  @MessagePattern({ cmd: 'get:trans-code' })
  @Describe({
    description: 'Get Transaction Code',
    fe: [
      'finance/mexpenses:open',
      'finance/mincomes:open',
      'finance/mexpenses:add',
      'finance/mincomes:add',
    ]
  })
  async getTransCode(@Payload() data:any) {
    const newdata = data.body;
    const params = data.params;
    newdata.trans_type_id = parseInt(newdata.trans_type_id);
    const transType = await this.transTypeService.findOne(newdata.trans_type_id);
    if (!transType) {
      return ResponseDto.error('Transaction Type Not Found!', 
        [{
          message: 'Transaction Type Not Found!',
          field: 'trans_type_id',
          code: 'not_found',
        }], 400);
    }
    var store_id =  newdata.auth.store_id;
    if (newdata.store_id) {
      store_id = newdata.store_id;
    }
    const getData = await this.transactionService.getTransCode(transType, store_id);
    return ResponseDto.success('Data Retrieved!', getData, 200);
  }

  
  @MessagePattern({ cmd: 'get:transaction' })
  @Describe({
    description: 'Get All Transaction',
    fe: []
  })
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
  @Describe({
    description: 'Get All Transaction',
    fe: []
  })
  async findOne(@Payload() data: any) {
    const params = data.params;
    const datas =  await this.transactionService.findOne(params.id);
    return ResponseDto.success('Data Retrieved!', datas, 200);
  }

  @MessagePattern({ cmd: 'delete:transaction/*' })
  @Describe({
    description: 'Delete Transaction',
    fe: [
      'finance/mexpenses:delete',
      'finance/mincomes:delete',
    ]
  })
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

  @EventPattern({ cmd: 'transaction_created' })
  @Exempt()  
  async createTrans(@Payload() data: any) {
    // Transaction details [
    //   {
    //     id: 'd7b0dafd-b23c-41b3-b34a-6dc6ab0bcf84',
    //     transaction_id: '3cd6d626-caf3-4119-93c4-bcf21b006750',
    //     product_code_id: 'e6a2dec4-076f-409a-aec6-558c76e047b0',
    //     transaction_type: 1, 1: Sales, 2: Purchase, 3: Trade
    //     name: 'INS0010100010001 - Tipe A Hello Kity Cincin',
    //     type: 'INS00101 - Cincin',
    //     weight: 46,
    //     price: 100000,
    //     adjustment_price: 0,
    //     discount: 0,
    //     total_price: 4600000,
    //     status: 2,
    //     comment: null,
    //     created_at: 2025-02-12T07:11:33.689Z,
    //     updated_at: 2025-02-12T07:11:33.689Z,
    //     deleted_at: null
    //   },
    //   {
    //     id: '3377e10c-716b-4870-a5c8-c09cad9a35d6',
    //     transaction_id: '3cd6d626-caf3-4119-93c4-bcf21b006750',
    //     operation_id: '2702c9f8-65e1-48ed-90fe-e2ca1dfa5e74',
    //     name: 'SUBOP001 - Reparasi',
    //     type: 'Operation',
    //     unit: 1,
    //     price: 2000,
    //     adjustment_price: 0,
    //     total_price: 2000,
    //     comment: null,
    //     created_at: 2025-02-12T07:11:33.704Z,
    //     updated_at: 2025-02-12T07:11:33.704Z,
    //     deleted_at: null
    //   }
    // ]
    // this is reponse format CustomResponse {
    //   success: true,
    //   statusCode: 200,
    //   message: 'Transaction created successfully',
    //   data: {
    //     auth: {
    //       company_id: 'bb0471e8-ba93-4edc-8dea-4ccac84bd2a2',
    //       store_id: 'edd09595-33d4-4e81-9e88-14b47612bee9'
    //     },
    //     owner_id: 'd643abb7-2944-4412-8bb5-5475679f5ade',
    //     code: 'SAL/SUB/2025/1/12/007',
    //     employee: '',
    //     date: '2025-02-12',
    //     customer_id: 'edd09595-33d4-4e81-9e88-14b47612bee8',
    //     name: 'customer1',
    //     email: 'customer@gmail.com',
    //     phone: '089681551106',
    //     store_id: 'edd09595-33d4-4e81-9e88-14b47612bee9',
    //     employee_id: 'd643abb7-2944-4412-8bb5-5475679f5ade',
    //     payment_method: 1,
    //     transaction_type: 1,
    //     transaction_details: [ [Object], [Object] ],
    //     weight_total: 46,
    //     sub_total_price: 4602000,
    //     tax_price: 1012220,
    //     total_price: 5614220,
    //     status: 0,
    //     paid_amount: 5614220
    //   },
    //   errors: null
    // }
    var newdata = data.data;
    // SALES
    if (newdata.transaction_type == 1) {
      var savedData = await this.transactionService.createSales(newdata);
    }
  }

  @MessagePattern({ cmd: 'put:trans/*' })
  @Describe({
    description: 'update transaction by id',
    fe: []
  })
  async update(@Payload() data: any) {
    // return this.transactionService.update(updateTransactionDto.id, updateTransactionDto);
  }
}
