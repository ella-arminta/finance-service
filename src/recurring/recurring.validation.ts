import { Injectable } from '@nestjs/common';
import { ZodType, z } from 'zod';
import { RecurringType } from '@prisma/client';
const RecurringTypeValues = Object.values(RecurringType)
@Injectable()
export class RecurringValidation {
  constructor(
  ) { }
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
    }, z.number().int().refine((val) => val > 0, { message: 'Invalid trans_type_id' })).optional(),
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
    recurringType: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val !== undefined && val !== null ? val.toUpperCase() : val))
      .refine(
        (val): val is RecurringType =>
          val === null || val === undefined || RecurringTypeValues.includes(val as RecurringType),
        {
          message: 'Recurring type must be one of: DAY, WEEK, MONTH, or YEAR.',
        }
      )
      .transform((val) => val as RecurringType),

  });

  readonly UPDATE: ZodType = z.object({
    store_id: z.string().uuid().optional(),
    trans_start_date: z.preprocess((val) => {
      if (typeof val === 'string') {
        const parsed = new Date(val);
        if (!isNaN(parsed.getTime())) {
          // Yang bener ini
          return new Date(parsed.toISOString());
        }
      }
      return val;
    }, z.date().optional()),
    total: z.number().optional(),
    description: z.string().optional(),
    accounts: z.array(
      z.object({
        account_id: z.string({ message:'Account must be chosen' }).uuid(),
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
    updated_by: z.string().uuid(),
    updated_at: z.date(),
    account_cash_id: z.string().uuid().optional(),
    // recurring conf
    startDate:  z.preprocess((val: any) => {
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
      if (val == '') return null; // If empty string, treat as null
    
      const parsed = new Date(val);
      return isNaN(parsed.getTime()) ? val : parsed;
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
  });

  readonly CREATE: ZodType = z.object({
    code: z.string(),
    account_cash_id: z.string().uuid({ message: 'Account Cash must be filled' }),
    store_id: z.string().uuid(),
    total: z.number(),
    trans_type_id: z.number().int(),
    description: z.string(),
    created_by: z.string().uuid(),
    updated_by: z.string().uuid(),
    accounts: z.array(
      z.object({
        account_id: z.string({ message:'Account must be chosen' }).uuid(),
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
    // recurring conf
    startDate:  z.preprocess((val: any) => {
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
      if (val == '') return null; // If empty string, treat as null
    
      const parsed = new Date(val);
      return isNaN(parsed.getTime()) ? val : parsed;
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

  });
}
