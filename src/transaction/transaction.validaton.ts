import { Injectable } from '@nestjs/common';
import { AccountsService } from 'src/accounts/accounts.service';
import { CompaniesService } from 'src/companies/companies.service';
import { StoresService } from 'src/stores/stores.service';
import { ZodType, z } from 'zod';
import { RecurringType } from '@prisma/client';
const RecurringTypeValues = Object.values(RecurringType)

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
        account_id: z.string({ message: 'Account must be chosen' }).uuid().refine(
          async (account_id) => {
            const account = await this.accountsService.findOne(account_id);
            return !!account;
          },
          {
            message: 'Account ID does not exist',
          },
        ),
        amount: z.string({ message: 'Amount must be filled' }).refine((val) => {
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

  readonly CREATERECURRING: ZodType = z.object({
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
        account_id: z.string({ message: 'Account must be chosen' }).uuid().refine(
          async (account_id) => {
            const account = await this.accountsService.findOne(account_id);
            return !!account;
          },
          {
            message: 'Account ID does not exist',
          },
        ),
        amount: z.string({ message: 'Amount must be filled' }).refine((val) => {
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
    // recurring conf
    startDate: z.preprocess((val: any) => {
      try {
        const parsed = new Date(val);
        return new Date(parsed.toISOString());
      } catch (error) {
        return val;
      }
    }, z.date({
      required_error: 'Start date is required.',
      invalid_type_error: 'Start date must be a valid date.',
    }).optional()),

    endDate: z.preprocess((val: any) => {
      try {
        if (val === '') return null;
        const parsed = new Date(val);
        return new Date(parsed.toISOString());
      } catch (error) {
        return val;
      }
    }, z.date({
      invalid_type_error: 'End date must be a valid date.',
    }).optional().nullable()),

    recurringType: z
      .string()
      .transform((val) => val.toUpperCase())
      .refine((val): val is RecurringType => RecurringTypeValues.includes(val as RecurringType), {
        message: 'Recurring type must be one of: DAY, WEEK, MONTH, or YEAR.',
      })
      .transform((val) => val as RecurringType),

    interval: z
      .number({
        required_error: 'Interval is required.',
        invalid_type_error: 'Interval must be a number.',
      })
      .int('Interval must be a whole number.')
      .min(1, 'Interval must be at least 1.'),

    daysOfWeek: z
      .array(
        z
          .number({
            invalid_type_error: 'Each day must be a number.',
          })
          .int('Day must be a whole number.')
          .min(0, 'Days of the week must be between 0 (Sunday) and 6 (Saturday).')
          .max(6, 'Days of the week must be between 0 (Sunday) and 6 (Saturday).'),
        {
          invalid_type_error: 'Days of week must be an array of numbers.',
        }
      )
      .optional()
      .nullable(),

    dayOfMonth: z
      .number({ invalid_type_error: 'Day of month must be a number.' })
      .int('Day of month must be a whole number.')
      .refine(val => val === -1 || (val >= 1 && val <= 31), {
        message: 'Day of month must be between 1 and 31, or -1.',
      })
      .optional()
      .nullable(),

    monthOfYear: z
      .array(
        z
          .number({
            invalid_type_error: 'Month must be a number.',
          })
          .int('Month must be a whole number.')
          .min(0, 'Month of year must be between 0 (January) and 11 (December).')
          .max(11, 'Month of year must be between 0 (January) and 11 (December).'),
        {
          invalid_type_error: 'Months must be an array of numbers.',
        }
      )
      .optional()
      .nullable(),

    dayOfYear: z
      .number({ invalid_type_error: 'Day of year must be a number.' })
      .int('Day of year must be a whole number.')
      .refine(val => val === -1 || (val >= 1 && val <= 31), {
        message: 'Day of year must be between 1 and 31, or -1.',
      })
      .optional()
      .nullable(),    
  })

  readonly FILTER: ZodType = z.object({
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
    account_id: z.string().optional().nullable(),
    auth: z.object({
      company_id: z.string().uuid().optional(),
      store_id: z.string().uuid().optional(),
    })
  });


  readonly UPDATE: ZodType = z.object({
    account_cash_id: z.string().uuid().optional(),
    total: z.number().optional(),
    description: z.string().optional(),
    updated_by: z.string().uuid(),
    updated_at: z.date(),
    accounts: z.array(
      z.object({
        account_id: z.string({ message: 'Account must be chosen' }).uuid().refine(
          async (account_id) => {
            const account = await this.accountsService.findOne(account_id);
            return !!account;
          },
          {
            message: 'Account ID does not exist',
          },
        ),
        amount: z.string({ message: 'Amount must be filled' }).refine((val) => {
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

  readonly CREATESALES: ZodType = z.object({
    store_id: z.string().uuid(),
    tax_price: z
      .union([z.string(), z.number()])
      .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
      .refine((val) => !isNaN(val), { message: "Invalid tax_price" }),
    tax_percent: z
      .union([z.string(), z.number()])
      .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
      .refine((val) => !isNaN(val), { message: "Invalid tax_percent" }),
    transaction_operations: z.array(
      z.object({
        operation_id: z.string().uuid().optional().nullable(),
        operation: z.record(z.any()).optional().nullable(),
        total_price: z
          .union([z.string(), z.number()])
          .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
          .refine((val) => !isNaN(val), { message: "Invalid total_price" }),
        name: z.string(),
        discount: z
          .union([z.string(), z.number()])
          .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
          .refine((val) => !isNaN(val), { message: "Invalid discount" })
          .optional(),
      })
    ),
    transaction_products: z.array(
      z.object({
        operation_id: z.string().uuid().optional().nullable(),
        operation: z.record(z.any()).optional().nullable(),
        total_price: z
          .union([z.string(), z.number()])
          .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
          .refine((val) => !isNaN(val), { message: "Invalid total_price" }),
        name: z.string(),
        discount: z
          .union([z.string(), z.number()])
          .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
          .refine((val) => !isNaN(val), { message: "Invalid discount" })
          .optional(),
        product_code: z.any().optional().nullable(),
        weight: z
          .union([z.string(), z.number()])
          .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
          .refine((val) => !isNaN(val), { message: "Invalid weight" }),
        // buy price parseFloat
        buy_price: z.preprocess((val) => {
          if (typeof val === 'string') {
            const parsed = parseFloat(val);
            if (!isNaN(parsed)) {
              return parsed;
            }
          }
          return val;
        }, z.number().optional().nullable()),
      })
    ),
    status: z
      .union([z.string(), z.number()])
      .transform((val) => (typeof val === "string" ? parseInt(val) : val))
      .refine((val) => !isNaN(val), { message: "Invalid status" }),
    total_price: z
      .union([z.string(), z.number()])
      .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
      .refine((val) => !isNaN(val), { message: "Invalid total_price" }),
    sub_total_price: z
      .union([z.string(), z.number()])
      .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
      .refine((val) => !isNaN(val), { message: "Invalid total_price" }),
    payment_method: z
      .union([z.string(), z.number()])
      .transform((val) => (typeof val === "string" ? parseInt(val) : val))
      .refine((val) => !isNaN(val), { message: "Invalid payment method" }),
    id: z.string().uuid(),
    code: z.string(),
    created_at: z.any(),
    description: z.string().optional().nullable(),
    transaction_type: z.number(),
  });

  readonly CREATEPURCHASE: ZodType = z.object({
    store_id: z.string().uuid(),
    store: z.any(),
    account_id: z.string().uuid().nullable().optional(),
    id: z.string().uuid(),
    code: z.string(),
    created_at: z.string().datetime(),
    status: z
      .union([z.string(), z.number()])
      .transform((val) => (typeof val === "string" ? parseInt(val) : val))
      .refine((val) => !isNaN(val), { message: "Invalid status" }),
    paid_amount: z
      .union([z.string(), z.number()])
      .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
      .refine((val) => !isNaN(val), { message: "Invalid Paid Amount" }).optional(),
    total_price: z
      .union([z.string(), z.number()])
      .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
      .refine((val) => !isNaN(val), { message: "Invalid Total Price" }),
    transaction_products: z.array(
      z.object({
        id: z.string().uuid().optional().nullable(),
        product_code: z.object({
          product: z.any(),
          barcode: z.string(),
          id: z.string().uuid(),
        }).nullable().optional(),
        total_price: z
          .union([z.string(), z.number()])
          .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
          .refine((val) => !isNaN(val), { message: "Invalid Total Price" }),
        weight: z.any(),
        created_at: z.any(),
        buy_price: z.preprocess((val) => {
          if (typeof val === 'string') {
            const parsed = parseFloat(val);
            if (!isNaN(parsed)) {
              return parsed;
            }
          }
          return val;
        }, z.number().optional().nullable()),
        type: z.string().optional().nullable(),
      })
    ),
  })

  readonly CREATETRADE: ZodType = z.object({
    store_id: z.string().uuid(),
    store: z.any(),
    account_id: z.string().uuid().nullable().optional(),
    id: z.string().uuid(),
    code: z.string(),
    created_at: z.string().datetime(),
    payment_method: z
    .preprocess((val) => {
      if (val === null || val === undefined) return val;
      if (typeof val === "string") return parseInt(val);
      return val;
    }, z.number().nullable().optional())
    .refine((val) => val === null || val === undefined || !isNaN(val), {
      message: "Invalid payment method",
    }),
    adjustment_price: z.union([z.string(), z.number()])
      .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
      .refine((val) => !isNaN(val), { message: "Invalid adjustment price" }).optional(),
    sub_total_price: z.union([z.string(), z.number()])
      .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
      .refine((val) => !isNaN(val), { message: "Invalid adjustment price" }).optional(),
    tax_price: z.union([z.string(), z.number()])
      .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
      .refine((val) => !isNaN(val), { message: "Invalid adjustment price" }).optional(),
    status: z
      .union([z.string(), z.number()])
      .transform((val) => (typeof val === "string" ? parseInt(val) : val))
      .refine((val) => !isNaN(val), { message: "Invalid status" }),
    paid_amount: z
      .union([z.string(), z.number()])
      .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
      .refine((val) => !isNaN(val), { message: "Invalid Paid Amount" }).optional(),
    total_price: z
      .union([z.string(), z.number()])
      .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
      .refine((val) => !isNaN(val), { message: "Invalid Total Price" }),
    transaction_products: z.array(
      z.object({
        id: z.string().uuid().optional().nullable(),
        product_code: z.object({
          product: z.any(),
          barcode: z.string(),
          id: z.string().uuid(),
          buy_price: z
            .union([z.string(), z.number()])
            .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
            .refine((val) => !isNaN(val), { message: "Invalid Buy Price" }),
        }).nullable().optional(),
        total_price: z
          .union([z.string(), z.number()])
          .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
          .refine((val) => !isNaN(val), { message: "Invalid Total Price" }),
        weight: z
          .union([z.string(), z.number()])
          .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
          .refine((val) => !isNaN(val), { message: "Invalid weight" }),
        created_at: z.any(),
        buy_price: z.preprocess((val) => {
          if (typeof val === 'string') {
            const parsed = parseFloat(val);
            if (!isNaN(parsed)) {
              return parsed;
            }
          }
          return val;
        }, z.number().optional().nullable()),
      })
    ),
    transaction_operations: z.array(
      z.object({
        operation_id: z.string().uuid().optional().nullable(),
        operation: z.record(z.any()).optional().nullable(),
        total_price: z
          .union([z.string(), z.number()])
          .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
          .refine((val) => !isNaN(val), { message: "Invalid total_price" }),
        name: z.string(),
        discount: z
          .union([z.string(), z.number()])
          .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
          .refine((val) => !isNaN(val), { message: "Invalid discount" })
          .optional(),
      })
    ),
  })

}
