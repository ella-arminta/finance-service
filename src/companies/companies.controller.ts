import { Controller, Inject } from '@nestjs/common';
import { ClientProxy, Ctx, EventPattern, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { CompaniesService } from './companies.service';
import { Prisma } from '@prisma/client';
import { ValidationService } from 'src/common/validation.service';
import { CompanyValidation } from './companies.validation';
import { response } from 'express';
import { ResponseDto } from 'src/common/response.dto';
import { Exempt } from 'src/decorator/exempt.decorator';
import { AccountsService } from 'src/accounts/accounts.service';
import { RmqAckHelper } from 'src/helper/rmq-ack.helper';

@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private validationService: ValidationService,
    private readonly accountService: AccountsService,
    private readonly companyValidation: CompanyValidation,
    @Inject('MASTER') private readonly masterClient: ClientProxy
  ) {}

  @EventPattern({ cmd: 'company_created' })
  @Exempt()  
  async companyCreated(@Payload() data: any , @Ctx() context: RmqContext) {
    console.log('Company created emit received:', data);

    const sanitizedData = {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      deleted_at: data.deleted_at ? new Date(data.deleted_at) : null,
    }

    await RmqAckHelper.handleMessageProcessing(
      context,
      async () => {
        let validatedData = await this.validationService.validate(this.companyValidation.CREATE, sanitizedData);
        const newData = await this.companiesService.create(validatedData);
        console.log('company created',newData);
        if (newData) {
          await this.accountService.generateDefaultAccountsByComp(newData.id);
        }
      },
      {
        queueName: 'company_created',
        useDLQ: true,
        dlqRoutingKey: 'dlq.company_created',
      },
    )();
  }

  @EventPattern( {cmd: 'company_updated'})
  @Exempt()
  async update(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('Company updated emit received:', data);

    // sanitize data if there is created_at, updated_at, deleted_at
    const sanitizedData = {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      deleted_at: data.deleted_at ? new Date(data.deleted_at) : null,
    }

    await RmqAckHelper.handleMessageProcessing(
      context,
      async () => {
        let validatedData = await this.validationService.validate(this.companyValidation.UPDATE, sanitizedData);
        const newData = await this.companiesService.update(data.id,validatedData);  
        if (!newData) {
          throw new Error('Company update failed');
        }
      },
      {
        queueName: 'company_updated',
        useDLQ: true,
        dlqRoutingKey: 'dlq.company_updated',
      },
    )();
  }

  @EventPattern({cmd:'company_deleted'})
  @Exempt()
  async remove(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('Company deleted emit received', data);

    await RmqAckHelper.handleMessageProcessing(
      context,
      async () => {
        const deletedData = await this.companiesService.delete(data);
        if (!deletedData) {
          throw new Error('Company deletion failed');
        }
      },
      {
        queueName: 'company_deleted',
        useDLQ: true,
        dlqRoutingKey: 'dlq.company_deleted',
      },
    )();
  }

  @EventPattern({ cmd: 'company_sync' })
  @Exempt()
  async companySync(@Payload() data: any, @Ctx() context: RmqContext) {
    await RmqAckHelper.handleMessageProcessing(
      context,
      async () => {
        console.log('company sync data',data.data);
        const datas = await Promise.all(
          data.data.map(async (d) => {
            return await this.validationService.validate(this.companyValidation.CREATE, d);
          })
        );
        return await this.companiesService.sync(datas);
      },
      {
        queueName: 'company_sync',
        useDLQ: true,
        dlqRoutingKey: 'dlq.company_sync',
      },
    )();
  }
}
