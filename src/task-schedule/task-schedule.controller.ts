import { Controller } from '@nestjs/common';
import { TaskScheduleService } from './task-schedule.service';
import { Cron } from '@nestjs/schedule';
import { DatabaseService } from 'src/database/database.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Describe } from 'src/decorator/describe.decorator';
import { ResponseDto } from 'src/common/response.dto';

@Controller()
export class TaskScheduleController {
  constructor(
    private readonly taskScheduleService: TaskScheduleService,
  ) {}

  @MessagePattern({cmd: 'get:scrape-data' })
  @Describe({
    description: 'Get scrape data',
    fe: []
  })
  async getScrapeData(@Payload() data: any) {
    const scrapedDaata = await this.taskScheduleService.scrapeDataGold2();
    const svaedDb  = await this.taskScheduleService.handleCron();
    return ResponseDto.success('Data fetch',scrapedDaata);
  }

  // get gold price
  @MessagePattern({cmd: 'get:gold-price' })
  @Describe({
    description: 'Get gold price',
    fe: [
      'home:open'
    ]
  })
  async getGoldPrice(@Payload() data: any) {
    const filter = data.body;
    const goldPrice = await this.taskScheduleService.getGoldPrice(filter);
    return ResponseDto.success('Gold price',goldPrice);
  }

  @MessagePattern({cmd: 'get:current-gold-price' })
  @Describe({
    description: 'Get current gold price',
    fe: [
      'home:open'
    ]
  })
  async getCurrentGoldPrice(@Payload() data: any) {
    const currentGoldPrice = await this.taskScheduleService.getCurrentGoldPrice();
    return ResponseDto.success('Current gold price',currentGoldPrice);
  }
}
