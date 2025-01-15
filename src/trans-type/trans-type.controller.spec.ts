import { Test, TestingModule } from '@nestjs/testing';
import { TransTypeController } from './trans-type.controller';
import { TransTypeService } from './trans-type.service';

describe('TransTypeController', () => {
  let controller: TransTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransTypeController],
      providers: [TransTypeService],
    }).compile();

    controller = module.get<TransTypeController>(TransTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
