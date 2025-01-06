import { Test, TestingModule } from '@nestjs/testing';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { ValidationService } from '../common/validation.service';

describe('AccountsController', () => {
  let controller: AccountsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [AccountsService, ValidationService],
    })
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
