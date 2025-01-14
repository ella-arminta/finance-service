import { Test, TestingModule } from '@nestjs/testing';
import { AccountTypesController } from './account-types.controller';
import { AccountTypesService } from './account-types.service';

describe('AccountTypesController', () => {
  let controller: AccountTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountTypesController],
      providers: [AccountTypesService],
    }).compile();

    controller = module.get<AccountTypesController>(AccountTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
