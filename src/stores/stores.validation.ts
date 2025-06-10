import { ZodType, z } from 'zod';
import { DatabaseService } from 'src/database/database.service';
import { StoresService } from './stores.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StoreValidation {
    constructor(
        private readonly storeService: StoresService,
    ){}

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
        company_id: z.string().uuid(),
        created_at: this.dateSchema,
        updated_at: this.dateSchema,
        deleted_at: this.dateSchema.nullable(),
        code: z.string(),
        inventory_val_method: z.number().int().min(1).max(3).optional(),
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
        created_at: this.dateSchema,
        updated_at: this.dateSchema,
        deleted_at: this.dateSchema.nullable(),
        code: z.string().optional(),
        inventory_val_method: z.number().int().min(1).max(3).optional(),
    });
    
}
