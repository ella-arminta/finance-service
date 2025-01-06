import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { CompaniesService } from './companies.service';
import { Prisma } from '@prisma/client';
import { ValidationService } from 'src/common/validation.service';
import { CompanyValidation } from './companies.validation';
import { response } from 'express';
import { ResponseDto } from 'src/common/response.dto';

@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private validationService: ValidationService,
  ) {}

  @EventPattern('createCompany')
  create(@Payload() data: Prisma.CompaniesCreateInput , @Ctx() context: RmqContext) {
    var createCompany = this.validationService.validate(CompanyValidation.CREATE, data);
    createCompany = this.companiesService.create(createCompany);

    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);

    return new ResponseDto(createCompany, 'success', 201);
  }

  @EventPattern('updateCompany')
  async update(@Payload() data: { id: number; updateCompanyDto: any }, @Ctx() context: RmqContext) {
      await this.validationService.validate(CompanyValidation.UPDATE, data);

      const { id, updateCompanyDto } = data;
      return this.companiesService.update(id, updateCompanyDto);

      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);

      return new ResponseDto(updateCompanyDto, 'success', 201);
  }

  @EventPattern('removeCompany')
  remove(@Payload() id: number) {
    return this.companiesService.delete(id);
  }

  // @MessagePattern('findAllCompanies')
  // findAll() {
  //   return this.companiesService.findAll();
  // }

  // @MessagePattern('findOneCompany')
  // findOne(@Payload() id: number) {
  //   return this.companiesService.findOne(id);
  // }
}
