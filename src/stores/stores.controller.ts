import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { StoresService } from './stores.service';
import { Exempt } from 'src/decorator/exempt.decorator';
import { ValidationService } from 'src/common/validation.service';
import { StoreValidation } from './stores.validation';
import { AccountsService } from 'src/accounts/accounts.service';

@Controller()
export class StoresController {
  constructor(
    private readonly storesService: StoresService,
    private readonly validationService: ValidationService,
    private readonly accountService: AccountsService,
    private readonly storeValidation: StoreValidation,
  ) {}

  @EventPattern({ cmd: 'store_created' })
  @Exempt()  
  async create(@Payload() data: any , @Ctx() context: RmqContext) {
    console.log('store created emit received:', data);
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    const sanitizedData = {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      deleted_at: data.deleted_at ? new Date(data.deleted_at) : null,
    }

    try {
      let validatedData = await this.validationService.validate(this.storeValidation.CREATE, sanitizedData);

      const newData = await this.storesService.create(validatedData);
      if (newData) {
        channel.ack(originalMsg);
        console.log('Store created successfully acked:', newData);
        // create default accounts for this store
        this.accountService.generateDefaultAccountsByStore(newData.id);
      }
    } catch (error) {
      console.error('Error creating Store:', error);
      channel.nack(originalMsg);
    }  
  }

  @EventPattern({ cmd: 'store_updated' })
  @Exempt()  
  async update(@Payload() data: any , @Ctx() context: RmqContext) {
    console.log('store updated emit received:', data);
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    const sanitizedData = {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      deleted_at: data.deleted_at ? new Date(data.deleted_at) : null,
    }

    try {
      let validatedData = await this.validationService.validate(this.storeValidation.UPDATE, sanitizedData);

      const updatedData = await this.storesService.update(validatedData.id, validatedData);
      if (updatedData) {
        channel.ack(originalMsg);
        console.log('Store created successfully acked:', updatedData);
      }
    } catch (error) {
      console.error('Error creating Store:', error);
      channel.nack(originalMsg);
    } 
  }

  @EventPattern({cmd:'store_deleted'})
  @Exempt()
  async remove(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('Store deleted emit received', data);
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const deletedData = await this.storesService.delete(data);
      if (deletedData) {
        channel.ack(originalMsg);
        console.log('store deleted successfully acked:', deletedData);
      }
    } catch (error) {
      console.error('Error processing store_deleted event', error.stack);
      channel.nack(originalMsg);
    }
  }
}
