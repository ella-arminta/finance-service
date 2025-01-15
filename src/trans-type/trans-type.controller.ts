import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TransTypeService } from './trans-type.service';
import { Describe } from 'src/decorator/describe.decorator';
import { ResponseDto } from 'src/common/response.dto';

@Controller()
export class TransTypeController {
  constructor(private readonly transTypeService: TransTypeService) {}

  // @MessagePattern('createTransType')
  // create(@Payload() createTransTypeDto: CreateTransTypeDto) {
  //   return this.transTypeService.create(createTransTypeDto);
  // }

  @MessagePattern({ cmd: 'get:trans-type' })
  @Describe('Get all trans type')
  async findAll(@Payload() data: any) {
    const filters = data.filters || {};
    const transTypes = await this.transTypeService.findAll(filters);
    return ResponseDto.success('Data Found!', transTypes, 200);
  }

  @MessagePattern({ cmd: 'get:trans-type/*' })
  @Describe('get trans type by id')
  async findOne(@Payload() data: any) {
    const param = data.params;
    param.id = parseInt(param.id);
    const transTypes = await this.transTypeService.findOne(param.id);
    return ResponseDto.success('Data Found!', transTypes, 200);
  }

  // @MessagePattern('updateTransType')
  // update(@Payload() updateTransTypeDto: UpdateTransTypeDto) {
  //   return this.transTypeService.update(updateTransTypeDto.id, updateTransTypeDto);
  // }

  // @MessagePattern('removeTransType')
  // remove(@Payload() id: number) {
  //   return this.transTypeService.remove(id);
  // }
}
