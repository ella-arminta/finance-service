import { Test, TestingModule } from '@nestjs/testing';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { ValidationService } from '../common/validation.service';

describe('AccountsController', () => {
  let controller: AccountsController;

  const mockAccountsService = {
    create: jest.fn( dto => {
      return {
        id: 1,
        ...dto
      }
    }),
    update: jest.fn((id, dto) => Promise.resolve({
      id,
      ...dto
    })),
  }
  const mockValidationService = {
    validate: jest.fn( (validation, dto) => {
      return {
        id: 1,
        ...dto
      }
    })
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [AccountsService, ValidationService],
    })
    .overrideProvider(AccountsService).useValue(mockAccountsService)
    .overrideProvider(ValidationService).useValue(mockValidationService)
    .compile();

    controller = module.get<AccountsController>(AccountsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create account', async () => {
    const account = {
        code: 123, 
        deactive: false,
        name: 'test',
        type: 1,
    }

    await expect(controller.create(account)).resolves.toEqual({
        error: [],
        message: 'success',
        statusCode : 200,
        data: {
            id: 1,
            ...account
        }
    });
  });

  it('should update a account', async () => {
    const dto = {
        deactive: true,
    }
    
    await expect(controller.update(1, dto)).resolves.toEqual({
        id: 1,
        ...dto
    });

    // expect(mockAccountsService.update).toHaveBeenCalledWith();
  });

});
