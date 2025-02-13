import { Controller } from '@nestjs/common';
import { RecurringService } from './recurring.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Describe } from 'src/decorator/describe.decorator';
import { ResponseDto } from 'src/common/response.dto';
import { RecurringValidation } from './recurring.validation';
import { ValidationService } from 'src/common/validation.service';

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
      fe: []
    })
    async getAllRecurring(@Payload() data: any) {
      var filters = data.body;
      var filtersValidated = await  this.validateService.validate(this.recurringValidation.FILTER, filters);

      // START DATE 
      if (filtersValidated.start_date) {
        filtersValidated.trans_start_date = {};
        const startDate = new Date(filtersValidated.start_date);
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() + 1);
        filtersValidated.trans_start_date.gte = startDate;
        delete filtersValidated.start_date;
      }
      // END DATE
      if (filtersValidated.end_date) {
        if (!filtersValidated.trans_start_date) {
          filtersValidated.trans_start_date = {};
        }
        const endDate = new Date(filtersValidated.end_date);
        endDate.setHours(23, 59, 59, 999);
        endDate.setDate(endDate.getDate() + 1);
        filtersValidated.trans_start_date.lte = endDate;
      
        delete filtersValidated.end_date;
      }
      console.log('filtersvalidated',filtersValidated);
      var result = await this.recurringService.findAll(filtersValidated);
      return ResponseDto.success('Data Retrieved!', result, 200);
    }

    @MessagePattern({ cmd: 'get:recurring-period' })
    @Describe({
      description: 'Get Recurring Period Transaction',
      fe: []
    })
    async getAllRecurringPeriod(@Payload() data: any) {
      var result = await this.recurringService.findAllRecurringPeriod();
      return ResponseDto.success('Data Retrieved!', result, 200);
    }
  
    @MessagePattern({ cmd: 'get:recurring/*' })
    @Describe({
      description: 'Get Recurring Transaction',
      fe: []
    })
    async findOne(@Payload() data: any) {
      var params = data.params;
      var result = await this.recurringService.findOne(params.id);
      return ResponseDto.success('Data Retrieved!', result, 200);
    }

    @MessagePattern({ cmd: 'put:recurring/*' })
    @Describe({
      description: 'Update Recurring Transaction',
      fe: []
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
      console.log('validatedData', validatedData);

      var result = await this.recurringService.update(params.id, validatedData);
      return ResponseDto.success('Data Retrieved!', result, 200);
    }

    // delete 
    @MessagePattern({ cmd: 'delete:recurring/*' })
    @Describe({
      description: 'Delete Recurring Transaction',
      fe: []
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
      fe: []
    })
    async add(@Payload() data: any) {
      var newdata = data.body;
      const params = data.params;
      
      var store_id =  (params.user.store_id && params.user.store_id.length > 0) ? params.user.store_id[0] : 'ea9bd13a-2ba6-4ec1-9bbf-225131d77ded';
      if (newdata.store_id) {
        store_id = newdata.store_id;
      }

      // SANITIZE DATA
      var sanitizedData = {
        ...newdata,
        account_cash_id: newdata.account_cash_id.length > 0 ? newdata.account_cash_id[0] : '',
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
}
