import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
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

  private async handleEvent(
    context: RmqContext,
    callback: () => Promise<{ data: any }>,
    errorMessage: string,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const response = await callback();
      console.log('response callback', response);
      // const response = true;
      if (response) {
        channel.ack(originalMsg);
      }
    } catch (error) {
      console.error(errorMessage, error.stack);
      channel.nack(originalMsg);
    }
  }

  @EventPattern({ cmd: 'transaction_created' })
  @Exempt()  
  async createTrans(@Payload() data: any, @Ctx() context: RmqContext) {
    // newdata {
    //   id: '8e0a4ce4-45a5-4ec8-b163-323e253d3f1b',
    //   date: '2025-02-18T00:00:00.000Z',
    //   code: 'SAL/SUB/2025/1/18/001',
    //   transaction_type: 1,
    //   payment_method: 1,
    //   paid_amount: '5108220',
    //   payment_link: null,
    //   poin_earned: 0,
    //   expired_at: null,
    //   status: 0,
    //   sub_total_price: '4602000',
    //   tax_price: '506220',
    //   total_price: '5108220',
    //   comment: null,
    //   store_id: 'edd09595-33d4-4e81-9e88-14b47612bee9',
    //   customer_id: 'edd09595-33d4-4e81-9e88-14b47612bee8',
    //   voucher_own_id: null,
    //   employee_id: 'd643abb7-2944-4412-8bb5-5475679f5ade',
    //   created_at: '2025-02-18T02:09:43.599Z',
    //   updated_at: '2025-02-18T02:09:43.599Z',
    //   deleted_at: null,
    //   transaction_details: [
    //     {
    //       id: '311f6f56-89bc-4615-bdeb-1e1f13bab01a',
    //       transaction_id: '8e0a4ce4-45a5-4ec8-b163-323e253d3f1b',
    //       product_code_id: 'e6a2dec4-076f-409a-aec6-558c76e047b0',
    //       transaction_type: 1,
    //       name: 'INS0010100010001 - Tipe A Hello Kity Cincin',
    //       type: 'INS00101 - Cincin',
    //       weight: '46',
    //       price: '100000',
    //       adjustment_price: '0',
    //       discount: '0',
    //       total_price: '4600000',
    //       status: 1,
    //       comment: null,
    //       created_at: '2025-02-18T02:09:43.626Z',
    //       updated_at: '2025-02-18T02:09:43.626Z',
    //       deleted_at: null,
    //       transaction: [Object]
    //     },
    //     {
    //       id: '25c00fdc-249c-4928-9a4d-7a3f7b92e94f',
    //       transaction_id: '8e0a4ce4-45a5-4ec8-b163-323e253d3f1b',
    //       operation_id: '2702c9f8-65e1-48ed-90fe-e2ca1dfa5e74',
    //       name: 'SUBOP001 - Reparasi',
    //       type: 'Operation',
    //       unit: '1',
    //       price: '2000',
    //       adjustment_price: '0',
    //       total_price: '2000',
    //       comment: null,
    //       created_at: '2025-02-18T02:09:43.655Z',
    //       updated_at: '2025-02-18T02:09:43.655Z',
    //       deleted_at: null,
    //       transaction: [Object],
    //       operation: 
    //     }
    //   ]
    // }
    var newdata = data.data;
    // validate new data
    newdata = await this.validateService.validate(this.transactionValidation.CREATESALES, newdata);
    console.log('validatedData', newdata);

    // SALES Trans
    if (newdata.transaction_type == 1) {
      await this.handleEvent(
        context,
        () => this.transactionService.createSales(newdata),
        'Error processing transaction_created event',
      )
    }
    // PURCHASE TRANS
    else if (newdata.transaction_type == 2) {

    }
    // TRADE TRANS
    else {

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
