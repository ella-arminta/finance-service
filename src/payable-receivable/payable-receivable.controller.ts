import { Controller } from '@nestjs/common';
import { PayableReceivableService } from './payable-receivable.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Describe } from 'src/decorator/describe.decorator';
import { ResponseDto } from 'src/common/response.dto';
import { ValidationService } from 'src/common/validation.service';
import { PayableReceivableValidation } from './payable-receivable.validation';

@Controller()
export class PayableReceivableController {
  constructor(
    private readonly payableReceivableService: PayableReceivableService,
    private validationService: ValidationService,
    private readonly payrecService: PayableReceivableValidation,
  ) { }

  @MessagePattern({ cmd: 'get:receivable-payable' })
  @Describe({
    description: 'Get Receivables and Payables',
    fe: [
      'finance/receivable-payable:open',
    ]
  })
  async getReceivablesPayables(@Payload() data: any) {
    const filters = data.body;

    if (!filters.company_id && !filters.store_id) {
      filters.company_id = data.body.auth?.company_id;
    }

    const filtersFormatted: any = {};

    if (filters.company_id) {
      filtersFormatted['store'] = { company_id: filters.company_id };
    }

    if (filters.store_id) {
      filtersFormatted['store_id'] = filters.store_id;
    }

    if (filters.start_date || filters.end_date) {
      filtersFormatted['payable_receivables'] ??= {};
      filtersFormatted['payable_receivables']['due_date'] ??= {};
    
      if (filters.start_date) {
        filtersFormatted['payable_receivables']['due_date']['gte'] = new Date(filters.start_date);
      }
    
      if (filters.end_date) {
        const endDate = new Date(filters.end_date);
        endDate.setHours(23, 59, 59, 0);
        filtersFormatted['payable_receivables']['due_date']['lte'] = endDate;
      }
    }    

    filtersFormatted['account'] = {
      account_type_id: { in: [3, 4] }, // 3 = Payable, 4 = Receivable
    };

    if (filters.trans_type_id) {
      filtersFormatted['account'] = {
        account_type_id: parseInt(filters.trans_type_id),
      };
    }
    if (filters.status) {
      filtersFormatted['status'] = 
      typeof filters.status === 'string' ? JSON.parse(filters.status) : filters.status;  
    }

    console.log(filtersFormatted);

    try {
      const result = await this.payableReceivableService.findAll(filtersFormatted);
      return ResponseDto.success('Data Retrieved!', result, 200);
    } catch (error) {
      return ResponseDto.error('Failed to retrieve data', error, 400);
    }
  }

  @MessagePattern({ cmd: 'get:receivable-payable/*' })
  @Describe({
    description: 'Get Receivables and Payables',
    fe: [
      'finance/receivable-payable:open',
    ]
  })
  async getReceivablePayableDetail(@Payload() data: any) {
    const datas = await this.payableReceivableService.findOne(data.params.id);
    return ResponseDto.success('Data Retrieved!', datas, 200);
  }

  @MessagePattern({ cmd: 'post:receivable-payable-payment' })
  @Describe({
    description: 'Update Receivables and Payables',
    fe: [
      'finance/receivable-payable:open',
      'finance/receivable-payable:edit',
    ]
  })
  async updateReceivablePayable(@Payload() data: any) {
    try {
      const validatedData = await this.validationService.validate(this.payrecService.CREATE, data.body);
      const createData = await this.payableReceivableService.update( validatedData.report_journal_id , validatedData);
      return createData;
    } catch (error) {
      return ResponseDto.error('Failed to update data', error, 400);
    }
  }

  @MessagePattern({ cmd: 'post:receivable-payable-duedate' })
  @Describe({
    description: 'Update Receivables and Payables',
    fe: [
      'finance/receivable-payable:open',
      'finance/receivable-payable:edit',
    ]
  })
  async updateReceivablePayableDuedate(@Payload() data: any) {
    try {
      const validatedData = await this.validationService.validate(this.payrecService.DUEDATE, data.body);
      const createData = await this.payableReceivableService.updateDueDate( validatedData.report_journal_id , validatedData.due_date);
      return createData;
    } catch (error) {
      return ResponseDto.error('Failed to update data', error, 400);
    }
  }

  @MessagePattern({ cmd: 'delete:receivable-payable-payment/*'})
  @Describe({
    description: 'Delete Receivables and Payables',
    fe: [
      'finance/receivable-payable:open',
      'finance/receivable-payable:delete',
    ]
  })
  async deleteReceivablePayable(@Payload() data: any) {
    try {
      const result = await this.payableReceivableService.delete(data.params.id);
      return result;
    } catch (error) {
      return ResponseDto.error('Failed to delete data', error, 400);
    }
  }

  @MessagePattern({ cmd: 'post:receivable-payable-reminder' })
  @Describe({
    description: 'Create Reminder Receivables and payables',
    fe: [
      'finance/receivable-payable:open',
      'finance/receivable-payable:edit',
    ]
  })
  async createReminderReceivablePayable(@Payload() data: any) {
    try {
      const validatedData = await this.validationService.validate(this.payrecService.CREATEREMINDER, data.body);
      const createData = await this.payableReceivableService.createReminder( validatedData.report_journal_id , validatedData);
      return createData;
    } catch (error) {
      return ResponseDto.error('Failed to update data', error, 400);
    }
  }

  @MessagePattern({ cmd: 'delete:receivable-payable-reminder/*'})
  @Describe({
    description: 'Delete Receivables and Payables',
    fe: [
      'finance/receivable-payable:open',
      'finance/receivable-payable:delete',
    ]
  })
  async deleteReminder(@Payload() data: any) {
    try {
      const result = await this.payableReceivableService.deleteReminder(data.params.id);
      return result;
    } catch (error) {
      return ResponseDto.error('Failed to delete data', error, 400);
    }
  }

}
