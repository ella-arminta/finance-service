import { Test, TestingModule } from '@nestjs/testing';
import { TaskScheduleController } from './task-schedule.controller';
import { TaskScheduleService } from './task-schedule.service';

describe('TaskScheduleController', () => {
  let controller: TaskScheduleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskScheduleController],
      providers: [TaskScheduleService],
    }).compile();

    controller = module.get<TaskScheduleController>(TaskScheduleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
