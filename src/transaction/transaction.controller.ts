import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TransactionService } from './transaction.service';
import { Describe } from 'src/decorator/describe.decorator';
import { ValidationService } from 'src/common/validation.service';
import { TransactionValidation } from './transaction.validaton';
import { ResponseDto } from 'src/common/response.dto';
import { TransTypeService } from 'src/trans-type/trans-type.service';

@Controller()
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly validateService: ValidationService,
    private readonly transactionValidation: TransactionValidation,
    private readonly transTypeService: TransTypeService
  ) {}

  @MessagePattern({ cmd: 'post:uang-keluar-masuk' })
  @Describe('Create a new transaction uang keluar lain')
  async uangKeluarMasuk(@Payload() data: any) {
    // TODOELLA NGEFIX ANGKA DIFRONTEND (transaction_id, debit kreditnya)
    var newdata = data.body;
    const params = data.params;
    
    //GENERATE TRANSACTION CODE  format : UKL/YYMM/00001 
    if (!newdata.trans_type_id) {
      return ResponseDto.error('Transaction Type ID Not Found!', {
        field: 'trans_type_id',
      }, 400);
    }
    const transtype = await this.transTypeService.findOne(newdata.trans_type_id);
    if (!transtype) {
      return ResponseDto.error('Transaction Type Not Found!', null, 400);
    }
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const indexTransaction = await this.transactionService.countThisMonthTransaction(newdata.store_id, year, month) + 1;
    var transactionCode = transtype.code + '/' + year.toString().slice(-2) + month.toString().padStart(2, '0') + '/' + indexTransaction.toString().padStart(5, '0');

    var sanitizedData = {
      ...newdata,
      code: transactionCode,
      created_by: params.user.id,
      updated_by: params.user.id,
      trans_date: new Date(newdata.trans_date),
    }

    var validatedData = await this.validateService.validate(this.transactionValidation.CREATE, sanitizedData);
    
    newdata = await this.transactionService.create(validatedData);
    return ResponseDto.success('Data Created!', newdata, 201);
  }

  @MessagePattern({ cmd: 'post:uang-masuk' })
  @Describe('Create a new transaction uang masuk lain')
  async uangMasuk(@Payload() data: any) {
    var newdata = data.body;
  }

  @MessagePattern({ cmd: 'get:trans' })
  @Describe('Get All Transactions')
  async findAll() {
    return this.transactionService.findAll();
  }

  @MessagePattern({ cmd: 'get:trans/*' })
  @Describe('Get a transaction by id')
  async findOne(@Payload() id: number) {
    return this.transactionService.findOne(id);
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
