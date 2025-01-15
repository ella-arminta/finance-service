import { Injectable } from '@nestjs/common';
import { ZodType, z } from 'zod';
import { AccountTypesService } from 'src/account-types/account-types.service';
import { StoresService } from 'src/stores/stores.service';

@Injectable()
export class AccountValidation {
  constructor(
    private readonly accountTypeService: AccountTypesService,
    private readonly storeService: StoresService,
  ) {}

  readonly CREATE: ZodType = z.object({
    company_id: z.string().uuid(),
    code: z.number().int().min(1),
    name: z.string().min(1).max(255).transform((name) => name.toUpperCase()),
    account_type_id: z.number().int().refine(
      async (account_type_id) => {
        const account_type = await this.accountTypeService.findOne(account_type_id);
        return !!account_type;
      },
      {
        message: 'Account type ID does not exist',
      },
    ),
    store_id: z.string().uuid().optional().nullable(),
    deactive: z.boolean().optional().nullable(),
  });

  readonly FILTERS: ZodType = z.object({
    code: z.number().int().optional().nullable(),
    name: z.string().min(1).max(255).optional().nullable(),
    account_type_id: z.number().int().optional().nullable(),
    store_id: z.string().uuid().optional().nullable(),
    company_id: z.string().uuid().optional().nullable(),
    deactive: z.boolean().optional().nullable(),
  });

  readonly UPDATE: ZodType = z.object({
    name: z.string().min(1).max(255).optional().transform((name) => name.toUpperCase()),
    account_type_id: z.number().int().optional().refine(
      async (account_type_id) => {
        if (!account_type_id) return true;
        const account_type = await this.accountTypeService.findOne(account_type_id);
        return !!account_type;
      },
      {
        message: 'Account type ID does not exist',
      },
    ),
    store_id: z.string().uuid().optional().refine(
      async (store_id) => {
        if (!store_id) return true;
        const store = await this.storeService.findOne(store_id);
        return !!store;
      },
      {
        message: 'Store ID does not exist',
      },
    ),
    company_id: z.string().uuid().optional(),
    deactive: z.boolean().optional(),
  });
}