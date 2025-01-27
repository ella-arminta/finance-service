import { Controller } from '@nestjs/common';
import { JournalsService } from './journals.service';
import { MessagePattern } from '@nestjs/microservices';
import { Describe } from 'src/decorator/describe.decorator';
import { ResponseDto } from 'src/common/response.dto';

@Controller()
export class JournalsController {
  constructor(
    private readonly journalsService: JournalsService
  ) {}

  @MessagePattern({ cmd: 'get:journal' })
  @Describe('Get Journals')
  async get() {
    const data = await this.journalsService.getReport();
    return ResponseDto.success('Data Found!', data, 200);
  }
}
