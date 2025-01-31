import { Module } from '@nestjs/common';
import { TaskScheduleService } from './task-schedule.service';
import { TaskScheduleController } from './task-schedule.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [TaskScheduleController],
  providers: [TaskScheduleService],
})
export class TaskScheduleModule {}
