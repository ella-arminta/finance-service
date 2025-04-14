import { Controller } from '@nestjs/common';
import { OperationService } from './operation.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { Exempt } from 'src/decorator/exempt.decorator';
import { ValidationService } from 'src/common/validation.service';
import { OperationValidation } from './operation.validation';
import { ResponseDto } from 'src/common/response.dto';
import { RmqAckHelper } from 'src/helper/rmq-ack.helper';

@Controller()
export class OperationController {
  constructor(
    private readonly operationService: OperationService,
    private readonly validationService: ValidationService,
    private readonly operationValidation: OperationValidation,
  ) {}

  @EventPattern({ cmd: 'operation_created' })
  @Exempt()
  async operationCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('operation data created', data);

    await RmqAckHelper.handleMessageProcessing(
      context,
      async () => {
        const validatedData = await this.validationService.validate(this.operationValidation.CREATE, data);
        const newdata = await this.operationService.create(validatedData);
        return { success: !!newdata }; // Ensures success is always returned
      },
      {
        queueName: 'operation_created',
        useDLQ: true,
        dlqRoutingKey: 'dlq.operation_created',
      },
    )();
  }

  @EventPattern({ cmd: 'operation_updated' })
  @Exempt()
  async operationUpdated(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('operation data updated', data);
    await RmqAckHelper.handleMessageProcessing(
      context,
      async () => {
        const validatedData = await this.validationService.validate(this.operationValidation.UPDATE, data);
        const updatedata = await this.operationService.update(data.id, validatedData)
        return { success: !!updatedata }; // Ensures success is always returned
      },
      {
        queueName: 'operation_updated',
        useDLQ: true,
        dlqRoutingKey: 'dlq.operation_updated',
      },
    )();
  }

  @EventPattern({ cmd: 'operation_deleted' })
  @Exempt()
  async operationDeleted(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('operation data deleted', data);
    await RmqAckHelper.handleMessageProcessing(
      context,
      async () => {
        const deletedData = await this.operationService.delete(data);
        return { success: !!deletedData }; // Ensures success is always returned
      },
      {
        queueName: 'operation_deleted',
        useDLQ: true,
        dlqRoutingKey: 'dlq.operation_deleted',
      },
    )();
  }
}
