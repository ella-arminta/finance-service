import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/base.service';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class JournalsService{
    constructor(
        private readonly db: DatabaseService // Tambahkan 'private readonly'
    ) {}

    async getJournals(filters: any): Promise<any> {
        let conditions: string[] = [];
        let params: any[] = [];
    
        if (filters.dateStart) {
            params.push(filters.dateStart);
            conditions.push(`rj.trans_date >= $${params.length}`);
        }
        if (filters.dateEnd) {
            params.push(filters.dateEnd);
            conditions.push(`rj.trans_date <= $${params.length}`);
        }
        if (filters.store_id) {
            params.push(filters.store_id);
            conditions.push(`rj.store_id = $${params.length}::uuid`);
        }
        if (filters.company_id) {
            params.push(filters.company_id);
            conditions.push(`s.company_id = $${params.length}::uuid`);
        }
        if (filters.owner_id) {
            params.push(filters.owner_id);
            conditions.push(`c.owner_id = $${params.length}::uuid`);
        }
    
        let whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    
        const appendConditions = (baseWhere: string) => {
            return conditions.length > 0 ? `${baseWhere ? baseWhere + " AND " : "WHERE "} ${conditions.join(" AND ")}` : baseWhere;
        };
    
        let query = `
            SELECT 
                1 as id,
                'Jurnal Umum' AS name,
                SUM(CASE WHEN rj.amount > 0 THEN rj.amount ELSE 0 END) AS debit,
                SUM(CASE WHEN rj.amount < 0 THEN rj.amount ELSE 0 END) AS credit,
                SUM(rj.amount) AS balance
            FROM "Report_Journals" rj
            JOIN "Stores" s ON rj.store_id = s.id
            JOIN "Companies" c ON s.company_id = c.id
            ${whereClause}
    
            UNION ALL
    
            SELECT 
                2 as id,
                'Penjualan' AS name,
                SUM(CASE WHEN rj.amount > 0 THEN rj.amount ELSE 0 END) AS debit,
                SUM(CASE WHEN rj.amount < 0 THEN rj.amount ELSE 0 END) AS credit,
                SUM(rj.amount) AS balance
            FROM "Report_Journals" rj
            JOIN "Stores" s ON rj.store_id = s.id
            JOIN "Companies" c ON s.company_id = c.id
            ${appendConditions("WHERE rj.trans_type_id IN (3,7)")}
    
            UNION ALL
    
            SELECT 
                3 as id,
                'Pembelian' AS name,
                SUM(CASE WHEN rj.amount > 0 THEN rj.amount ELSE 0 END) AS debit,
                SUM(CASE WHEN rj.amount < 0 THEN rj.amount ELSE 0 END) AS credit,
                SUM(rj.amount) AS balance
            FROM "Report_Journals" rj
            JOIN "Stores" s ON rj.store_id = s.id
            JOIN "Companies" c ON s.company_id = c.id
            ${appendConditions("WHERE rj.trans_type_id IN (4, 5, 8)")}
    
            UNION ALL
    
            SELECT 
                4 as id,
                'Penerimaan Kas' AS name,
                SUM(CASE WHEN rj.amount > 0 THEN rj.amount ELSE 0 END) AS debit,
                SUM(CASE WHEN rj.amount < 0 THEN rj.amount ELSE 0 END) AS credit,
                SUM(rj.amount) AS balance
            FROM "Report_Journals" rj
            JOIN "Stores" s ON rj.store_id = s.id
            JOIN "Companies" c ON s.company_id = c.id
            ${appendConditions("WHERE rj.trans_type_id IN (3, 7, 2)")}
    
            UNION ALL
    
            SELECT 
                5 as id,
                'Pengeluaran' AS name,
                SUM(CASE WHEN rj.amount > 0 THEN rj.amount ELSE 0 END) AS debit,
                SUM(CASE WHEN rj.amount < 0 THEN rj.amount ELSE 0 END) AS credit,
                SUM(rj.amount) AS balance
            FROM "Report_Journals" rj
            JOIN "Stores" s ON rj.store_id = s.id
            JOIN "Companies" c ON s.company_id = c.id
            ${appendConditions("WHERE rj.trans_type_id IN (1)")}`;
    
        const results = await this.db.$queryRawUnsafe(query, ...params);
        return results;
    }

    async getJournalsByID(id: number, filters: any) {
        let conditions: string[] = [];
        let params: any[] = [];
    
        if (filters.dateStart) {
            params.push(filters.dateStart);
            conditions.push(`rj.trans_date >= $${params.length}`);
        }
        if (filters.dateEnd) {
            params.push(filters.dateEnd);
            conditions.push(`rj.trans_date <= $${params.length}`);
        }
        if (filters.store_id) {
            params.push(filters.store_id);
            conditions.push(`rj.store_id = $${params.length}::uuid`);
        }
        if (filters.company_id) {
            params.push(filters.company_id);
            conditions.push(`s.company_id = $${params.length}::uuid`);
        }
        if (filters.owner_id) {
            params.push(filters.owner_id);
            conditions.push(`c.owner_id = $${params.length}::uuid`);
        }
    
        console.log(filters, id);
        // Handle ID-based conditions
        switch (Number(id)) {
            case 2:
                conditions.push(`rj.trans_type_id IN (3,7)`);
                break;
            case 3:
                conditions.push(`rj.trans_type_id IN (4, 5, 8)`);
                break;
            case 4:
                console.log('masuk 4');
                conditions.push(`rj.trans_type_id IN (3, 7, 2)`);
                break;
            case 5:
                conditions.push(`rj.trans_type_id IN (1, 4, 5, 8)`);
                break;
        }
        console.log(conditions);
    
        let whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    
        let query = `
            SELECT
                rj.trans_date as date, 
                rj.code as code,
                a.name as account,
                tt.name as label,
                CASE WHEN rj.amount > 0 THEN rj.amount ELSE 0 END AS debit,
                CASE WHEN rj.amount < 0 THEN rj.amount ELSE 0 END AS credit
            FROM "Report_Journals" rj
            JOIN "Accounts" a ON rj.account_id = a.id
            JOIN "Trans_Type" tt ON rj.trans_type_id = tt.id
            JOIN "Stores" s ON rj.store_id = s.id
            JOIN "Companies" c ON s.company_id = c.id
            ${whereClause};
        `;
    
        return await this.db.$queryRawUnsafe(query, ...params);
    }
    
}
