import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { BaseService } from 'src/common/base.service';
import { Report_Journals } from '@prisma/client';
import { TransAccountSettingsService } from 'src/trans-account-settings/trans-account-settings.service';
import { ReportStocksService } from 'src/report-stocks/report-stocks.service';
import puppeteer from 'puppeteer';

@Injectable()
export class ReportService extends BaseService<Report_Journals> {
    constructor(
        db: DatabaseService,
        private readonly tasService: TransAccountSettingsService,
        private readonly rStockService : ReportStocksService
    ) {
        const relations = {
            store: true, 
            trans: true, 
            trans_type: true,
            account: true,
            payable_receivables: {
                include: {
                    reminder_payable_receivables: true,
                    report_journal: true, 
                    payable_receivables_detail: {
                        include: {
                            report_journal: {
                                include: {
                                    account: true
                                }
                            },
                            journal_reverse: true,
                        },
                    }
                },
            }, 
            payable_receivables_detail: true,
            journal_reverse_detail: true,
        }
        super('report_Journals', db, relations);
    }

    async getProfitLoss(userId:string, filters: any = {}) {
        // console.log('this is filters',filters);
        // store: 'edd09595-33d4-4e81-9e88-14b47612bee9',
        // company: 'bb0471e8-ba93-4edc-8dea-4ccac84bd2a2',
        // owner_id: 'd643abb7-2944-4412-8bb5-5475679f5ade',
        // start_date: 2025-02-28T00:00:00.000Z,
        // end_date: 2025-03-30T00:00:00.000Z
        var result = [];

        // REVENUE !!!
        var revenue = {
            'label' : 'Pendapatan',
            'data' : []
        };
        // GET SALES EMAS
        const salesAccountIDs = await this.tasService.getAllAccountIdByAction('goldSales', filters.owner_id ,filters.store, filters.company_id);
        const totalSales =  Math.abs(await this.sumAmountByAccounts(salesAccountIDs, filters.start_date, filters.end_date));
        revenue.data.push({
            'name': 'Penjualan Kotor Emas',
            'amount': totalSales
        });
        // GET OPERATION SERVICE
        const operationAccountIDS = await this.tasService.getAllOperationAccount(filters.owner_id, filters.store, filters.company_id);
        const totalOperations = Math.abs(await this.sumAmountByAccounts(operationAccountIDS, filters.start_date, filters.end_date));
        revenue.data.push({
            'name': 'Penjualan Kotor Jasa',
            'amount': totalOperations
        });
        // DISKON PENJUALAN
        const discountAccountIDS = await this.tasService.getAllAccountIdByAction('discountSales', filters.owner_id, filters.store, filters.company_id);
        const totalDiscount = Math.abs( await this.sumAmountByAccounts(discountAccountIDS, filters.start_date, filters.end_date)) * -1;
        revenue.data.push({
            'name': 'Diskon Penjualan',
            'amount': totalDiscount
        });
        // TOTAL REVENUE
        revenue.data.push({
            'name': 'Penjualan bersih',
            'amount': totalSales + totalOperations + totalDiscount
        });
        result.push(revenue);        

        // COST OF GOODS SOLD !!!
        const hpp = await this.rStockService.getHPP(filters.start_date, filters.end_date,filters.owner_id, filters.store, filters.company_id);
        var costOfGoodsSold = {
            'label' : 'Harga Pokok Penjualan',
            'data' : hpp
        };
        result.push(costOfGoodsSold);

        // GROSS PROFIT !!!
        const grossProfit = revenue.data[revenue.data.length - 1].amount + costOfGoodsSold.data[costOfGoodsSold.data.length - 1].amount;
        result.push({
            'label' : 'Laba Kotor',
            'data' : [
                {
                    'name': 'Laba Kotor',
                    'amount': grossProfit
                }
            ]
        })
        
        // OPERATING EXPENSES !!!
        var operatingExpenses = {
            'label' : 'Beban Operasional',
            'data' : []
        };
        const expensesAccounts= await this.db.accounts.findMany({
            where: {
                account_type_id: 2,
                store_id: filters.store ?? undefined,
                company_id: filters.company_id ?? undefined,
                company: {
                    owner_id: filters.owner_id
                },
                deleted_at: null
            },
            select : {
                id: true,
                name: true
            }
        });
        const expensesAccountIDS = expensesAccounts.map((account) => account.id);
        if (expensesAccountIDS.length > 0) {
            for (const account of expensesAccounts) {
                const expense = Math.abs(await this.sumAmountByAccounts([account.id], filters.start_date, filters.end_date)) * -1;
                operatingExpenses.data.push({
                    'name': account.name,
                    'amount': expense
                });
            }
            
            // Setelah semua async selesai, baru push total beban
            operatingExpenses.data.push({
                'name': 'Total Beban Operasional',
                'amount': operatingExpenses.data.reduce((acc, curr) => acc + curr.amount, 0)
            });
        } else {
            operatingExpenses.data.push({
                'name': 'Total Beban Operasional',
                'amount': 0
            });
        }
        result.push(operatingExpenses);

        // OPERATING PROFIT
        const operatingProfit = grossProfit + operatingExpenses.data[operatingExpenses.data.length - 1].amount;
        result.push({
            'label' : 'Laba Operasional',
            'data' : [
                {
                    'name': 'Laba Operasional',
                    'amount': operatingProfit
                }
            ]
        });

        // Non operating income and expenses
        var nonOperatingIncomeExpenses = {
            'label' : 'Pendapatan dan Beban Lain-lain',
            'data' : []
        };
        const nonOperatingAccounts = await this.db.accounts.findMany({
            where: {
                account_type_id: {
                    in: [7, 8]
                },
                store_id: filters.store ?? undefined,
                company_id: filters.company_id ?? undefined,
                company: {
                    owner_id: filters.owner_id
                },
                deleted_at: null
            },
            select : {
                id: true,
                name: true
            }
        });
        
        for (const account of nonOperatingAccounts) {
            const nonOperating = await this.sumAmountByAccounts([account.id], filters.start_date, filters.end_date) * -1;
            nonOperatingIncomeExpenses.data.push({
                'name': account.name,
                'amount': nonOperating
            });
        }

        if (nonOperatingIncomeExpenses.data.length > 0) {
            nonOperatingIncomeExpenses.data.push({
                'name': 'Total Pendapatan dan Beban Lain-lain',
                'amount': nonOperatingIncomeExpenses.data.reduce((acc, curr) => acc + curr.amount, 0)
            });
        } else {
            nonOperatingIncomeExpenses.data.push({
                'name': 'Total Pendapatan dan Beban Lain-lain',
                'amount': 0
            });
        }
        result.push(nonOperatingIncomeExpenses);

        // Net Profit
        const netProfit = operatingProfit + nonOperatingIncomeExpenses.data[nonOperatingIncomeExpenses.data.length - 1].amount;
        result.push({
            'label' : 'Laba Bersih',
            'data' : [
                {
                    'name': 'Laba Bersih',
                    'amount': netProfit
                }
            ]
        });

        return result;
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

    private async sumAmountByAccounts(account_id: string[], start_date: Date, end_date: Date) {
        const total = await this.db.report_Journals.aggregate({
            _sum: {
                amount: true
            },
            where: {
                account_id: {
                    in: account_id
                },
                trans_date: {
                    gte: start_date,
                    lte: end_date
                }
            }
        });
        return total._sum.amount != null ? total._sum.amount.toNumber() : 0;
    }

    async generatePDF(userId: string, labelRangeSelected: any, filters: any): Promise<Buffer> {
        const profitLossData = await this.getProfitLoss(userId, filters);

        const company = await this.db.companies.findFirst({
            where: { id: filters.company_id },
            select: { name: true }
        });
        const store = await this.db.stores.findFirst({
            where: { id: filters.store },
            select: { name: true }
        });

        const storeName = filters.store ? store.name : 'All Stores';
        const companyName = filters.company_id ? company.name : 'All Companies';
        const storeCompanyName = companyName + ' | ' + storeName;

        const htmlContent = `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8" />
            <style>
                .profit-loss-title {
                    text-align: center;
                    font-size: 18px;
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
                    font-size: 16px;
                }
                .item-row {
                    border-bottom: 1px solid #e5e7eb;
                }
                .sub-item {
                    padding-left: 1.5rem;
                }
                .bold-text {
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <h1 class="profit-loss-title">Profit & Loss Statement</h1>
            <h1 class="profit-loss-title">${storeCompanyName}</h1>
            <h1 class="profit-loss-title">${labelRangeSelected}</h1>
            <div class="spacer"></div>
            <table class="profit-loss-table">
                <thead>
                    <tr>
                        <th class="name-column"></th>
                        <th class="debit-column"></th>
                        <th class="credit-column"></th>
                    </tr>
                </thead>
                <tbody>
                ${profitLossData.map(category => `
                    ${category.data.length > 1 ? `
                        <tr class="item-row">
                            <td class="bold-text">${category.label}</td>
                            <td></td>
                            <td></td>
                        </tr>` : ''
                    }
                    ${category.data.map((item, idx) => {
                        const isLast = idx === category.data.length - 1;
                        const isSubItem = category.data.length > 1 && !isLast;
                        const nameClass = isSubItem ? 'sub-item' : 'bold-text';
                        const amount = this.formatAmount(item.amount);
                        return `
                            <tr class="item-row">
                                <td class="${nameClass}">${item.name}</td>
                                <td class="${item.amount < 0 && !isSubItem ? 'bold-text' : ''}">
                                    ${item.amount < 0 ? amount : ''}
                                </td>
                                <td class="${item.amount >= 0 && !isSubItem ? 'bold-text' : ''}">
                                    ${item.amount >= 0 ? amount : ''}
                                </td>
                            </tr>`;
                    }).join('')}
                `).join('')}
                </tbody>
            </table>
        </body>
        </html>`;

        // const browser = await puppeteer.launch({
        //     headless: true,
        //     args: ['--no-sandbox', '--disable-setuid-sandbox'],
        // });
        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser', // or '/usr/bin/chromium'
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            protocolTimeout: 60000 // Optional: increase timeout
        });


        try {
            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({
                format: 'A4',
                margin: {
                    top: '10mm',
                    bottom: '10mm',
                    left: '10mm',
                    right: '10mm',
                },
                printBackground: true
            });
            await browser.close();
            return Buffer.from(pdfBuffer);
        } catch (err) {
            await browser.close();
            throw err;
        }
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
        const params: any[] = [];
        const conditions: string[] = [];
        let subQueryCondition = '';
    
        // Add dateStart for subquery only if it's provided
        if (data.dateStart) {
            params.push(data.dateStart); // $1 for subquery
            subQueryCondition = 'AND rj2.trans_date < $1::date';
        }
    
        // Track index offset depending on whether dateStart was added for subquery
        let offset = params.length;
    
        // Main query filters
        if (data.dateStart) {
            params.push(data.dateStart); // $offset + 1
            conditions.push(`rj.trans_date >= $${params.length}::date`);
        }
    
        if (data.dateEnd) {
            params.push(data.dateEnd);
            conditions.push(`rj.trans_date <= $${params.length}::date`);
        }
    
        if (data.company_id) {
            params.push(data.company_id.replace(/^"|"$/g, ''));
            conditions.push(`s.company_id = $${params.length}::uuid`);
        }
    
        if (data.store_id) {
            params.push(data.store_id);
            conditions.push(`rj.store_id = $${params.length}::uuid`);
        }
    
        if (data.owner_id) {
            params.push(data.owner_id);
            conditions.push(`c.owner_id = $${params.length}::uuid`);
        }
    
        // Build the query string
        let query = `
            SELECT 
            a.code,
            rj.account_id AS id,
            a.name,
            COALESCE((
                SELECT 
                CASE WHEN at.type = 1 THEN SUM(rj2.amount) ELSE 0 END
                FROM "Report_Journals" rj2
                JOIN "Accounts" a2 ON rj2.account_id = a2.id
                JOIN "Account_Types" at ON a2.account_type_id = at.id
                WHERE rj2.account_id = rj.account_id
                ${subQueryCondition}
                GROUP BY at.type
            ), 0) AS "startBalance",
            SUM(CASE WHEN rj.amount >= 0 THEN rj.amount ELSE 0 END) AS debit,
            SUM(CASE WHEN rj.amount < 0 THEN -rj.amount ELSE 0 END) AS credit,
            SUM(rj.amount) AS balance
            FROM "Report_Journals" rj
            JOIN "Accounts" a ON rj.account_id = a.id
            JOIN "Stores" s ON rj.store_id = s.id
            JOIN "Companies" c ON s.company_id = c.id
        `;
    
        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(' AND ');
        }
    
        query += ` GROUP BY rj.account_id, a.name, a.code`;
    
        // Debug log
        console.log('Final query:', query);
        console.log('Params:', params);
    
        // Execute the query
        const result = await this.db.$queryRawUnsafe(query, ...params);
        return result;
    }         

    async getLedger(data: any) {
        const params: any[] = [];
        const conditions: string[] = [];
        
        // Tambahkan data.dateStart ke params sebelum query
        if (data.dateStart) {
            params.push(data.dateStart);  // Pastikan params sudah berisi dateStart
            conditions.push(`rj.trans_date >= $${params.length}`);
        }
    
        if (data.dateEnd) {
            conditions.push(`rj.trans_date <= $${params.length + 1}`);
            params.push(data.dateEnd);
        }
    
        if (data.company_id) {
            const companyId = data.company_id.replace(/^"|"$/g, '');
            conditions.push(`s.company_id = $${params.length + 1}::uuid`);
            params.push(companyId);
        }
    
        if (data.store_id) {
            conditions.push(`rj.store_id = $${params.length + 1}::uuid`);
            params.push(data.store_id);
        }
    
        if (data.account_id && Array.isArray(data.account_id)) {
            const ids = data.account_id.map((_, i) => `$${params.length + i + 1}::uuid`);
            conditions.push(`rj.account_id IN (${ids.join(', ')})`);
            params.push(...data.account_id);
        } else if (data.account_id) {
            conditions.push(`rj.account_id = $${params.length + 1}::uuid`);
            params.push(data.account_id);
        }
    
        conditions.push(`c.owner_id = $${params.length + 1}::uuid`);
        params.push(data.owner_id);
    
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        
        let saldoAwalQuery = '';
        // Query saldo awal per akun only if account_id is present
        if (data.account_id) {
            saldoAwalQuery = `
                WITH saldo_awal_data AS (
                    SELECT 
                        a.code AS infoacc,
                        a.name AS account_name,
                        $${params.length + 1}::date - INTERVAL '1 day' AS date,
                        NULL AS code,
                        'Saldo Awal' AS description,
                        0 AS debit,
                        0 AS credit,
                        CASE WHEN at.type = 1 then SUM(rj.amount) else 0 end AS balance
                    FROM "Report_Journals" rj
                    JOIN "Accounts" a ON rj.account_id = a.id
                    JOIN "Stores" s ON rj.store_id = s.id
                    JOIN "Companies" c ON s.company_id = c.id
                    JOIN "Account_Types" at ON a.account_type_id = at.id
                    WHERE rj.trans_date < $${params.length + 1}
                        ${data.company_id ? `AND s.company_id = $${params.indexOf(data.company_id) + 1}::uuid` : ''}
                        ${data.store_id ? `AND rj.store_id = $${params.indexOf(data.store_id) + 1}::uuid` : ''}
                        ${data.account_id ? (Array.isArray(data.account_id)
                            ? `AND rj.account_id IN (${data.account_id.map((_, i) => `$${params.indexOf(data.account_id[0]) + i + 1}`).join(', ')})`
                            : `AND rj.account_id = $${params.indexOf(data.account_id) + 1}::uuid`) : ''}
                        AND c.owner_id = $${params.indexOf(data.owner_id) + 1}::uuid
                    GROUP BY a.code, a.name, at.type
                )
                SELECT 
                    infoacc,
                    account_name,
                    date,
                    code,
                    description,
                    debit,
                    credit,
                    COALESCE(balance, 0) AS balance
                FROM saldo_awal_data
                UNION ALL
                SELECT 
                    NULL AS infoacc,
                    'Saldo Awal' AS account_name,
                    $${params.length + 1}::date - INTERVAL '1 day' AS date,
                    NULL AS code,
                    'Saldo Awal' AS description,
                    0 AS debit,
                    0 AS credit,
                    0 AS balance
                WHERE NOT EXISTS (SELECT 1 FROM saldo_awal_data)
            `;
            params.push(data.dateStart);  // Pindahkan ke sini setelah `saldoAwalQuery`
        }
    
        // Query transaksi berjalan
        const transaksiQuery = `
            SELECT 
                a.code AS infoacc,
                a.name AS account_name,
                rj.trans_date AS date,
                rj.code AS code,
                rj.detail_description AS description,
                CASE WHEN rj.amount >= 0 THEN rj.amount ELSE 0 END AS debit, 
                CASE WHEN rj.amount < 0 THEN ABS(rj.amount) ELSE 0 END AS credit,
                SUM(rj.amount) OVER (
                    PARTITION BY rj.account_id 
                    ORDER BY rj.trans_date, rj.code
                ) + COALESCE((
                    SELECT SUM(amount)
                    FROM "Report_Journals"
                    WHERE account_id = rj.account_id
                      AND trans_date < $${params.length + 1}
                ), 0) AS balance
            FROM "Report_Journals" rj 
            JOIN "Accounts" a ON rj.account_id = a.id 
            JOIN "Stores" s ON rj.store_id = s.id
            JOIN "Companies" c ON s.company_id = c.id
            ${whereClause}
        `;
        
        params.push(data.dateStart);  // Jangan lupa tambahkan params untuk transaksiQuery
    
        const finalQuery = `
            ${saldoAwalQuery ? `(${saldoAwalQuery}) UNION ALL` : ''}
            (${transaksiQuery})
            ORDER BY date, infoacc, code
        `;
        
        return await this.db.$queryRawUnsafe(finalQuery, ...params);
    }
    

    async getSalesCards(filters:any) {
        var result = {
            'count': 0,
            'amount': 0,
        }
        const accountSettingData = await this.db.trans_Account_Settings.findMany({
            where: {
                action: 'goldSales',
                store_id: filters.auth.store_id,
            },
        });
        if (accountSettingData.length <= 0) {
            return result;
        }
        const accountID = accountSettingData.map((item) => item.account_id)[0];

      
        result.count = await this.db.report_Journals.count({
            where: {
                trans_date: {
                    gte: filters.start_date,
                    lte: filters.end_date,
                },
                account_id: accountID,
            },
        });

        const amountData = await this.db.report_Journals.aggregate({
            _sum: {
              amount: true,
            },
            where: {
              trans_date: {
                gte: new Date(filters.start_date),
                lte: new Date(filters.end_date),
              },
              account_id: accountID,
            },
        });
        result.amount = amountData._sum.amount != null ? Math.abs(amountData._sum.amount.toNumber()) : 0;
        
        return result;
    } 
    
    async getSalesChart(filters: any) {
        const accountSettingData = await this.db.trans_Account_Settings.findMany({
            where: {
                action: 'goldSales',
                store_id: filters.auth.store_id,
            },
        });
    
        if (accountSettingData.length <= 0) {
            return [];
        }
    
        const accountID = accountSettingData[0].account_id;
        const journalData = await this.db.report_Journals.findMany({
            where: {
                trans_date: {
                    gte: filters.start_date ? new Date(filters.start_date) : undefined,
                    lte: filters.end_date ? new Date(filters.end_date) : undefined,
                },
                account_id: accountID,
            },
            select: {
                trans_date: true,
                amount: true,
            },
            orderBy: {
                trans_date: 'asc',
            },
        });
    
        // Rename trans_date to created_at
        return journalData.map((item) => ({
            created_at: item.trans_date,
            sellPrice: Math.abs(item.amount.toNumber()),
        }));
    }
}
