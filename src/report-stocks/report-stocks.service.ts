import { Injectable } from '@nestjs/common';
import { Prisma, Report_Stocks } from '@prisma/client';
import { BaseService } from 'src/common/base.service';
import { DatabaseService } from 'src/database/database.service';
import { StockSourceService } from './stock-source.service';
import { ReportStockValidation } from './report-stocks.validation';
import { ValidationService } from 'src/common/validation.service';
import { ResponseDto } from 'src/common/response.dto';
import { filter } from 'cheerio/dist/commonjs/api/traversing';
import { TransAccountSettingsService } from 'src/trans-account-settings/trans-account-settings.service';
import { Decimal } from '@prisma/client/runtime/library';
import { connect } from 'http2';

@Injectable()
export class ReportStocksService extends BaseService<Report_Stocks> {
    constructor(
        db: DatabaseService,
        private readonly stockSourceService: StockSourceService,
        private readonly reportStockValidation: ReportStockValidation,
        private readonly validationService: ValidationService,
        private readonly transAccountSettingsServ: TransAccountSettingsService,
    ) {
        const relations = {
        }
        super('report_Stocks', db, relations);
    }

    async getCategoryBalance(category_id: string, addBalQty: number | Decimal, addBalGram: number | Decimal) {
        const lastCategoryBalance = await this.db.report_Stocks.findFirst({
            where: { category_id },
            orderBy: { trans_date: "desc" },
            select: { category_balance_gram: true, category_balance_qty: true },
            take: 1,
        });
    
        // Pastikan semua perhitungan menggunakan Decimal
        const bal_gram = new Decimal(lastCategoryBalance?.category_balance_gram ?? 0).plus(addBalGram);
        const bal_qty = new Decimal(lastCategoryBalance?.category_balance_qty ?? 0).plus(addBalQty);
    
        return {
            category_balance_gram: bal_gram.toNumber(),
            category_balance_qty: bal_qty.toNumber(),
        };
    }    

    async handleSoldStock(data: any) {
        try {
            const source = await this.stockSourceService.findOne(undefined, { code: 'SALES' });
            var stocksReports = [];
            data.transaction_products.forEach(async (prod) => {
                // console.log('Product:', prod, 'type', prod.product_code.product.type);
                // Product: {
                //     total_price: 1200000,
                //     name: 'CHER0010100010006 - Gelang Hello Kitty Biru',
                //     discount: 0,
                //     product_code: {
                //       id: '3650376a-3800-484f-9c7c-2acea4cf7121',
                //       barcode: 'CHER0010100010006',
                //       product_id: '87958f93-183e-44af-bd5c-51ad8baa4391',
                //       weight: '12',
                //       fixed_price: '100000',
                //       status: 1,
                //       created_at: '2025-02-21T15:37:30.161Z',
                //       updated_at: '2025-02-22T10:35:58.125Z',
                //       deleted_at: null,
                //       product: {
                //         id: '87958f93-183e-44af-bd5c-51ad8baa4391',
                //         code: 'CHER001010001',
                //         name: 'Gelang Hello Kitty Biru',
                //         status: 1,
                //         type_id: 'd69d62c7-5a16-4b8d-9aab-081055ea1c34',
                //         store_id: 'e344156f-49d6-4179-87b9-03d22cc18ebf',
                //         created_at: '2025-02-19T08:35:31.390Z',
                //         updated_at: '2025-02-19T08:35:31.390Z',
                //         deleted_at: null,
                //         type: [Object]
                //       }
                //     }
                //   } type {
                //     id: 'd69d62c7-5a16-4b8d-9aab-081055ea1c34',
                //     code: 'CHER00101',
                //     name: 'Hello Kitty',
                //     category_id: 'de069412-d0da-4518-8a6d-e1368d2076d4',
                //     created_at: '2025-02-19T08:33:07.077Z',
                //     updated_at: '2025-02-19T08:33:07.077Z',
                //     deleted_at: null,
                //     category: {
                //       id: 'de069412-d0da-4518-8a6d-e1368d2076d4',
                //       code: 'CHER001',
                //       name: 'Gelang',
                //       company_id: 'e043ef91-9501-4b2e-8a08-3424174eef23',
                //       created_at: '2025-02-19T08:33:06.949Z',
                //       updated_at: '2025-02-19T08:33:06.949Z',
                //       deleted_at: null
                //     }
                //   }
                const tempWeight = Math.abs(parseFloat(prod.product_code.weight)) * -1;
                const tempQty = -1;
                const categoryBalance = await this.getCategoryBalance(
                    prod.product_code.product.type.category.id, 
                    tempQty,
                    tempWeight, 
                );
                const mappedData = {
                    store_id: data.store.id,
                    source_id: source.id,
                    trans_id: data.id,
                    trans_code: data.code,
                    trans_date: new Date(data.created_at),
                    category_id: prod.product_code.product.type.category.id,
                    category_code: prod.product_code.product.type.category.code,
                    category_name: prod.product_code.product.type.category.name,
                    type_id: prod.product_code.product.type.id,
                    type_code: prod.product_code.product.type.code,
                    type_name: prod.product_code.product.type.name,
                    product_id: prod.product_code.product.id,
                    product_name: prod.product_code.product.name,
                    product_code: prod.product_code.product.code,
                    product_code_code: prod.product_code.barcode,
                    product_code_id: prod.product_code.id,
                    weight: tempWeight,
                    total_price: parseFloat(prod.total_price),
                    price: parseFloat(prod.product_code.fixed_price),
                    qty: tempQty,
                    created_at: new Date(data.created_at),
                    category_balance_qty: categoryBalance.category_balance_qty,
                    category_balance_gram: categoryBalance.category_balance_gram,
                }
                stocksReports.push(mappedData);
            });

            const reportStocks = await this.db.report_Stocks.createMany({
                data: stocksReports
            });

            return reportStocks;

        } catch (error) {
            console.log('Error handle stock sold:', error);
            throw new Error(`Error handle stock sold: ${error.message}`);
        }
    }

    async handleBuyStock(data: any) {
        const source = await this.stockSourceService.findOne(undefined, { code: 'INSTOCK' });
        const validData = await this.validationService.validate(this.reportStockValidation.CREATE, data);
        const tempWeight = Math.abs(validData.weight);
        const tempQty = 1;
        const categoryBalance = await this.getCategoryBalance(
            validData.product.type.category_id, 
            tempQty,
            tempWeight, 
        );
        const MappedData = {
            store_id: validData.product.store.id,
            source_id: source.id,
            trans_id: null,
            trans_date: validData.created_at,
            category_id: validData.product.type.category_id,
            category_code: validData.product.type.category.code,
            category_name: validData.product.type.category.name,
            type_id: validData.product.type.id,
            type_code: validData.product.type.code,
            type_name: validData.product.type.name,
            product_id: validData.product.id,
            product_code: validData.product.code,
            product_name: validData.product.name,
            product_code_code: validData.barcode,
            product_code_id: validData.id,
            weight: tempWeight,
            price: validData.buy_price,
            qty: tempQty,
            created_at: new Date(validData.created_at),
            category_balance_qty: categoryBalance.category_balance_qty,
            category_balance_gram: categoryBalance.category_balance_gram,
        }
        const result = await this.create(MappedData);
        return result;
    }

    async getStockCard(filters: any) {
        console.log('filters in getStockCard:', filters);
        // filters in getStockCard: {
        //   auth: {
        //     company_id: 'e043ef91-9501-4b2e-8a08-3424174eef23',
        //     store_id: 'e344156f-49d6-4179-87b9-03d22cc18ebf'
        //   },
        //   dateStart: 2025-02-27T17:00:00.000Z,
        //   dateEnd: 2025-03-30T16:59:59.000Z,
        //   company_id: 'e043ef91-9501-4b2e-8a08-3424174eef23',
        //   store_id: 'e344156f-49d6-4179-87b9-03d22cc18ebf',
        //   category_id: 'de069412-d0da-4518-8a6d-e1368d2076d4',
        //   type_id: 'd69d62c7-5a16-4b8d-9aab-081055ea1c34',
        //   product_id: '87958f93-183e-44af-bd5c-51ad8baa4391',
        //   owner_id: 'd643abb7-2944-4412-8bb5-5475679f5ade'
        // }

        let query = `
            SELECT 
                rs.product_id,
                rs.created_at AS date,
                rs.product_code_code AS code,
                rs.product_name AS name,
                ss.name AS description, 
                CASE 
                    WHEN rs.qty >= 0 THEN rs.qty 
                    ELSE 0 
                END AS "in",
                CASE 
                    WHEN rs.qty < 0 THEN rs.qty
                    ELSE 0 
                END AS "out",
                SUM(rs.qty) OVER (
                    PARTITION BY rs.product_id 
                    ORDER BY rs.product_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                )::NUMERIC AS balance
            FROM "Report_Stocks" rs
            JOIN "Stock_Source" ss ON rs.source_id = ss.id
            JOIN "Stores" st ON rs.store_id = st.id
            JOIN "Companies" com ON st.company_id = com.id
        `;

        // Build the WHERE clause conditions and parameters
        const conditions: string[] = [];
        const params: any[] = [];

        if (filters.dateStart) {
            const dateStart = new Date(filters.dateStart);
            conditions.push(`rs.created_at > $${params.length + 1}`);
            params.push(dateStart);
        }

        if (filters.dateEnd) {
            const dateEnd = new Date(filters.dateEnd);
            conditions.push(`rs.created_at <= $${params.length + 1}`);
            params.push(dateEnd);
        }

        if (filters.company_id) {
            const companyId = filters.company_id.replace(/^"|"$/g, ''); // Removes leading/trailing double quotes
            conditions.push(`st.company_id = $${params.length + 1}::uuid`);
            params.push(companyId);
        }

        if (filters.store_id) {
            conditions.push(`rs.store_id = $${params.length + 1}::uuid`);
            params.push(filters.store_id);
        }

        if (filters.category_id) {
            conditions.push(`rs.category_id = $${params.length + 1}::uuid`);
            params.push(filters.category_id);
        }

        if (filters.type_id) {
            conditions.push(`rs.type_id = $${params.length + 1}::uuid`);
            params.push(filters.type_id);
        }

        if (filters.product_id) {
            conditions.push(`rs.product_id = $${params.length + 1}::uuid`);
            params.push(filters.product_id);
        }

        conditions.push(`com.owner_id = $${params.length + 1}::uuid`);
        params.push(filters.owner_id);

        // Append the WHERE clause if there are any conditions
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        // Order By created_at
        query += ' ORDER BY rs.created_at';

        // console.log("Final Query:", query);
        // console.log("Parameters:", params);

        const result: any = await this.db.$queryRawUnsafe(query, ...params);

        return ResponseDto.success('Stock mutation fetched!', result, 200);
    }

    async getStockMutation(filters: any) {
        const { company_id, dateStart, dateEnd, category_id, store_id } = filters;
        // TODOELLA ganti mutasi stok jadi per Category /lapak. Gak Pake Unit_price, unit_price pindah ke kartu stok
        let query = `
            SELECT 
                rs.product_id, 
                rs.product_code, 
                rs.product_name, 
                rs.category_id,
                rs.category_name,
                s.id AS store_id,
                s.company_id AS company_id,
                c.owner_id,
    
                COALESCE(SUM(CASE WHEN rs.trans_date < $1::timestamp THEN rs.qty ELSE 0 END), 0)::numeric AS initial_stock,
                COALESCE(SUM(CASE WHEN rs.trans_date < $1::timestamp THEN rs.weight ELSE 0 END), 0)::numeric AS initial_stock_gram,
    
                COALESCE(SUM(CASE WHEN rs.source_id = 1 AND rs.trans_date BETWEEN $2::timestamp AND $3::timestamp THEN rs.qty ELSE 0 END), 0)::numeric AS in_goods,
                COALESCE(SUM(CASE WHEN rs.source_id = 1 AND rs.trans_date BETWEEN $2::timestamp AND $3::timestamp THEN rs.weight ELSE 0 END), 0)::numeric AS in_goods_gram,
    
                COALESCE(SUM(CASE WHEN rs.source_id = 3 AND rs.trans_date BETWEEN $2::timestamp AND $3::timestamp THEN rs.qty ELSE 0 END), 0)::numeric AS sales,
                COALESCE(SUM(CASE WHEN rs.source_id = 3 AND rs.trans_date BETWEEN $2::timestamp AND $3::timestamp THEN rs.weight ELSE 0 END), 0)::numeric AS sales_gram,
    
                COALESCE(SUM(CASE WHEN rs.source_id = 2 AND rs.trans_date BETWEEN $2::timestamp AND $3::timestamp THEN rs.qty ELSE 0 END), 0)::numeric AS out_goods,
                COALESCE(SUM(CASE WHEN rs.source_id = 2 AND rs.trans_date BETWEEN $2::timestamp AND $3::timestamp THEN rs.weight ELSE 0 END), 0)::numeric AS out_goods_gram,
    
                COALESCE(SUM(CASE WHEN rs.source_id = 5 AND rs.trans_date BETWEEN $2::timestamp AND $3::timestamp THEN rs.qty ELSE 0 END), 0)::numeric AS purchase,
                COALESCE(SUM(CASE WHEN rs.source_id = 5 AND rs.trans_date BETWEEN $2::timestamp AND $3::timestamp THEN rs.weight ELSE 0 END), 0)::numeric AS purchase_gram,
    
                COALESCE(SUM(CASE WHEN rs.source_id = 4 AND rs.trans_date BETWEEN $2::timestamp AND $3::timestamp THEN rs.qty ELSE 0 END), 0)::numeric AS trade,
                COALESCE(SUM(CASE WHEN rs.source_id = 4 AND rs.trans_date BETWEEN $2::timestamp AND $3::timestamp THEN rs.weight ELSE 0 END), 0)::numeric AS trade_gram,
    
                COALESCE(SUM(CASE WHEN rs.trans_date < $4 THEN rs.qty ELSE 0 END), 0)::numeric AS final,
                COALESCE(SUM(CASE WHEN rs.trans_date < $4 THEN rs.weight ELSE 0 END), 0)::numeric AS final_gram,
    
                COALESCE(
                  SUM(
                    CASE 
                      WHEN (rs.source_id IN (1, 5) OR (rs.source_id = 4 AND rs.qty > 0)) -- in stock, purchase from customer, trade
                        AND rs.trans_date < $4
                      THEN rs.weight * rs.price
                      ELSE 0
                    END
                  ) / NULLIF(
                    SUM(
                      CASE 
                        WHEN (rs.source_id IN (1, 5) OR (rs.source_id = 4 AND rs.qty > 0))
                          AND rs.trans_date < $4
                        THEN rs.weight
                        ELSE 0
                      END
                    ), 0)
                , 0)::numeric AS unit_price
            FROM "Report_Stocks" rs
            JOIN "Stores" s ON s.id = rs.store_id
            JOIN "Companies" c ON s.company_id = c.id
            WHERE rs.trans_date <= $4::timestamp
        `;
    
        const params = [dateStart, dateStart, dateEnd, dateEnd];
        let paramIndex = params.length + 1;

        if (company_id && company_id != '') {
            query += ` AND s.company_id = $${paramIndex}::uuid`;
            params.push(company_id);
            paramIndex++;
        }
    
        if (category_id && category_id != '') {
            query += ` AND rs.category_id = $${paramIndex}::uuid`;
            params.push(category_id);
            paramIndex++;
        }
    
        if (store_id && store_id != '') {
            query += ` AND rs.store_id = $${paramIndex}::uuid`;
            params.push(store_id);
            paramIndex++;
        }

        if (dateEnd) {
            query += ` AND rs.trans_date <= $${paramIndex}::timestamp`;
            params.push(dateEnd);
        }
    
        query += `
            GROUP BY rs.product_id, rs.product_code, rs.product_name, rs.category_id, rs.category_name, s.id, s.company_id, c.owner_id
        `;
    
        const result = await this.db.$queryRawUnsafe(query, ...params);
    
        // Log formatted SQL query
        // const formattedQuery = query.replace(/\$\d+/g, (match) => {
        //     const index = parseInt(match.slice(1)) - 1;
        //     const value = params[index];
    
        //     if (typeof value === 'string') {
        //         return `'${value}'`;
        //     }
        //     if (value instanceof Date) {
        //         return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`; // Format to 'YYYY-MM-DD HH:mm:ss'
        //     }
        //     return value;
        // });
        // console.log('Generated SQL Query:', formattedQuery);
    
        return ResponseDto.success('Stock mutation fetched!', result, 200);
    }

    async getHPP(filters: any) { // TODOELLA CROSSCHEK
        var result = [];
    
        const filters2 = {
            store_id: filters.store ?? undefined,
            company_id: filters.company ?? undefined,
            owner_id: filters.owner_id,
            dateStart: filters.start_date,
            dateEnd: filters.end_date
        };
    
        var formatFilters: any = {
            store: {
                company: {},
            },
            action: 'persediaan'
        };
    
        // Jika ada owner_id, tambahkan ke filter
        if (filters2.owner_id) {
            formatFilters.store.company.owner_id = filters2.owner_id;
        }
    
        // Jika ada store_id, tambahkan langsung ke formatFilters
        if (filters2.store_id) {
            formatFilters.store_id = filters2.store_id;
        }
    
        // Jika ada company_id, pastikan store.company sudah ada sebelum menambahkan
        if (filters2.company_id) {
            if (!formatFilters.store) {
                formatFilters.store = {};
            }
            formatFilters.store.company_id = filters2.company_id;
        }
    
        const hppFetch = await this.db.report_Journals.aggregate({
            _sum: {
                amount: true,
            },
            where: {
                account_id: {
                    in: (
                        await this.db.trans_Account_Settings.findMany({
                            where: {
                                action: 'cogs',
                                store_id: filters2.store_id,
                                ...(filters2.company_id && { store: { company_id: filters2.company_id } }),
                            },
                            select: {
                                account_id: true,
                            },
                        })
                    ).map((tas) => tas.account_id),
                },
                trans_date: {
                    gte: filters2.dateStart,
                    lte: filters2.dateEnd,
                }
            },
        });
    
        const hpp = hppFetch._sum.amount ?? new Decimal(0); // Gunakan Decimal(0) agar tetap konsisten

        result.push({
            name: 'HPP',
            amount: Math.abs(Number(hpp)) * -1, // Konversi aman ke number
        });

        return result;
    }
    

    async handleProductCodeDeleted(data: any) {
        console.log('this is product code deleted',data);
        // data: {
        //     id: '9e2f1473-5a96-4819-b4b5-a717033b1791',
        //     barcode: 'AA0010100010005',
        //     product_id: '36dad44a-7d50-4e29-8a82-18a869ba8f22',
        //     weight: '3',
        //     fixed_price: '100000',
        //     status: 0,
        //     taken_out_at: null,
        //     buy_price: '110000',
        //     tax_purchase: '12100',
        //     image: '',
        //     account_id: 'f609be50-160a-4edd-b3ac-755ab5c5739a',
        //     created_at: '2025-03-17T04:28:36.013Z',
        //     updated_at: '2025-03-17T04:28:36.013Z',
        //     deleted_at: null,
        //     product: {
        //       id: '36dad44a-7d50-4e29-8a82-18a869ba8f22',
        //       code: 'AA001010001',
        //       name: 'asdf',
        //       description: 'sdf',
        //       images: [Array],
        //       status: 1,
        //       tags: [Array],
        //       type_id: '81b1af2f-9a6a-41c0-806c-012fd002310f',
        //       store_id: '9a3d8de0-b367-4a13-9f56-9eaea7608613',
        //       created_at: '2025-03-17T03:41:41.009Z',
        //       updated_at: '2025-03-17T03:41:41.009Z',
        //       deleted_at: null,
        //       type: [Object],
        //       store: [Object]
        //     }
        //   },
        //   errors: null
        // }
        var productCode = data.data;

        await this.db.$transaction(async (prisma) => {
            const fetchPrevReportStock = await prisma.report_Stocks.findMany({
                where: {
                    product_code_id: productCode.id,
                    source_id: {
                        in: [4, 5] // dari purchase from customer 
                    }
                }
            });
            // Ini kalo misal delete nya barang yang dibeli dari customer / ditrade dari customer dan barang bukan asal toko ini.
            if (fetchPrevReportStock.some(stock => stock.trans_product_id != null)) {
                await prisma.report_Stocks.updateMany({
                    where: {
                        product_code_id: productCode.id,
                        source_id: {
                            in: [4, 5] // dari purchase from customer 
                        }
                    },
                    data: {
                        category_id: null,
                        category_code:null,
                        category_name: null,
                        type_id: null,
                        type_code: null,
                        type_name:null,
                        product_id:null,
                        product_code: null,
                        product_name: null,
                        product_code_code: null,
                        product_code_id: null,
                        category_balance_qty: null,
                        category_balance_gram: null,                
                    }
                })
            } 
            // Delete product purchase from supplier
            else {
                // delete from report journals
                await prisma.report_Journals.deleteMany({
                    where: {
                        trans_serv_id: productCode.id,
                        trans_type_id: {
                            in: [8,4,7]
                        }
                    }
                });
        
                // delete from report stocks
                await prisma.report_Stocks.deleteMany({
                    where: {
                        product_code_id: productCode.id,
                        source_id:{
                            in: [1, 4, 5] // dari purchase from customer 
                        }
                    }
                });
            }
            
        });
        return ResponseDto.success('Product code deleted!', null, 200);
    }

    async handleStockOut(data: any) {
        let code;
        switch (data.reason) {
            case 1:
                code = 'REPAIR';
                break;
            default:
                code = 'OUTSTOCK';
                break;
        }
        
        const tempWeight = Math.abs(parseFloat(data.productCode.weight)) * -1;
        const tempQty = -1;
        const categoryBalance = await this.getCategoryBalance(
            data.productCode.product.type.category_id, 
            tempQty,
            tempWeight, 
        );
        const source = await this.stockSourceService.findOne(undefined, { code });
        const MappedData = {
            store_id: data.productCode.product.store_id,
            source_id: source.id,
            trans_id: data.trans_id,
            trans_date: data.trans_date,
            category_id: data.productCode.product.type.category_id,
            category_code: data.productCode.product.type.category.code,
            category_name: data.productCode.product.type.category.name,
            type_id: data.productCode.product.type.id,
            type_code: data.productCode.product.type.code,
            type_name: data.productCode.product.type.name,
            product_id: data.productCode.product.id,
            product_code: data.productCode.product.code,
            product_name: data.productCode.product.name,
            product_code_code: data.productCode.barcode,
            product_code_id: data.productCode.id,
            weight:tempWeight,
            price: parseFloat(data.productCode.buy_price),
            qty: tempQty,
            created_at: new Date(data.productCode.created_at),
            category_balance_qty: categoryBalance.category_balance_qty,
            category_balance_gram: categoryBalance.category_balance_gram,
        }
        const result = await this.create(MappedData);
        console.log('stock out result',result);
        return result;
    }
    async handleStockInRepaired(data: any) {
        const source = await this.stockSourceService.findOne(undefined, { code: 'REPAIR' });
        const tempWeight = Math.abs(parseFloat(data.weight));
        const tempQty = 1;
        const categoryBalance = await this.getCategoryBalance(
            data.productCode.product.type.category_id, 
            tempQty,
            tempWeight, 
        );
        const MappedData = {
            store_id: data.productCode.product.store_id,
            source_id: source.id,
            trans_id: data.trans_id,
            trans_date: data.trans_date,
            category_id: data.productCode.product.type.category_id,
            category_code: data.productCode.product.type.category.code,
            category_name: data.productCode.product.type.category.name,
            type_id: data.productCode.product.type.id,
            type_code: data.productCode.product.type.code,
            type_name: data.productCode.product.type.name,
            product_id: data.productCode.product.id,
            product_code: data.productCode.product.code,
            product_name: data.productCode.product.name,
            product_code_code: data.productCode.barcode,
            product_code_id: data.productCode.id,
            weight: tempWeight,
            price: parseFloat(data.productCode.buy_price),
            qty: tempQty,
            created_at: new Date(data.productCode.created_at),
            category_balance_qty: categoryBalance.category_balance_qty,
            category_balance_gram: categoryBalance.category_balance_gram,
        }
        const result = await this.create(MappedData);
        console.log('result stock in repaired', result);
        return result;
    }

    async handlePurchaseStock(data) {
        const source = await this.stockSourceService.findOne(undefined, { code: 'PURCHASE' });
        var results = [];
        for (let prodCode of data.transaction_products) {
            console.log('ini product masuk purchae',prodCode)
            const tempWeight = Math.abs(parseFloat(prodCode.weight));
            const tempQty = 1;
            let categoryBalance = {
                category_balance_qty: 0,
                category_balance_gram: 0,
            };
            if (prodCode.product_code?.product?.type?.category_id) {
                categoryBalance = await this.getCategoryBalance(
                    prodCode.product_code.product.type.category_id, 
                    tempQty,
                    tempWeight, 
                );
            }
            
            let MappedData :any = {
                store_id: data.store_id,
                source_id: source.id,
                trans_id: data.trans_serv_id,
                trans_date: data.date,
                category_id: prodCode.product_code?.product?.type?.category_id ?? null,
                category_code: prodCode.product_code?.product?.type?.category?.code ?? null,
                category_name: prodCode.product_code?.product?.type.category.name ?? null,
                type_id: prodCode.product_code?.product?.type?.id ?? null,
                type_code: prodCode.product_code?.product?.type?.code ?? null,
                type_name: prodCode.product_code?.product?.type?.name ?? null,
                product_id: prodCode.product_code?.product?.id ?? null,
                product_code: prodCode.product_code?.product?.code ?? null,
                product_name: prodCode.product_code?.product?.name ?? null,
                product_code_code: prodCode.product_code?.barcode ?? null,
                product_code_id: prodCode.product_code?.id ?? null,
                weight: tempWeight,
                price: Math.abs(parseFloat(prodCode.total_price)),
                qty: tempQty,
                created_at: new Date(prodCode.created_at),
                category_balance_qty: categoryBalance.category_balance_qty ?? 0,
                category_balance_gram: categoryBalance.category_balance_gram ?? 0,
            }

            if (prodCode.product_code == null) {
                MappedData.trans_product_id = prodCode.id; // table transactionProduct.id dari service transaction
            }
            console.log('purchase stock in mappedData',MappedData)
            const result = await this.create(MappedData);
            results.push(result);
        }
        console.log('result purchase from customer', results);
        return results;
    }

    async handleTradeStock(data) {
        const source = await this.stockSourceService.findOne(undefined, { code: 'TRADE' });
        var results = [];
        for (let prodCode of data.transaction_products) {
            console.log('ini product masuk trade',prodCode)
            const tempWeight = prodCode.total_price > 0 ? // apakah barang dijual?
                                Math.abs(parseFloat(prodCode.weight)) * -1 :
                                Math.abs(parseFloat(prodCode.weight));
            const tempQty = prodCode.total_price > 0 ? // apakah barang dijual?
                                -1 : 1; // jika barang dijual, qty -1, jika barang dibeli, qty 1
            let categoryBalance = {
                category_balance_qty: 0,
                category_balance_gram: 0,
            };
            if (prodCode.product_code?.product?.type?.category_id) {
                categoryBalance = await this.getCategoryBalance(
                    prodCode.product_code.product.type.category_id, 
                    tempQty,
                    tempWeight, 
                );
            }
            
            let MappedData :any = {
                store_id: data.store_id,
                source_id: source.id,
                trans_id: data.trans_serv_id,
                trans_date: data.created_at,
                category_id: prodCode.product_code?.product?.type?.category_id ?? null,
                category_code: prodCode.product_code?.product?.type?.category?.code ?? null,
                category_name: prodCode.product_code?.product?.type.category.name ?? null,
                type_id: prodCode.product_code?.product?.type?.id ?? null,
                type_code: prodCode.product_code?.product?.type?.code ?? null,
                type_name: prodCode.product_code?.product?.type?.name ?? null,
                product_id: prodCode.product_code?.product?.id ?? null,
                product_code: prodCode.product_code?.product?.code ?? null,
                product_name: prodCode.product_code?.product?.name ?? null,
                product_code_code: prodCode.product_code?.barcode ?? null,
                product_code_id: prodCode.product_code?.id ?? null,
                weight: tempWeight,
                price: Math.abs(parseFloat(prodCode.total_price)),
                qty: tempQty,
                created_at: new Date(prodCode.created_at),
                category_balance_qty: categoryBalance.category_balance_qty ?? 0,
                category_balance_gram: categoryBalance.category_balance_gram ?? 0,
            }

            if (prodCode.product_code == null) {
                MappedData.trans_product_id = prodCode.id; // table transactionProduct.id dari service transaction
            }
            console.log('trade stock in mappedData',MappedData)
            const result = await this.create(MappedData);
            results.push(result);
        }
        return results;
    }
}
