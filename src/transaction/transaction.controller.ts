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
import { LoggerService } from 'src/common/logger.service';
import { ReportService } from 'src/report-journals/report-journals.service';
import { ReportStocksService } from 'src/report-stocks/report-stocks.service';

@Controller()
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly validateService: ValidationService,
    private readonly transactionValidation: TransactionValidation,
    private readonly transTypeService: TransTypeService,
    private readonly loggerService: LoggerService,
    private readonly reportJournalsService: ReportService,
    private readonly reportStockService: ReportStocksService,
  ) {}

  private async handleEvent(
    context: RmqContext,
    callback: () => Promise<any>,
    errorMessage: string,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const maxRetries = 5;
    const headers = originalMsg.properties.headers || {};
    const retryCount = headers['x-retry-count'] ? headers['x-retry-count'] + 1 : 1;

    try {
      const response = await callback();
      if (response.success) {
        channel.ack(originalMsg);
      }
    } catch (error) {
      console.error(`${errorMessage}. Retry attempt: ${retryCount}`, error.stack);

      
      if (retryCount >= maxRetries) {
        console.error(`Max retries (${maxRetries}) reached. Logging error and acknowledging message.`);
        // Simpan log error ke file
        this.loggerService.logErrorToFile(errorMessage, error);
        // channel.ack(originalMsg);
      } else {
        console.warn(`Retrying message (${retryCount}/${maxRetries})...`);
        channel.sendToQueue(originalMsg.fields.routingKey, originalMsg.content, {
          persistent: true,
          headers: { ...headers, 'x-retry-count': retryCount },
        });
        channel.nack(originalMsg, false, false);
      }
    }
  }

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

  @EventPattern({ cmd: 'sales_approved' })
  @Exempt()  
  async createTrans(@Payload() data: any, @Ctx() context: RmqContext) {
    // newdata {
    //   id: '76861a32-62eb-42cf-b471-7925401087a4',
    //   date: '2025-02-12T00:00:00.000Z',
    //   code: 'SAL/SUB/2025/1/12/004',
    //   transaction_type: 1,
    //   payment_method: 2,
    //   paid_amount: '5108440',
    //   payment_link: null,
    //   poin_earned: 0,
    //   expired_at: null,
    //   status: 1,
    //   sub_total_price: '4602000',
    //   tax_price: '506440',
    //   total_price: '5108440',
    //   comment: null,
    //   store_id: 'edd09595-33d4-4e81-9e88-14b47612bee9',
    //   customer_id: 'edd09595-33d4-4e81-9e88-14b47612bee8',
    //   voucher_own_id: null,
    //   employee_id: 'd643abb7-2944-4412-8bb5-5475679f5ade',
    //   created_at: '2025-02-12T06:55:33.225Z',
    //   updated_at: '2025-02-22T08:21:51.223Z',
    //   deleted_at: null,
    //   approve: 1,
    //   approve_by: null,
    //   store: {
    //     id: 'edd09595-33d4-4e81-9e88-14b47612bee9',
    //     code: 'SUB',
    //     name: 'SURABAYA',
    //     company_id: 'bb0471e8-ba93-4edc-8dea-4ccac84bd2a2',
    //     is_active: true,
    //     is_flex_price: false,
    //     is_float_price: false,
    //     poin_config: 0,
    //     tax_percentage: '11',
    //     balance: '0',
    //     created_at: '2025-02-09T14:26:48.117Z',
    //     updated_at: '2025-02-09T14:26:48.117Z',
    //     deleted_at: null
    //   },
    //   customer: {
    //     id: 'edd09595-33d4-4e81-9e88-14b47612bee8',
    //     name: 'customer1',
    //     email: 'customer@gmail.com',
    //     phone: '089681551106',
    //     is_verified: false,
    //     device_token: [],
    //     created_at: '2025-02-12T11:29:52.945Z',
    //     updated_at: '2025-02-12T01:01:01.000Z',
    //     deleted_at: null
    //   },
    //   voucher_used: null,
    //   transaction_operations: [
    //     {
    //       id: 'b8a1b5ec-c110-4b3d-a8b1-93c8963e810d',
    //       transaction_id: '76861a32-62eb-42cf-b471-7925401087a4',
    //       operation_id: '2702c9f8-65e1-48ed-90fe-e2ca1dfa5e74',
    //       name: 'SUBOP001 - Reparasi',
    //       type: 'Operation',
    //       unit: '1',
    //       price: '2000',
    //       adjustment_price: '0',
    //       total_price: '2000',
    //       comment: null,
    //       created_at: '2025-02-12T06:55:33.244Z',
    //       updated_at: '2025-02-12T06:55:33.244Z',
    //       deleted_at: null,
    //       operation: [Object]
    //     }
    //   ],
    //   transaction_products: [
    //     {
    //       id: '3ed073fc-07bd-41aa-9d22-49a2348d36d9',
    //       transaction_id: '76861a32-62eb-42cf-b471-7925401087a4',
    //       product_code_id: 'e6a2dec4-076f-409a-aec6-558c76e047b0',
    //       transaction_type: 1,
    //       name: 'INS0010100010001 - Tipe A Hello Kity Cincin',
    //       type: 'INS00101 - Cincin',
    //       weight: '46',
    //       price: '100000',
    //       adjustment_price: '0',
    //       discount: '0',
    //       total_price: '4600000',
    //       status: 2,
    //       comment: null,
    //       created_at: '2025-02-12T06:55:33.257Z',
    //       updated_at: '2025-02-12T06:55:33.257Z',
    //       deleted_at: null,
    //       product_code: [Object],
    //       TransactionReview: null
    //     }
    //   ],
    //   employee: {
    //     id: 'd643abb7-2944-4412-8bb5-5475679f5ade',
    //     name: 'ownera',
    //     email: 'ownera@gmail.com',
    //     created_at: '2025-02-12T13:33:54.629Z',
    //     updated_at: '2025-02-12T00:00:00.000Z',
    //     deleted_at: null
    //   }
    // }
    let newdata = data.data;

    // SALES Trans
    await this.handleEvent(
      context,
      async () => {
        newdata = await this.validateService.validate(this.transactionValidation.CREATESALES, newdata);
        const result = await this.transactionService.createSales(newdata);
        return ResponseDto.success('Transaction Created!', result, 201);
      },
      'Error processing transaction_sales_approved event'
    );
  }

  @EventPattern({ cmd: 'sales_disapproved' })
  @Exempt()
  async deleteTrans(@Payload() data: any, @Ctx() context: RmqContext) {
    let deleted_data = data.data;
    console.log('deleted_data', deleted_data);

    // SALES Trans
    await this.handleEvent(
      context,
      async () => {
        // Cancel Report Journal
        await this.reportJournalsService.deleteAll({ 
          trans_id: deleted_data.id,
          trans_type_code: 'SAL'
        });
        // Cancel Stock Sold
        await this.reportStockService.deleteAll({
          trans_id: deleted_data.id,
          source_id: 3
        });
        return ResponseDto.success('Transaction Deleted!', {}, 200);
      },
      'Error processing transaction_sales_approved event'
    );

  }
  
  // PURCHASE GOODS
  @EventPattern({ cmd: 'product_code_generated' })
  @Exempt()
  async handleProductCodeCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('generated product', data);
    // generated product {
    //   id: '3650376a-3800-484f-9c7c-2acea4cf7121',
    //   barcode: 'CHER0010100010006',
    //   product_id: '87958f93-183e-44af-bd5c-51ad8baa4391',
    //   weight: '12',
    //   fixed_price: '100000',
    //   status: 0,
    //   buy_price: '123',
    //   created_at: '2025-02-21T15:37:29.964Z',
    //   updated_at: '2025-02-21T15:37:29.964Z',
    //   deleted_at: null,
    //   product: {
    //     id: '87958f93-183e-44af-bd5c-51ad8baa4391',
    //     code: 'CHER001010001',
    //     name: 'Gelang Hello Kitty Biru',
    //     description: 'kjh',
    //     images: [ 'uploads\\product\\9ff93394-482a-4586-8c56-af9c9bea7bb5.png' ],
    //     status: 1,
    //     type_id: 'd69d62c7-5a16-4b8d-9aab-081055ea1c34',
    //     store_id: 'e344156f-49d6-4179-87b9-03d22cc18ebf',
    //     created_at: '2025-02-19T08:35:31.340Z',
    //     updated_at: '2025-02-19T08:35:31.340Z',
    //     deleted_at: null,
    //     type: {
    //       id: 'd69d62c7-5a16-4b8d-9aab-081055ea1c34',
    //       code: 'CHER00101',
    //       name: 'Hello Kitty',
    //       description: 'gelang hello kitty',
    //       category_id: 'de069412-d0da-4518-8a6d-e1368d2076d4',
    //       created_at: '2025-02-19T08:33:06.933Z',
    //       updated_at: '2025-02-19T08:33:06.933Z',
    //       deleted_at: null,
    //       prices: [Array],
    //       category: [Object]
    //     },
    //     store: {
    //       id: 'e344156f-49d6-4179-87b9-03d22cc18ebf',
    //       code: 'SUBCH',
    //       name: 'Surabaya Cabang',
    //       is_active: true,
    //       is_flex_price: false,
    //       is_float_price: false,
    //       tax_percentage: '2',
    //       company_id: 'e043ef91-9501-4b2e-8a08-3424174eef23',
    //       created_at: '2025-02-19T08:32:10.258Z',
    //       updated_at: '2025-02-19T08:32:10.258Z',
    //       deleted_at: null,
    //       company: [Object]
    //     }
    //   }
    // }
    await this.handleEvent(
      context,
      async () => {
        const result = await this.transactionService.buyProduct(data);
        return ResponseDto.success('Product Code Created!', result, 200);
      },
      'Error processing product_code_generated event',
    );
  }

  // PURCHASE FROM CUSTOMER
  // TRADE TRANS


}
