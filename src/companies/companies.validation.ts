import { ZodType, z } from 'zod';
import { CompaniesService } from './companies.service';
import { DatabaseService } from 'src/database/database.service';

export class CompanyValidation {
    
    static readonly CREATE: ZodType = z.object({
        name: z.string().min(2),
    });      

    static readonly UPDATE: ZodType = z.object({
        id: z.number().refine(async (id) => {
            var compService = new CompaniesService(new DatabaseService);
            const company = await compService.findOne(id);
            return !!company;
        }, {
          message: 'Company ID does not exist',
        }),
        name: z.string().min(2),
      });
    
}
