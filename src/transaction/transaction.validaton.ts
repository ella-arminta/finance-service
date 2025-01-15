import { Injectable } from '@nestjs/common';
import { AccountsService } from 'src/accounts/accounts.service';
import { CompaniesService } from 'src/companies/companies.service';
import { StoresService } from 'src/stores/stores.service';
import { ZodType, z } from 'zod';

@Injectable()
export class TransactionValidation {
  constructor(
    private readonly storeService: StoresService,
    private readonly companiesService: CompaniesService,
    private readonly accountsService: AccountsService,
  ) {}

  readonly CREATE: ZodType = z.object({
    store_id: z.string().uuid().refine(
      async (store_id) => {
        const store = await this.storeService.findOne(store_id);
        return !!store;
      },
      {
        message: 'Store ID does not exist',
      },
    ),
    trans_date: z.date(),
    trans_type: z.number().int(),
    description: z.string(),
    accounts: z.array(
      z.object({
        account_id: z.string().uuid().refine(
          async (account_id) => {
            const account = await this.accountsService.findOne(account_id);
            return !!account;
          },
          {
            message: 'Account ID does not exist',
          },
        ),
        amount: z.number().int(),
        description: z.string(),
      }),
    ),
  });
}
