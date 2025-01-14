import { ZodType, z } from 'zod';
import { CompaniesService } from './companies.service';
import { DatabaseService } from 'src/database/database.service';

export class CompanyValidation {
    
    static readonly CREATE: ZodType = z.object({
        id: z.string().uuid(),
        name: z.string().min(3).max(255),
        owner_id: z.string().uuid(),
        created_at: z.date(),
        updated_at: z.date(),
        deleted_at: z.date().nullable(),
        code: z.string().min(3).max(255),
    });      

    static readonly UPDATE: ZodType = z.object({
        id: z.string().uuid().refine(async (id) => {
            var compService = new CompaniesService(new DatabaseService);
            const company = await compService.findOne(id);
            return !!company;
        }, {
          message: 'Company ID does not exist',
        }),
        name: z.string().min(2).optional(),
        owner_id: z.string().uuid().optional(),
        created_at: z.date().optional(),
        updated_at: z.date().optional(),
        deleted_at: z.date().nullable().optional(),
        code: z.string().min(3).max(255).optional(),
    });
    
}
