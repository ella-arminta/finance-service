import { Controller, Inject } from '@nestjs/common';
import { ClientProxy, Ctx, EventPattern, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { StoresService } from './stores.service';
import { Exempt } from 'src/decorator/exempt.decorator';
import { ValidationService } from 'src/common/validation.service';
import { StoreValidation } from './stores.validation';
import { AccountsService } from 'src/accounts/accounts.service';
import { ResponseDto } from 'src/common/response.dto';
import { CompaniesService } from 'src/companies/companies.service';
import { CompanyValidation } from 'src/companies/companies.validation';
import { DatabaseService } from 'src/database/database.service';
import { RmqHelper } from 'src/helper/rmq.helper';

@Controller()
export class StoresController {
  constructor(
    private readonly storesService: StoresService,
    private readonly validationService: ValidationService,
    private readonly accountService: AccountsService,
    private readonly storeValidation: StoreValidation,
    private readonly companyService: CompaniesService,
    private readonly companyValidation: CompanyValidation,
    @Inject('MASTER') private readonly masterClient: ClientProxy,
    private readonly db: DatabaseService,
  ) {}

  @EventPattern('store.created')
  @Exempt()  
  async create(@Payload() data: any , @Ctx() context: RmqContext) {
    console.log('store created emit received:', data);
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
        let validatedData = await this.validationService.validate(this.storeValidation.CREATE, sanitizedData);

        const newData = await this.storesService.create(validatedData);
        console.log('newdata store', newData);
        if (newData) {
          console.log('Store created successfully acked:', newData);
          await this.accountService.generateDefaultAccountsByStore(newData.id);
        }      
      },
      {
        queueName: 'store.created',
        useDLQ: true,
        dlqRoutingKey: 'dlq.store.created',
        prisma: this.db,
      },
    )();
  }

  @EventPattern('store.updated')
  @Exempt()  
  async update(@Payload() data: any , @Ctx() context: RmqContext) {
    console.log('store updated emit received:', data);
    data = data.data;
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    const sanitizedData = {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      deleted_at: data.deleted_at ? new Date(data.deleted_at) : null,
    }

    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        let validatedData = await this.validationService.validate(this.storeValidation.UPDATE, sanitizedData);

        const updatedData = await this.storesService.update(validatedData.id, validatedData);
        if (updatedData) {
          console.log('Store updated successfully acked:', updatedData);
        }
      },
      {
        queueName: 'store.updated',
        useDLQ: true,
        dlqRoutingKey: 'dlq.store.updated',
        prisma: this.db,
      },
    )();
  }

  @EventPattern('store.deleted')
  @Exempt()
  async remove(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('Store deleted emit received', data);
    data = data.data;

    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        const deletedData = await this.storesService.delete(data);
        if (deletedData) {
          console.log('store deleted successfully acked:', deletedData);
        }
      },
      {
        queueName: 'store.deleted',
        useDLQ: true,
        dlqRoutingKey: 'dlq.store.deleted',
        prisma: this.db,
      },
    )();
  }

  @MessagePattern({cmd:'get:store-sync'})
  @Exempt()
  async sync(@Payload() data: any) {
    var data = await this.masterClient.send({ cmd: 'get:store' }, {}).toPromise();
    data = data.data.data;
    var results  = [];

    for (const dat of data) {
      dat.created_at = new Date(dat.created_at);
      dat.updated_at = new Date(dat.updated_at);
      var validatedData = await this.validationService.validate(this.storeValidation.CREATE, dat);
      var company = await this.companyService.findOne(dat.company_id);
      // Create the company if it does not exist
      if (!company) {
        var newCompany = await this.masterClient.send({ cmd: 'get:company/*' }, { params: { id: dat.company_id } }).toPromise();
        newCompany = newCompany.data;
        newCompany.created_at = new Date(newCompany.created_at);
        newCompany.updated_at = new Date(newCompany.updated_at);
        var validatedCompany = await this.validationService.validate(this.companyValidation.CREATE, newCompany);
        company = await this.companyService.create(validatedCompany);
      }

      // Update / Create the store
      var prevData = await this.storesService.findOne(dat.id);
      var result;
      if (prevData) {
        result = await this.storesService.update(dat.id, validatedData);
      } else {
        result = await this.storesService.create(validatedData);
      }
      results.push(result);
    }
    
    return ResponseDto.success('Store sync successful', results);
  }

  @EventPattern({ cmd: 'store_sync' })
  @Exempt()
  async storeSync(@Payload() data: any, @Ctx() context: RmqContext) {
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        console.log('store sync data',data.data);
        const datas = await Promise.all(
          data.data.map(async (d) => {
            return await this.validationService.validate(this.storeValidation.CREATE, d);
          })
        );
        return await this.storesService.sync(datas);
      },
      {
        queueName: 'store_sync',
        useDLQ: true,
        dlqRoutingKey: 'dlq.store_sync',
      },
    )();
  }
}
