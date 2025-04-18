import { Injectable } from '@nestjs/common';
import { ZodType, z } from 'zod';

@Injectable()
export class PayableReceivableValidation {
  constructor(
  ) {}

  readonly CREATE: ZodType = z.object({
    trans_date: z.preprocess((val) => {
      if (typeof val === 'string' || val instanceof Date) {
        const date = new Date(val);
        return isNaN(date.getTime()) ? undefined : date;
      }
      return undefined;
    }, z.date({
      required_error: "Transaction date is required",
      invalid_type_error: "Transaction date must be a valid date string",
    })),
    report_journal_id: z.string().uuid(),
    created_by: z.string().uuid(),
    detail_description: z.string().optional().nullable(),
    account_id: z.string().uuid({ message: 'Account must be filled' }),
    amount_paid: z.preprocess((val) => {
      if (typeof val === 'string' || typeof val === 'number') {
        const parsed = parseFloat(val as string);
        return isNaN(parsed) ? undefined : parsed;
      }
      return undefined;
    }, z.number({ message: 'Amount must be a number' })),    
  });

  readonly DUEDATE: ZodType = z.object({
    due_date: z.preprocess((val) => {
      if (typeof val === 'string' || val instanceof Date) {
        const date = new Date(val);
        return isNaN(date.getTime()) ? undefined : date;
      }
      return undefined;
    }
    , z.date({
      required_error: "Due date is required",
      invalid_type_error: "Due date must be a valid date string",
    })),
    report_journal_id: z.string().uuid(),
  });

  readonly CREATEREMINDER: ZodType = z.object({
    report_journal_id: z.string().uuid(),
    interval: z.preprocess((val) => {
      if (val === null || val === undefined || val === '') return undefined;
  
      if (typeof val === 'string' || typeof val === 'number') {
        const parsed = parseInt(val as string);
        return isNaN(parsed) ? undefined : parsed;
      }
  
      return undefined;
    }, z.number()
        .min(1, { message: "Interval must be at least 1" })
        .optional()
    ),
    period: z.enum(['day', 'week', 'month', 'year'], {
      required_error: "Period is required",
      invalid_type_error: "Period must be one of the specified values",
    }).optional().nullable(),
    date_remind: z.preprocess((val) => {
      if (val === null || val === undefined || val === '') return null;
    
      if (typeof val === 'string' || val instanceof Date) {
        const date = new Date(val);
        return isNaN(date.getTime()) ? undefined : date;
      }
    
      return undefined;
    },
    z.date({
      required_error: 'Date remind is required',
      invalid_type_error: 'Date remind must be a valid date',
    }).nullable().optional()), // ✅ allow undefined and null
    mode: z.string(),
    emails: z.array(z.string().email(), {
      required_error: "Email is required",
      invalid_type_error: "Email must be a valid email address",
    }),
  })
}