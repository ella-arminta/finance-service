import { ZodType, z } from 'zod';

export class AccountValidation {
    static readonly CREATE: ZodType = z.object({
        branch_id: z.number().optional(), // Validates the foreign key
        code: z.number().int().min(1),
        deactive: z.boolean(),
        name: z.string().min(1).max(255),
        type: z.union([z.literal(-1), z.literal(1)]), // Use z.union for numeric literals
    });      
}
