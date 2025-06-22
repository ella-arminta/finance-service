import { Controller } from '@nestjs/common';
import { OperationService } from './operation.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { Exempt } from 'src/decorator/exempt.decorator';
import { ValidationService } from 'src/common/validation.service';
import { OperationValidation } from './operation.validation';
import { ResponseDto } from 'src/common/response.dto';
import { DatabaseService } from 'src/database/database.service';
import { RmqHelper } from 'src/helper/rmq.helper';

@Controller()
export class OperationController {
  constructor(
    private readonly operationService: OperationService,
    private readonly validationService: ValidationService,
    private readonly operationValidation: OperationValidation,
    private readonly db: DatabaseService
  ) {}

  @EventPattern('operation.created')
  @Exempt()
  async operationCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('operation data created', data);
    const user = data.user;
    data = data.data;

    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        const validatedData = await this.validationService.validate(this.operationValidation.CREATE, data);
        const newdata = await this.operationService.create(validatedData, user);
        return { success: !!newdata }; // Ensures success is always returned
      },
      {
        queueName: 'operation.created',
        useDLQ: true,
        dlqRoutingKey: 'dlq.operation.created',
        prisma: this.db,
      },
    )();
  }

  @EventPattern('operation.updated')
  @Exempt()
  async operationUpdated(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('operation data updated', data);
    const user = data.user;
    data = data.data;

    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        const validatedData = await this.validationService.validate(this.operationValidation.UPDATE, data);
        const updatedata = await this.operationService.update(data.id, validatedData, user)
        return { success: !!updatedata }; // Ensures success is always returned
      },
      {
        queueName: 'operation.updated',
        useDLQ: true,
        dlqRoutingKey: 'dlq.operation.updated',
        prisma: this.db,
      },
    )();
  }

  @EventPattern('operation.deleted')
  @Exempt()
  async operationDeleted(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('operation data deleted', data);
    const user = data.user;
    data = data.data;
    
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        const deletedData = await this.operationService.delete(data, user);
        return { success: !!deletedData }; // Ensures success is always returned
      },
      {
        queueName: 'operation.deleted',
        useDLQ: true,
        dlqRoutingKey: 'dlq.operation.deleted',
        prisma: this.db,
      },
    )();
  }
}
