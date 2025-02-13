import { Controller } from '@nestjs/common';
import { AccountTypesService } from './account-types.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Describe } from 'src/decorator/describe.decorator';
import { ResponseDto } from 'src/common/response.dto';

@Controller()
export class AccountTypesController {
  constructor(private readonly accountTypesService: AccountTypesService) {}

  @MessagePattern({ cmd: 'get:account-type' })
  @Describe({
    description: 'Get all account type',
    fe: []
  })
  async findAll(@Payload() data: any) {
    const filters = data.filters || {};
    const accountTypes = await this.accountTypesService.findAll(filters);
    return ResponseDto.success('Data Found!', accountTypes, 200);
  }

  @MessagePattern({ cmd: 'get:account-type/*' })
  @Describe({
    description: 'get account type by id',
    fe: []
  })
  async findOne(@Payload() data: any) {
    const param = data.params;
    const body = data.body;
    console.log('body', body);
    param.id = parseInt(param.id);
    const accountTypes = await this.accountTypesService.findOne(param.id);

    if (body.code == true) {
      const generateCode = await this.accountTypesService.generateCode(accountTypes,body.company_id);
      return ResponseDto.success('Data Found!', generateCode, 200);
    } else {
      return ResponseDto.success('Data Found!', accountTypes, 200);
    }
  }
}
