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
  ) { }

  readonly CREATE: ZodType = z.object({
    code: z.string(),
    account_cash_id: z.string().uuid({ message: 'Account Cash must be filled' }),
    store_id: z.string().uuid().refine(
      async (store_id) => {
        const store = await this.storeService.findOne(store_id);
        return !!store;
      },
      {
        message: 'Store ID does not exist',
      },
    ),
    total: z.number(),
    trans_date: z.date(),
    trans_type_id: z.number().int(),
    description: z.string(),
    created_by: z.string().uuid(),
    updated_by: z.string().uuid(),
    accounts: z.array(
      z.object({
        account_id: z.string({ message:'Account must be chosen' }).uuid().refine(
          async (account_id) => {
            const account = await this.accountsService.findOne(account_id);
            return !!account;
          },
          {
            message: 'Account ID does not exist',
          },
        ),
        amount: z.string({ message:'Amount must be filled'}).refine((val) => {
          try {
            parseFloat(val);
            return true;
          } catch (error) {
            return false;
          }
        }, { message: 'Amount must be number' }),
        description: z.string(),
      }),
    ).min(1, { message: 'At least one account is required' }),
  });

  readonly FILTER: ZodType = z.object({
    store_id: z.string().uuid().optional(),
    trans_type_id: z.preprocess((val) => {
      if (typeof val === 'string') {
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }
      return val;
    }, z.number().int().refine((val) => val > 0, { message: 'Invalid trans_type_id' })),
    start_date: z.preprocess((val) => {
      if (typeof val === 'string') {
        const parsed = new Date(val);
        if (!isNaN(parsed.getTime())) {
          // Ensure the date is in 'YYYY-MM-DD' format
          return parsed.toISOString().split('T')[0];
        }
      }
      return val;
    }, z.string().optional()),
    end_date: z.preprocess((val) => {
      if (typeof val === 'string') {
        const parsed = new Date(val);
        if (!isNaN(parsed.getTime())) {
          // Ensure the date is in 'YYYY-MM-DD' format
          return parsed.toISOString().split('T')[0];
        }
      }
      return val;
    }, z.string().optional()),
  });


  readonly UPDATE: ZodType = z.object({
    account_cash_id: z.string().uuid().optional(),
    total: z.number().optional(),
    description: z.string().optional(),
    updated_by: z.string().uuid(),
    updated_at: z.date(),
    accounts: z.array(
      z.object({
        account_id: z.string({ message:'Account must be chosen' }).uuid().refine(
          async (account_id) => {
            const account = await this.accountsService.findOne(account_id);
            return !!account;
          },
          {
            message: 'Account ID does not exist',
          },
        ),
        amount: z.string({ message:'Amount must be filled'}).refine((val) => {
          try {
            var parsedVal = parseFloat(val);
            if (parsedVal == 0 || isNaN(parsedVal)) {
              return false;
            }
            return true;
          } catch (error) {
            return false;
          }
        }, { message: 'Amount must be number & more than 0' }),
        description: z.string(),
      }),
    ).min(1, { message: 'At least one account is required' }),
  });

}
