import { Controller } from '@nestjs/common';
import { AccountTypesService } from './account-types.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Describe } from 'src/decorator/describe.decorator';
import { ResponseDto } from 'src/common/response.dto';

@Controller()
export class AccountTypesController {
  constructor(private readonly accountTypesService: AccountTypesService) {}

  @MessagePattern({ cmd: 'get:account-type' })
  @Describe('Get all account type')
  async findAll(@Payload() data: any) {
    const filters = data.filters || {};
    const accountTypes = await this.accountTypesService.findAll(filters);
    return ResponseDto.success('Data Found!', accountTypes, 200);
  }

  @MessagePattern({ cmd: 'get:account-type/*' })
  @Describe('get account type by id')
  async findOne(@Payload() data: any) {
    const param = data.params;
    param.id = parseInt(param.id);
    const accountTypes = await this.accountTypesService.findOne(param.id);
    return ResponseDto.success('Data Found!', accountTypes, 200);
  }
}
