import { Injectable } from '@nestjs/common';
import { ZodType, z } from 'zod';
import { CompaniesService } from './companies.service';

@Injectable()
export class CompanyValidation {
  constructor(private readonly companiesService: CompaniesService) {}

  readonly dateSchema = z.preprocess((val) => {
    if (typeof val === "string") {
      const parsedDate = new Date(val);
      return isNaN(parsedDate.getTime()) ? val : parsedDate;
    }
    return val;
  }, z.date());

  readonly CREATE: ZodType = z.object({
    id: z.string().uuid(),
    name: z.string().min(3).max(255),
    owner_id: z.string().uuid(),
    created_at: this.dateSchema,  // Auto-convert string to Date
    updated_at: this.dateSchema,  // Auto-convert string to Date
    deleted_at: this.dateSchema.nullable(), // Allow null
    code: z.string().min(0).max(255),
  });

  readonly UPDATE: ZodType = z.object({
    id: z.string().uuid().refine(async (id) => {
      const company = await this.companiesService.findOne(id);
      return !!company;
    }, {
      message: 'Company ID does not exist',
    }),
    name: z.string().min(2).optional(),
    owner_id: z.string().uuid().optional(),
    created_at: this.dateSchema.optional(),
    updated_at: this.dateSchema.optional(),
    deleted_at: this.dateSchema.nullable().optional(),
    code: z.string().min(0).max(255).optional(),
  });
}