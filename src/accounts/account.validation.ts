import { ZodType, z } from 'zod';
import { AccountsService } from './accounts.service';
import { DatabaseService } from 'src/database/database.service';
import { AccountTypesService } from 'src/account-types/account-types.service';
import { CompaniesService } from 'src/companies/companies.service';
import { StoresService } from 'src/stores/stores.service';

export class AccountValidation {
    private static readonly DatabaseService = new DatabaseService();
    private static readonly accountTypeService = new AccountTypesService(this.DatabaseService);
    private static readonly companyService = new CompaniesService(this.DatabaseService);
    private static readonly storeService = new StoresService(this.DatabaseService);

    static readonly CREATE: ZodType = z.object({
        company_id: z.string().uuid().refine(async (company_id) => {
            var companyService = new CompaniesService(new DatabaseService);
            const company = await companyService.findOne(company_id);
            return !!company;
        }, {
            message: 'Company ID does not exist',
        }),
        code: z.number().int().min(1),
        name: z.string().min(1).max(255).transform((name) => name.toUpperCase()),
        account_type_id: z.number().int().refine(async (account_type_id) => {
            const account_type = await this.accountTypeService.findOne(account_type_id);
            return !!account_type;
        },
        {
            message: 'Account type ID does not exist',
        }),
        store_id: z.string().uuid().optional().nullable(),
        deactive: z.boolean().optional().nullable(),
    });      

    static readonly FILTERS: ZodType = z.object({
        code: z.number().int().optional().nullable(),
        name: z.string().min(1).max(255).optional().nullable(),
        account_type_id: z.number().int().optional().nullable(),
        store_id: z.string().uuid().optional().nullable(),
        company_id: z.string().uuid().optional().nullable(),
        deactive: z.boolean().optional().nullable(),
    });

    static readonly UPDATE: ZodType = z.object({
        name: z.string().min(1).max(255).optional().nullable().transform((name) => name.toUpperCase()),
        account_type_id: z.number().int().optional().nullable().refine(async (account_type_id) => {
            if (!account_type_id) return true;
            const account_type = await this.accountTypeService.findOne(account_type_id);
            return !!account_type;
        },
        {
            message: 'Account type ID does not exist',
        }),
        store_id: z.string().uuid().optional().nullable().refine(async (store_id) => {
            if (!store_id) return true;
            const store = await this.storeService.findOne(store_id);
            return !!store;
        }, {
            message: 'Store ID does not exist',
        }),
        company_id: z.string().uuid().optional().nullable().refine(async (company_id) => {
            if (!company_id) return true;
            const company = await this.companyService.findOne(company_id);
            return !!company;
        }, {
            message: 'Company ID does not exist',
        }),
        deactive: z.boolean().optional().nullable(),
    });
}
