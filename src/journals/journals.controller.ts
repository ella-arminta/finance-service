import { Controller } from '@nestjs/common';
import { JournalsService } from './journals.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Describe } from 'src/decorator/describe.decorator';
import { ResponseDto } from 'src/common/response.dto';

@Controller()
export class JournalsController {
  constructor(
    private readonly journalsService: JournalsService
  ) {}

  @MessagePattern({ cmd: 'get:journal' })
  @Describe({
    description: 'Get Journals',
    fe: [
      'finance/journal:open',
    ]
  })
  async get(@Payload() data: any) {
    const filters = data.body;
    console.log(filters, ' satu filters');
    // TODOELLA company_id  / store_id auth

    // Change Filter Date Format
    if (filters.dateStart != null) {
      filters.dateStart = new Date(filters.dateStart);
    }
    if (filters.dateEnd != null) {
      var endDate = new Date(filters.dateEnd);
      endDate.setHours(23, 59, 59, 0); // Sets time to 23:59:59.000
      filters.dateEnd = endDate;
    }
    if (!filters.company_id && !filters.store_id) {
      filters.owner_id = filters.owner_id;
    }

    console.log(filters, 'filters');

    const result = await this.journalsService.getJournals(filters);
    return ResponseDto.success('Data Found!', result, 200);
  }

  @MessagePattern({ cmd: 'get:journal/*' })
  @Describe({
    description: 'Get Journals By ID',
    fe: [
      'finance/journal/detail:open',
      'finance/journal:detail',
    ]
  })
  async getByID(@Payload() data: any) {
    const filters = data.body;
    const id = data.params.id;
    // TODOELLA company_id  / store_id auth

    // Change Filter Date Format
    if (filters.dateStart != null) {
      filters.dateStart = new Date(filters.dateStart);
    }
    if (filters.dateEnd != null) {
      var endDate = new Date(filters.dateEnd);
      endDate.setHours(23, 59, 59, 0); // Sets time to 23:59:59.000
      filters.dateEnd = endDate;
    }
    if (!filters.company_id && !filters.store_id) {
      filters.owner_id = filters.owner_id;
    }

    const result = await this.journalsService.getJournalsByID(id,filters);
    return ResponseDto.success('Data Found!', result, 200);
  }
}
