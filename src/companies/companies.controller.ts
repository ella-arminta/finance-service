import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { CompaniesService } from './companies.service';
import { Prisma } from '@prisma/client';
import { ValidationService } from 'src/common/validation.service';
import { CompanyValidation } from './companies.validation';
import { response } from 'express';
import { ResponseDto } from 'src/common/response.dto';
import { Exempt } from 'src/decorator/exempt.decorator';
import { AccountsService } from 'src/accounts/accounts.service';

@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private validationService: ValidationService,
    private readonly accountService: AccountsService,
  ) {}

  @EventPattern({ cmd: 'company_created' })
  @Exempt()  
  async companyCreated(@Payload() data: any , @Ctx() context: RmqContext) {
    console.log('Company created emit received:', data);
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    const sanitizedData = {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      deleted_at: data.deleted_at ? new Date(data.deleted_at) : null,
    }

    try {
      let validatedData = await this.validationService.validate(CompanyValidation.CREATE, sanitizedData);

      const newData = await this.companiesService.create(validatedData);
      if (newData) {
        channel.ack(originalMsg);
        console.log('Company created successfully acked:', newData);
        // create default accounts for this company
        this.accountService.generateDefaultAccountsByComp(newData.id);
      }
    } catch (error) {
      console.error('Error creating company:', error);
      channel.nack(originalMsg);
    }
  }

  @EventPattern( {cmd: 'company_updated'})
  @Exempt()
  async update(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('Company updated emit received:', data);
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    // sanitize data if there is created_at, updated_at, deleted_at
    const sanitizedData = {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      deleted_at: data.deleted_at ? new Date(data.deleted_at) : null,
    }

    try {
      console.log('SanitizedData',sanitizedData);
      let validatedData = await this.validationService.validate(CompanyValidation.UPDATE, sanitizedData);

      const newData = await this.companiesService.update(data.id,validatedData);
      console.log('new data',newData);
      if (newData) {
        channel.ack(originalMsg);
        console.log('Company created successfully acked:', newData);
      }
    } catch (error) {
      console.error('Error creating company:', error);
      channel.nack(originalMsg);
    }

  }

  @EventPattern({cmd:'company_deleted'})
  @Exempt()
  async remove(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('Company deleted emit received', data);
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const deletedData = await this.companiesService.delete(data);
      if (deletedData) {
        channel.ack(originalMsg);
        console.log('Company deleted successfully acked:', deletedData);
      }
    } catch (error) {
      console.error('Error processing company_created event', error.stack);
      channel.nack(originalMsg);
    }
  }
}
