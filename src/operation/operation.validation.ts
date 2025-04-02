import { ZodType, z } from 'zod';
import { DatabaseService } from 'src/database/database.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OperationValidation {
    constructor(){}
    
    readonly CREATE: ZodType = z.object({
        id: z.string().uuid(),
        name: z.string().min(3).max(255),
        code: z.string().max(15),
        price: z.union([z.string(), z.number()])
            .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
            .refine((val) => !isNaN(val), { message: "Invalid total_price" }),
        uom: z.string().max(15),
        store_id: z.string().uuid(),
        account_id: z.string().uuid().optional().nullable(),
    });      

    readonly UPDATE: ZodType = z.object({
        code: z.string().max(15).optional(),
        name: z.string().min(3).max(255).optional(),
        price: z.union([z.string(), z.number()])
        .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
        .refine((val) => !isNaN(val), { message: "Invalid total_price" }),
        uom: z.string().max(15).optional(),
        account_id: z.string().uuid().optional().nullable(),
    });
    
}
