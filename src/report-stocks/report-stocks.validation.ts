import { Injectable } from '@nestjs/common';
import { ZodType, z } from 'zod';

@Injectable()
export class ReportStockValidation {
  constructor(
  ) { }

  readonly CREATE: ZodType = z.object({
    product: z.object({
      id: z.string().uuid(),
      name: z.string(),
      code: z.string(),
      store: z.object({
        id: z.string().uuid(),
        name: z.string(),
        code: z.string(), // Added `store_code`
        company: z.object({
          id: z.string().uuid(),
          name: z.string(),
          code: z.string(),
        }),
      }),
      type: z.object({
        id: z.string().uuid(),
        name: z.string(),
        code: z.string(),
        category_id: z.string().uuid(),
        category: z.object({
          id: z.string().uuid(),
          name: z.string(),
          code: z.string(),
        }),
      }),
    }),
    id: z.string().uuid(),
    barcode: z.string(),
    weight: z.preprocess(
      (val) => {
        if (typeof val === "string") {
          const num = parseFloat(val);
          return isNaN(num) ? undefined : num; // Convert valid strings to decimal
        } else if (typeof val === "number") {
          return val; // Return if already a number
        }
        return undefined; // Trigger Zod error for invalid types
      },
      z.number() // Ensure the final value is a valid number
    ),
    buy_price: z.preprocess(
      (val) => {
        if (typeof val === "string") {
          const num = parseFloat(val);
          return isNaN(num) ? undefined : num; // Convert valid strings to decimal
        } else if (typeof val === "number") {
          return val; // Return if already a number
        }
        return undefined; // Trigger Zod error for invalid types
      },
      z.number() // Ensure the final value is a valid number
    ),
    created_at: z.preprocess(
      (val) => {
        if (typeof val === "string") {
          const date = new Date(val);
          return isNaN(date.getTime()) ? undefined : date; // Ensure valid Date
        }
        return val;
      },
      z.date().optional()
    ),
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
