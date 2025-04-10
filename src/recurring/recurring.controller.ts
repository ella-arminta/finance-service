import { Controller } from '@nestjs/common';
import { RecurringService } from './recurring.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Describe } from 'src/decorator/describe.decorator';
import { ResponseDto } from 'src/common/response.dto';
import { RecurringValidation } from './recurring.validation';
import { ValidationService } from 'src/common/validation.service';
import { equals } from 'class-validator';

@Controller()
export class RecurringController {
  constructor(
    private readonly recurringService: RecurringService,
    private readonly validateService: ValidationService,
    private readonly recurringValidation: RecurringValidation,
  ) {}

    @MessagePattern({ cmd: 'get:recurring' })
    @Describe({
      description: 'Get Recurring Transaction',
      fe: [
        'finance/recurring:open'
      ]
    })
    async getAllRecurring(@Payload() data: any) {
      var filters = data.body;
      var filtersValidated = await  this.validateService.validate(this.recurringValidation.FILTER, filters);

      // START DATE 
      if (filtersValidated.start_date) {
        filtersValidated.startDate = {};
        const startDate = new Date(filtersValidated.start_date);
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() + 1);
        filtersValidated.startDate.gte = startDate;
        delete filtersValidated.start_date;
      }
      // END DATE
      if (filtersValidated.end_date) {
        if (!filtersValidated.endDate) {
          filtersValidated.endDate = {};
        }
        const endDate = new Date(filtersValidated.end_date);
        endDate.setHours(23, 59, 59, 999);
        endDate.setDate(endDate.getDate() + 1);
        filtersValidated.endDate.lte = endDate;
      
        delete filtersValidated.end_date;
      }
      console.log('filters', filtersValidated);
      if (filtersValidated.recurringType) {
        filtersValidated.recurringType = { equals : filtersValidated.recurringType };
      }
      var result = await this.recurringService.findAll(filtersValidated);
      return ResponseDto.success('Data Retrieved!', result, 200);
    }

    @MessagePattern({ cmd: 'get:recurring-period' })
    @Describe({
      description: 'Get Recurring Period Transaction',
      fe: [
        'finance/recurring:open',
        'finance/recurring:add',
        'finance/recurring:edit',
        'finance/recurring:detail',
      ]
    })
    async getAllRecurringPeriod(@Payload() data: any) {
      var result = await this.recurringService.findAllRecurringPeriod();
      return ResponseDto.success('Data Retrieved!', result, 200);
    }
  
    @MessagePattern({ cmd: 'get:recurring/*' })
    @Describe({
      description: 'Get Recurring Transaction',
      fe: [
        'finance/recurring:edit',
        'finance/recurring:detail',
      ]
    })
    async findOne(@Payload() data: any) {
      var params = data.params;
      var result = await this.recurringService.findOne(params.id);
      return ResponseDto.success('Data Retrieved!', result, 200);
    }

    @MessagePattern({ cmd: 'put:recurring/*' })
    @Describe({
      description: 'Update Recurring Transaction',
      fe: [
        'finance/recurring:edit',
        'finance/recurring:detail',
      ]
    })
    async update(@Payload() data: any) {
      var params = data.params;
      var newdata = data.body;

      // SANITIZE DATA
      var sanitizedData = {
        ...newdata,
        account_cash_id: newdata.account_cash_id.length > 0 ? newdata.account_cash_id[0] : '',
        updated_by: params.user.id,
        updated_at: new Date(),
      }
      // VALIDATE DATA
      var validatedData = await this.validateService.validate(this.recurringValidation.UPDATE, sanitizedData);

      // REFORMAT DATA
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
      // console.log('validatedData', validatedData);

      var result = await this.recurringService.update(params.id, validatedData);
      return ResponseDto.success('Data Retrieved!', result, 200);
    }

    // delete 
    @MessagePattern({ cmd: 'delete:recurring/*' })
    @Describe({
      description: 'Delete Recurring Transaction',
      fe: [
        'finance/recurring:delete'
      ]
    })
    async delete(@Payload() data: any) {
      var params = data.params;
      var result = await this.recurringService.delete(params.id);
      return ResponseDto.success('Data Retrieved!', result, 200);
    }

    // create
    @MessagePattern({ cmd: 'post:recurring' })
    @Describe({
      description: 'Create Recurring Transaction',
      fe: [
        'finance/recurring:add'
      ]
    })
    async add(@Payload() data: any) {
      var newdata = data.body;
      const params = data.params;
      
      var store_id =  newdata.auth.store_id;

      // SANITIZE DATA
      var sanitizedData = {
        ...newdata,
        account_cash_id: newdata.account_cash_id.length > 0 ? newdata.account_cash_id[0] : '',
        store_id: store_id,
        created_by: params.user.id,
        updated_by: params.user.id,
      }

      // VALIDATE DATA
      var validatedData = await this.validateService.validate(this.recurringValidation.CREATE, sanitizedData);
      
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

      // CREATE RECURRING
      newdata = await this.recurringService.create(validatedData);
      
      return ResponseDto.success('Data Created!', newdata, 201);
    }

    @MessagePattern({ cmd: 'get:recurring-cron' })
    @Describe({
      description: 'Call Recurring Transaction CRON',
      fe: [
        'finance/recurring:add', 'finance/mexpenses:add', 'finance/mincomes:add',
      ]
    })
    async callCron(@Payload() data: any) {
      var params = data.params;
      var result = await this.recurringService.handleRecurringTransactionCron();
      return ResponseDto.success('Data Retrieved!', result, 200);
    }

}
