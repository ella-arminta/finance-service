import { Injectable } from '@nestjs/common';
import { ActionAccountSettingService } from 'src/action-account-setting/action-account-setting.service';
import { ZodType, z } from 'zod';

@Injectable()
export class TransAccountSettingsValidation {
  constructor(
      private readonly actionAccountSet: ActionAccountSettingService,
  ) {}

  readonly CREATE: ZodType = z.object({
    store_id: z.string().uuid(),
    account_id: z.string().uuid(),
    action: z.string().refine(
      async (action) => {
        const action_account = await this.actionAccountSet.findOne(action);
        return !!action_account;
      },
      {
        message: 'Action does not exist',
      },
    ),
  });

  readonly UPDATE: ZodType = z.object({
    store_id: z.string().uuid().optional(),
    account_id: z.string().uuid().optional(),
    action: z.string().optional().refine(
      async (action) => {
        const action_account = await this.actionAccountSet.findOne(action);
        return !!action_account;
      },
      {
        message: 'Action does not exist',
      },
    ),
  });

  readonly FILTERS: ZodType = z.object({
    store_id: z.string().uuid().optional(),
    account_id: z.string().uuid().optional(),
    action: z.string().optional(),
  });
}