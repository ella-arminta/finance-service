import { ZodType, z } from 'zod';
import { DatabaseService } from 'src/database/database.service';
import { StoresService } from './stores.service';

export class StoreValidation {
    
    static readonly CREATE: ZodType = z.object({
        id: z.string().uuid(),
        name: z.string().min(3).max(255),
        company_id: z.string().uuid(),
        created_at: z.date(),
        updated_at: z.date(),
        deleted_at: z.date().nullable(),
        code: z.string(),
    });      

    static readonly UPDATE: ZodType = z.object({
        id: z.string().uuid().refine(async (id) => {
            var storeServ = new StoresService(new DatabaseService);
            const store = await storeServ.findOne(id);
            return !!store;
        }, {
          message: 'Store ID does not exist',
        }),
        name: z.string().min(2).optional(),
        company_id: z.string().uuid().optional(),
        created_at: z.date().optional(),
        updated_at: z.date().optional(),
        deleted_at: z.date().nullable().optional(),
        code: z.string().optional(),
    });
    
}
