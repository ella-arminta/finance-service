import { Controller } from '@nestjs/common';
import { OperationService } from './operation.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { Exempt } from 'src/decorator/exempt.decorator';
import { ValidationService } from 'src/common/validation.service';
import { OperationValidation } from './operation.validation';
import { ResponseDto } from 'src/common/response.dto';

@Controller()
export class OperationController {
  constructor(
    private readonly operationService: OperationService,
    private readonly validationService: ValidationService,
    private readonly operationValidation: OperationValidation,
  ) {}

  private async handleEvent(
    context: RmqContext,
    callback: () => Promise<{ success: boolean }>,
    errorMessage: string,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const response = await callback();
      if (response.success) {
        channel.ack(originalMsg);
      }
    } catch (error) {
      console.error(errorMessage, error.stack);
      channel.nack(originalMsg);
    }
  }

  @EventPattern({ cmd: 'operation_created' })
  @Exempt()
  async operationCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('operation data created', data);
    
    await this.handleEvent(
      context,
      async () => {
        const newdata = await this.operationService.create(data);
        return { success: !!newdata }; // Ensures success is always returned
      },
      'Error processing operation_created event',
    );
  }

  @EventPattern({ cmd: 'operation_updated' })
  @Exempt()
  async operationUpdated(@Payload() data: any, @Ctx() context: RmqContext) {
    await this.handleEvent(
      context,
      async () => {
        const updatedata = await this.operationService.update(data.id, data)
        return { success: !!updatedata }; // Ensures success is always returned
      },
      'Error processing operation_updated event',
    );
  }

  @EventPattern({ cmd: 'operation_deleted' })
  @Exempt()
  async operationDeleted(@Payload() data: any, @Ctx() context: RmqContext) {
    await this.handleEvent(
      context,
      async () => {
        const deletedData = await this.operationService.delete(data);
        return { success: !!deletedData }; // Ensures success is always returned
      },
      'Error processing operation_deleted event',
    );
  }
}
