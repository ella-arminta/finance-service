import { Controller, Inject } from '@nestjs/common';
import { ClientProxy, Ctx, EventPattern, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { CompaniesService } from './companies.service';
import { ValidationService } from 'src/common/validation.service';
import { CompanyValidation } from './companies.validation';
import { Exempt } from 'src/decorator/exempt.decorator';
import { AccountsService } from 'src/accounts/accounts.service';
import { DatabaseService } from 'src/database/database.service';
import { RmqHelper } from 'src/helper/rmq.helper';

@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private validationService: ValidationService,
    private readonly accountService: AccountsService,
    private readonly companyValidation: CompanyValidation,
    private readonly db : DatabaseService
  ) {}

  @EventPattern('company.created')
  @Exempt()  
  async companyCreated(@Payload() data: any , @Ctx() context: RmqContext) {
    console.log('Company created emit received:', data);
    data = data.data;

    const sanitizedData = {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      deleted_at: data.deleted_at ? new Date(data.deleted_at) : null,
    }

    await RmqHelper.handleMessageProcessing(
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
        queueName: 'company.created',
        useDLQ: true,
        dlqRoutingKey: 'dlq.company.created',
        prisma: this.db,
      },
    )();
  }

  @EventPattern('company.updated')
  @Exempt()
  async update(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('Company updated emit received:', data);
    data = data.data;

    // sanitize data if there is created_at, updated_at, deleted_at
    const sanitizedData = {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      deleted_at: data.deleted_at ? new Date(data.deleted_at) : null,
    }

    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        let validatedData = await this.validationService.validate(this.companyValidation.UPDATE, sanitizedData);
        const newData = await this.companiesService.update(data.id,validatedData);  
        if (!newData) {
          throw new Error('Company update failed');
        }
      },
      {
        queueName: 'company.updated',
        useDLQ: true,
        dlqRoutingKey: 'dlq.company.updated',
        prisma: this.db,
      },
    )();
  }

  @EventPattern('company.deleted')
  @Exempt()
  async remove(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('Company deleted emit received', data);
    data = data.data;

    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        const deletedData = await this.companiesService.delete(data);
        if (!deletedData) {
          throw new Error('Company deletion failed');
        }
      },
      {
        queueName: 'company.deleted',
        useDLQ: true,
        dlqRoutingKey: 'dlq.company.deleted',
        prisma: this.db,
      },
    )();
  }

  @EventPattern({ cmd: 'company_sync' })
  @Exempt()
  async companySync(@Payload() data: any, @Ctx() context: RmqContext) {
    await RmqHelper.handleMessageProcessing(
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
