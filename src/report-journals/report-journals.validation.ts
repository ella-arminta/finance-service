import { Injectable } from '@nestjs/common';
import { ZodType, z } from 'zod';

@Injectable()
export class ReportValidation {
  constructor(
  ) { }
  readonly FILTER: ZodType = z.object({
    store: z.string().uuid().optional(),
    company: z.string().uuid().optional(),
    owner_id: z.string().uuid(),
    start_date: z.preprocess((val) => {
        if (typeof val === 'string') {
            const parsed = new Date(val);
            if (!isNaN(parsed.getTime())) {
                return parsed; // Return as Date object
            }
        }
        return val;
    }, z.date().optional()),
    end_date: z.preprocess((val) => {
        if (typeof val === 'string') {
            const parsed = new Date(val);
            if (!isNaN(parsed.getTime())) {
                return parsed; // Return as Date object
            }
        }
        return val;
    }, z.date().optional()),
  });
}
