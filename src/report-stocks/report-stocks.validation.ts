import { Injectable } from '@nestjs/common';
import { ZodType, z } from 'zod';

@Injectable()
export class ReportStockValidation {
  constructor(
  ) { }

  readonly CREATE: ZodType = z.object({
    company_id: z.string().uuid(),
    store_id: z.string().uuid(),
    start_date: z.string(),
    end_date: z.string(),
  });

  readonly FILTER: ZodType = z.object({
    store_id: z.string().uuid().optional(),
    company_id: z.string().uuid().optional(),
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
}
