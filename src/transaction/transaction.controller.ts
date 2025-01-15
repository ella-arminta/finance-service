import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TransactionService } from './transaction.service';
import { Describe } from 'src/decorator/describe.decorator';
import { ValidationService } from 'src/common/validation.service';
import { TransactionValidation } from './transaction.validaton';

@Controller()
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly validateService: ValidationService,
    private readonly transactionValidation: TransactionValidation,
  ) {}

  @MessagePattern({ cmd: 'post:uang-keluar' })
  @Describe('Create a new transaction uang keluar lain')
  async uangKeluar(@Payload() data: any) {
    var newdata = data.body;
    // format : UKL/YYMM/00001 
    var transactionCode = 'UKL/' + new Date().getFullYear().toString().slice(-2) + new Date().getMonth().toString().padStart(2, '0') + '/';
    var validatedData = await this.validateService.validate(this.transactionValidation.CREATE, newdata);
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
