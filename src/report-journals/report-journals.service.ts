import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import * as pdf from 'html-pdf';
import { BaseService } from 'src/common/base.service';
import { Report_Journals } from '@prisma/client';

@Injectable()
export class ReportService extends BaseService<Report_Journals> {
    constructor(
        db: DatabaseService,
    ) {
        const relations = {
        }
        super('report_Journals', db, relations);
    }

    async getProfitLoss(userId:string, filters: any = {}) {
        return [
            {
                'label' : 'Revenue',
                'data' : [
                    {
                        'name': 'Sales',
                        'amount': 1000
                    },
                    {
                        'name': 'Service',
                        'amount': 2000
                    },
                    {
                        'name' : 'Total Revenue',
                        'amount' : 3000
                    }
                ]
            },
            {
                'label' : 'Cost of Goods Sold',
                'data' : [
                    {
                        'name': 'Productions Costs',
                        'amount': -3000
                    }, 
                    {
                        'name': 'Gross Profit',
                        'amount': 6000
                    }
                ]
            },
            {
                'label' : 'Operating Expenses',
                'data': [
                    {
                        'name': 'Salaries',
                        'amount': -1000
                    },
                    {
                        'name': 'Rent',
                        'amount': -500
                    },
                    {
                        'name': 'Utilities',
                        'amount': -200
                    },
                    {
                        'name': 'Total Operating Expenses',
                        'amount': -1700
                    }
                ]
            },
            {
                'label' : 'Operating Profit',
                'data': [
                    {
                        'name': 'Operating Profit',
                        'amount': 4300
                    }
                ]
            },
            {
                'label' : 'Non-Operating Income & Expenses',
                'data': [
                    {
                        'name': 'Interest Income',
                        'amount': 100
                    },
                    {
                        'name': 'Interest Expense',
                        'amount': -200
                    },
                    {
                        'name': 'Net Non-Operating Income',
                        'amount': -100
                    }
                ]
            },
            {
                'label' : 'Net Profit',
                'data': [
                    {
                        'name': 'Net Profit',
                        'amount': 4200
                    }
                ]
            }
        ]
    }

    async generatePDF(userId: string, data: any, filters: any): Promise<Buffer> {
        var profitLossData = await this.getProfitLoss(userId, filters);
    
        var htmlContent = `
            <html>
                <head>
                    <style>
                        .profit-loss-title {
                            text-align: center;
                            font-size:2rem; /* Equivalent to text-lg */
                            font-weight: bold;
                        }
                        .spacer {
                            display: block;
                            height: 10px;
                        }
                        .profit-loss-table {
                            width: 100%;
                            border-collapse: collapse;
                        }
                        .name-column {
                            width: 40%;
                        }
                        .debit-column, 
                        .credit-column {
                            width: 30%;
                        }
                        .profit-loss-table thead {
                            visibility: collapse;
                        }
                        .profit-loss-table tbody td:nth-child(2), 
                        .profit-loss-table tbody td:nth-child(3) {
                            text-align: right;
                        }
                        .profit-loss-table tbody tr:last-child td {
                            border-bottom: 1px solid #000;
                        }
                        .profit-loss-table td {
                            padding-top: 0.8rem;
                            padding-bottom: 0.3rem;
                        }
                        .item-row {
                            border-bottom: 1px solid #e5e7eb; /* Equivalent to border-gray-200 */
                        }
                        .sub-item {
                            padding-left: 1.5rem; /* Equivalent to md:pl-6 */
                        }
                        .bold-text {
                            font-weight: bold;
                        }

                        td {
                            font-size: 1.5rem;
                        }
                    </style>
                </head>
                <body>
                    <h1 class="profit-loss-title">Profit & Loss Statement</h1>
                    <h1 class="profit-loss-title">${data.labelRangeSelected}</h1>
    
                    <span class="spacer"></span>
    
                    <table class="profit-loss-table" id="profit-loss-table">
                        <thead>
                            <tr>
                                <th class="name-column">Name</th>
                                <th class="debit-column">Debit</th>
                                <th class="credit-column">Credit</th>
                            </tr>
                        </thead>
                        <tbody>`;
    
        // Loop through categories
        for (const category of profitLossData) {
            if (category.data.length > 1) {
                htmlContent += `
                    <tr class="category-row">
                        <td>${category.label}</td>
                        <td></td>
                        <td></td>
                    </tr>`;
            }
    
            // Loop through subcategories
            category.data.forEach((item: any, subIndex: number) => {
                const isLastItem = subIndex === category.data.length - 1;
                htmlContent += `
                    <tr class="item-row">
                        <td class="${!isLastItem ? 'sub-item' : 'bold-text'}">${item.name}</td>
                        <td class="${isLastItem ? 'bold-text' : ''}">
                            ${item.amount < 0 && !isLastItem ? this.formatAmount(item.amount) : ''}
                        </td>
                        <td class="${isLastItem ? 'bold-text' : ''}">
                            ${item.amount >= 0 || isLastItem ? this.formatAmount(item.amount) : ''}
                        </td>
                    </tr>`;
            });
        }
    
        htmlContent += `</tbody>   
                    </table>
                </body>
            </html>
        `;

        // Define PDF options
        const pdfOptions = {
            format: "A4",  // Set page size (options: "A3", "A4", "A5", "Letter", etc.)
            border: {
                top: "10mm",
                right: "10mm",
                bottom: "10mm",
                left: "10mm"
            }
        };

        return new Promise((resolve, reject) => {
            pdf.create(htmlContent, pdfOptions).toBuffer((err, buffer) => {
                if (err) return reject(err);
                resolve(buffer);
            });
        });
    }
    
    private formatAmount(amount) {
        // amount is type integer
        var positive = amount >= 0;
        amount = Math.abs(amount);
        var amountFormated  =  amount.toLocaleString('id-ID', {
            style: 'currency',
            currency: 'IDR',
        });
        // remove the "Rp" prefix
        amountFormated = amountFormated.substring(2);
        if (positive) {
            return amountFormated;
        } else {
            return '(' + amountFormated + ' )';
        }
    };

    // Ledger 
    async getTrialBalance(data: any) {
        let query = `
        SELECT 
            a.code,
            rj.account_id as id, 
            a.name, 
            SUM(CASE WHEN rj.amount >= 0 THEN rj.amount ELSE 0 END) AS debit, 
            SUM(CASE WHEN rj.amount < 0 THEN rj.amount ELSE 0 END) AS credit, 
            SUM(rj.amount) AS balance
        FROM "Report_Journals" rj  
        JOIN "Accounts" a ON rj.account_id = a.id  
        JOIN "Stores" s ON rj.store_id = s.id
        JOIN "Companies" c ON s.company_id = c.id
        `;
    
        // Build the WHERE clause conditions and parameters
        const conditions: string[] = [];
        const params: any[] = [];
    
        if (data.dateStart) {
            conditions.push(`rj.trans_date > $${params.length + 1}`);
            params.push(data.dateStart);
        }
    
        if (data.dateEnd) {
            conditions.push(`rj.trans_date <= $${params.length + 1}`);
            params.push(data.dateEnd);
        }
    
        if (data.company_id) {
            const companyId = data.company_id.replace(/^"|"$/g, ''); // Removes leading/trailing double quotes
            conditions.push(`s.company_id = $${params.length + 1}::uuid`);
            params.push(companyId);
        }        
    
        if (data.store_id) {
            conditions.push(`rj.store_id = $${params.length + 1}::uuid`);
            params.push(data.store_id);
        }

        // Store with owner_id tersebut
        conditions.push(`c.owner_id = $${params.length + 1}::uuid`);
        params.push(data.owner_id);
    
        // Append the WHERE clause if there are any conditions
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
    
        // Append GROUP BY
        query += ' GROUP BY rj.account_id, a.name, a.code';
    
        // console.log("Final Query:", query);
        // console.log("Parameters:", params);

        const result = await this.db.$queryRawUnsafe(query, ...params);
    
        return result;
    }
    async getLedger(data:any) {
        let query = `
          SELECT 
            a.code as infoacc,
            a.name as account_name,
            rj.trans_date  as date,
            rj.code as code,
            rj.detail_description as description,
            CASE WHEN rj.amount >= 0 THEN rj.amount ELSE 0 END AS debit, 
            CASE WHEN rj.amount < 0 THEN rj.amount ELSE 0 END AS credit, 
            rj.amount AS balance
        from "Report_Journals" rj 
        join "Accounts" a on rj.account_id  = a.id 
        join "Stores" s on rj.store_id = s.id
        join "Companies" c on s.company_id = c.id
        `;

        // Build the WHERE clause conditions and parameters
        const conditions: string[] = [];
        const params: any[] = [];
    
        if (data.dateStart) {
            conditions.push(`rj.trans_date > $${params.length + 1}`);
            params.push(data.dateStart);
        }
    
        if (data.dateEnd) {
            conditions.push(`rj.trans_date <= $${params.length + 1}`);
            params.push(data.dateEnd);
        }
    
        if (data.company_id) {
            const companyId = data.company_id.replace(/^"|"$/g, ''); // Removes leading/trailing double quotes
            conditions.push(`s.company_id = $${params.length + 1}::uuid`);
            params.push(companyId);
        }        
    
        if (data.store_id) {
            conditions.push(`rj.store_id = $${params.length + 1}::uuid`);
            params.push(data.store_id);
        }

        if (data.account_id) {
            conditions.push(`rj.account_id = $${params.length + 1}::uuid`);
            params.push(data.account_id);
        }
        
        // Store with owner_id tersebut
        conditions.push(`c.owner_id = $${params.length + 1}::uuid`);
        params.push(data.owner_id);
    
        // Append the WHERE clause if there are any conditions
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }


        // console.log("Final Query:", query);
        // console.log("Parameters:", params);

        const result = await this.db.$queryRawUnsafe(query, ...params);
    
        return result;
    }
      
}
