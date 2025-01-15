import { ZodType, z } from 'zod';
import { DatabaseService } from 'src/database/database.service';
import { StoresService } from './stores.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StoreValidation {
    constructor(
        private readonly storeService: StoresService,
    ){}
    
    readonly CREATE: ZodType = z.object({
        id: z.string().uuid(),
        name: z.string().min(3).max(255),
        company_id: z.string().uuid(),
        created_at: z.date(),
        updated_at: z.date(),
        deleted_at: z.date().nullable(),
        code: z.string(),
    });      

    readonly UPDATE: ZodType = z.object({
        id: z.string().uuid().refine(async (id) => {
            const store = await this.storeService.findOne(id);
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
