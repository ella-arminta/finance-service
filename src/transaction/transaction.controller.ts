import { Controller, Inject } from '@nestjs/common';
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
import { RmqAckHelper } from 'src/helper/rmq-ack.helper';
import { RmqHelper } from 'src/helper/rmq.helper';

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
    @Inject('TRANSACTION_TCP') private readonly transactionClientTcp: any,
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
    // WITHOUT RECURRING
    // newdata ini uang keluar masuk {
    //   auth: {
    //     company_id: '4f92a7d3-bc16-4e8f-9d91-7c3a8f5e21b0',
    //     store_id: 'a55ecd94-6934-4630-8550-39cd8cce6bb7'
    //   },
    //   owner_id: '4f92a7d3-bc16-4e8f-9d91-7c3a8f5e21b0',
    //   code: 'UKL/TENGG/2504/00002',
    //   account_cash_id: [ '69df8581-139b-4d80-9283-f1cc045f37c9' ],
    //   total: 3679,
    //   description: 'kjnh',
    //   trans_date: '2025-04-09',
    //   accounts: [
    //     {
    //       amount: '3679',
    //       description: 'kjnhb',
    //       account_id: '69df8581-139b-4d80-9283-f1cc045f37c9'
    //     }
    //   ],
    //   trans_type_id: 1,
    //   recurring: false
    // } params {
    //   '0': 'uang-keluar-masuk',
    //   service: 'finance',
    //   user: {
    //     id: '4f92a7d3-bc16-4e8f-9d91-7c3a8f5e21b0',
    //     email: 'ownerb@gmail.com',
    //     is_owner: true,
    //     timestamp: '2025-04-09T07:00:00.245Z',
    //     iat: 1744182000,
    //     exp: 1744268400
    //   }
    // }
    
    console.log('newdata ini uang keluar masuk',newdata, 'params', params);
    // //GENERATE TRANSACTION CODE  format : UKL/YYMM/00001 
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

    // VALIDATE DATA
    var validatedData = await this.validateService.validate(this.transactionValidation.CREATE, sanitizedData);
    // REFORMAT DATA
    validatedData = this.transactionService.reformatToJournalData(validatedData);
    // CREATE TRANSACTION
    // validate recurring
    var recurringValidatedData;
    if (newdata.recurring) {
      recurringValidatedData = await this.validateService.validate(this.transactionValidation.CREATERECURRING, sanitizedData);
      recurringValidatedData = this.transactionService.reformatToJournalData(recurringValidatedData);
      console.log('recurringValidatedData in controller', recurringValidatedData);
    } else {
      recurringValidatedData = null;
    }

    newdata = await this.transactionService.createUangKeluarMasuk(validatedData, recurringValidatedData);
    if (newdata.success == false) {
      return ResponseDto.error('Error', newdata.error, newdata.status);
    }
    return newdata;

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

  @EventPattern({ cmd: 'transaction_approved' })
  @Exempt()  
  async createTrans(@Payload() data: any, @Ctx() context: RmqContext) {
    let newdata = data.data;
    console.log('create transaction data',newdata)
    // SALES Trans
    await RmqAckHelper.handleMessageProcessing(
      context,
      async () => {
         // SALES
         if (newdata.transaction_type == 1) {
          newdata = await this.validateService.validate(this.transactionValidation.CREATESALES, newdata);
          const result = await this.transactionService.createSales(newdata);
          return ResponseDto.success('Transaction Created!', result, 201);
        }
        // PURCHASE FROM CUSTOMER
        else if (newdata.transaction_type == 2) {
          newdata = await this.validateService.validate(this.transactionValidation.CREATEPURCHASE, newdata);
          try {
            const result = await this.transactionService.createPurchase(newdata);
            return ResponseDto.success('Transaction Created!', result, 201);
          } catch (error) {
            console.error('Error creating purchase from customer', error);
            return ResponseDto.error('Error creating purchase from customer', error, error.status);
          }
          
        }
        // Trade 
        else if (newdata.transaction_type == 3) {
          newdata = await this.validateService.validate(this.transactionValidation.CREATETRADE, newdata);
          const result = await this.transactionService.createTrade(newdata);
          return ResponseDto.success('Transaction Created!', result, 201);
        }
        return ResponseDto.error('Transaction Type Not Found!', null, 400);
      },
      {
        queueName: 'operation_deleted',
        useDLQ: true,
        dlqRoutingKey: 'dlq.operation_deleted',
      },
    )();
  }

  @EventPattern({ cmd: 'transaction_disapproved' })
  @Exempt()
  async deleteTrans(@Payload() data: any, @Ctx() context: RmqContext) {
    let deleted_data = data.data;
    console.log('deleted_data', deleted_data);

    // SALES Trans
    await RmqAckHelper.handleMessageProcessing(
      context,
      async () => {
        // Cancel Report Journal
        await this.reportJournalsService.deleteAll({ 
          trans_serv_id: deleted_data.id,
          // trans_type_code: 'SAL'
        });
        // Cancel Stock Sold
        await this.reportStockService.deleteAll({
          trans_id: deleted_data.id,
          // source_id: 3
        });
        return ResponseDto.success('Transaction Deleted!', {}, 200);
      },
      {
        queueName: 'operation_deleted',
        useDLQ: true,
        dlqRoutingKey: 'dlq.operation_deleted',
      },
    )();
  }
  
  // PURCHASE GOODS
  @EventPattern('product.code.created')
  @Exempt()
  async handleProductCodeCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('generated product', data);
    data = data.data;
    // generated product {
    //   id: 'c17ada64-7847-4995-98b4-bcbcd038183f',
    //   barcode: 'UUAAS0020100090006',
    //   product_id: '2fca95fd-6525-4cee-8796-b9a09f670f25',
    //   weight: '12',
    //   fixed_price: '10000',
    //   status: 0,
    //   taken_out_at: null,
    //   taken_out_reason: 0,
    //   taken_out_by: null,
    //   buy_price: '120000',
    //   tax_purchase: '0',
    //   image: '',
    //   account_id: 'ad844ebf-ceab-474d-995b-3f7b60eb5847',
    //   created_at: '2025-03-28T13:12:29.109Z',
    //   updated_at: '2025-03-28T13:12:29.109Z',
    //   deleted_at: null,
    //   product: {
    //     id: '2fca95fd-6525-4cee-8796-b9a09f670f25',
    //     code: 'UUAAS002010009',
    //     name: 'Product B',
    //     description: '',
    //     status: 1,
    //     tags: [],
    //     type_id: '62a80d88-595e-4e5b-b45d-6e1131369b2b',
    //     store_id: '9c0d2ffc-1cf1-4a4c-bd2f-8cc18afca7c9',
    //     created_at: '2025-03-28T08:19:57.755Z',
    //     updated_at: '2025-03-28T08:19:57.755Z',
    //     deleted_at: null,
    //     type: {
    //       id: '62a80d88-595e-4e5b-b45d-6e1131369b2b',
    //       code: 'UUAAS00201',
    //       name: 'Subcategory B',
    //       description: '',
    //       category_id: 'c2afe74a-836a-4ab0-b320-975ef8249f63',
    //       percent_price_reduction: '0',
    //       fixed_price_reduction: '0',
    //       percent_broken_reduction: '0',
    //       fixed_broken_reduction: '0',
    //       created_at: '2025-03-28T08:18:51.337Z',
    //       updated_at: '2025-03-28T08:18:51.337Z',
    //       deleted_at: null,
    //       category: [Object]
    //     },
    //     store: {
    //       id: '9c0d2ffc-1cf1-4a4c-bd2f-8cc18afca7c9',
    //       code: 'HOREE',
    //       name: 'horee',
    //       is_active: true,
    //       is_flex_price: false,
    //       is_float_price: false,
    //       tax_percentage: '0',
    //       company_id: '61016edc-5c08-4c8b-a303-4dec1c320461',
    //       created_at: '2025-03-27T15:03:17.152Z',
    //       updated_at: '2025-03-27T15:03:17.152Z',
    //       deleted_at: null,
    //       company: [Object]
    //     }
    //   },
    //   transref_id: 'e965b699-fa70-46ab-934b-0a0482d99464' // transactionProduct.id
    // }

    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        // Product Code generated for Trade or Purchase
        if (data.transref_id && data.transref_id != null) {
          // get trans_id from transaction
          const transProduct = await this.transactionClientTcp
              .send({ cmd: 'get:transproduct/*' }, { params: { id: data.transref_id } })
              .toPromise();
          data.trans_id = transProduct.data.transaction_id;
          const result = await this.transactionService.updateProductCodeTrans(data);
          return ResponseDto.success('Product Code Created!', result, 200);
        }
        // Product cod egenerated from supplier 
        else {
          const result = await this.transactionService.buyProduct(data);
          return ResponseDto.success('Product Code Created!', result, 200);
        }
      },
      {
        queueName: 'product.code.created',
        useDLQ: true,
        dlqRoutingKey: 'dlq.product.code.created',
        prisma: this.transactionService.db
      },
    )();
  }

  // PURCHASE FROM CUSTOMER
  // TRADE TRANS

  @EventPattern('stock.out')
  @Exempt()
  async handleStockOut(@Payload() data: any, @Ctx() context: RmqContext) {
    data = data.data;
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        await this.transactionService.handleStockOut(data);
      },
      {
        queueName: 'stock.out',
        useDLQ: true,
        dlqRoutingKey: 'dlq.stock.out',
        prisma: this.transactionService.db,
      },
    )();
  }

  @EventPattern('stock.unstock.out')
  @Exempt()
  async handleUnstockOut(@Payload() data: any, @Ctx() context: RmqContext) {
    data = data.data;
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        await this.transactionService.handleUnstockOut(data);
      },
      {
        queueName: 'stock.unstock.out',
        useDLQ: true,
        dlqRoutingKey: 'dlq.stock.unstock.out',
        prisma: this.transactionService.db,
      },
    )();
  }

  @EventPattern('stock.repaired')
  @Exempt()
  async handleStockRepaired(@Payload() data: any, @Ctx() context: RmqContext) {
    data = data.data;
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        await this.transactionService.handleStockRepaired(data);
      },
      {
        queueName: 'stock.repaired',
        useDLQ: true,
        dlqRoutingKey: 'dlq.stock.repaired',
        prisma: this.transactionService.db,
      },
    )();
  }

  @EventPattern('stock.opname.approved')
  @Exempt()
  async handleStockOpnameApproved(@Payload() data: any, @Ctx() context: RmqContext) {
    data = data.data;
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        await this.transactionService.handleStockOpnameApproved(data);
      },
      {
        queueName: 'stock.opname.approved',
        useDLQ: true,
        dlqRoutingKey: 'dlq.stock.opname.approved',
        prisma: this.transactionService.db,
      },
    )();
  }
  
  @EventPattern('stock.opname.disapproved')
  @Exempt()
  async handleStockOpnameDisapproved(@Payload() data: any, @Ctx() context: RmqContext) {
    data = data.data;
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        await this.transactionService.handleStockOpnameDisapproved(data);
      },
      {
        queueName: 'stock.opname.disapproved',
        useDLQ: true,
        dlqRoutingKey: 'dlq.stock.opname.disapproved',
        prisma: this.transactionService.db
      },
    )();
  }

}
