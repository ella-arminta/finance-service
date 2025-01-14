import { Test, TestingModule } from '@nestjs/testing';
import { AccountTypesService } from './account-types.service';

describe('AccountTypesService', () => {
  let service: AccountTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountTypesService],
    }).compile();

    service = module.get<AccountTypesService>(AccountTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
