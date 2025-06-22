import { Inject, Injectable } from '@nestjs/common';
import { Prisma, Report_Stocks } from '@prisma/client';
import { BaseService } from 'src/common/base.service';
import { DatabaseService } from 'src/database/database.service';
import { StockSourceService } from './stock-source.service';
import { ReportStockValidation } from './report-stocks.validation';
import { ValidationService } from 'src/common/validation.service';
import { ResponseDto } from 'src/common/response.dto';
import { TransAccountSettingsService } from 'src/trans-account-settings/trans-account-settings.service';
import { Decimal } from '@prisma/client/runtime/library';
import { ClientProxy } from '@nestjs/microservices';
import { all } from 'axios';

@Injectable()
export class ReportStocksService extends BaseService<Report_Stocks> {
    constructor(
        db: DatabaseService,
        private readonly stockSourceService: StockSourceService,
        private readonly reportStockValidation: ReportStockValidation,
        private readonly validationService: ValidationService,
        private readonly transAccountSettingsServ: TransAccountSettingsService,
        @Inject('INVENTORY_READER') private readonly inventoryReaderClient: ClientProxy,
    ) {
        const relations = {
        }
        super('report_Stocks', db, relations);
    }

    async handleSoldStock(data: any) {
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
        try {
            const source = await this.stockSourceService.findOne(undefined, { code: 'SALES' });
            let stocksReports = [];
    
            for (const prod of data.transaction_products) {
                const tempWeight = Math.abs(parseFloat(prod.product_code.weight)) * -1;
                const tempQty = -1;
    
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
                };
                await this.updateUnitPrice(mappedData.product_id, mappedData.qty, mappedData.weight);
                stocksReports.push(mappedData);
            }
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
        const MappedData = {
            store_id: validData.product.store.id,
            source_id: source.id,
            trans_id: data.id,
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
        }
        const result = await this.create(MappedData);
        if (result) {
            await this.addUnitPrice(MappedData.product_id, (MappedData.price / MappedData.weight), MappedData.qty, MappedData.weight);
        }
        return result;
    }

    async getStockCard(filters: any) {
        console.log('test ture nya:', !filters.store_id && !filters.product_id, filters.store_id, filters.product_id );
        if (!filters.store_id && !filters.product_id) {
            return this.getStockCardAvg(filters);
        }
        let store;
        if (filters.store_id) {
            store = await this.db.stores.findFirst({
                where: {
                    id: filters.store_id,
                }
            });
            if (!store) {
                return ResponseDto.error('Store not found', 404);
            }
        } else {
            // console.log('filters in getStockCard:', filters);
            // const product = await this.db.report_Stocks.findFirst({
            //     where: {
            //         product_id: filters.product_id,
            //     },
            //     select: {
            //         store_id: true,
            //     }
            // })
            // console.log()
            // console.log('this is the product get stock card:', product);
            // if (product) {
            store = await this.db.stores.findFirst({
                where: {
                    id: filters.auth.store_id,
                }
            });
            // }
        }

        // Average Method
        if (store.inventory_val_method == 1) {
            return this.getStockCardAvg(filters);
        }
        // Precise Method
        else {
            return this.getStockCardPrecise(filters);
        }
    }
    
    async getStockCardAvg(filters: any) {
        console.log('filters in getStockCard:', filters);

        const conditions: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        // Build dynamic WHERE conditions for main stock query (starting at dateStart)
        if (filters.product_id) {
            conditions.push(`rs.product_id = $${paramIndex}::uuid`);
            params.push(filters.product_id);
            paramIndex++;
        }
        if (filters.dateStart) {
            // conditions.push(`rs.trans_date >= $${paramIndex}`);
            // params.push(filters.dateStart);
            // paramIndex++;
            filters.dateStart = new Date(filters.dateStart).toISOString().slice(0, 19).replace('T', ' ');
        }
        if (filters.dateEnd) {
            conditions.push(`rs.trans_date <= $${paramIndex}`);
            params.push(filters.dateEnd);
            paramIndex++;
        }
        if (filters.company_id) {
            conditions.push(`st.company_id = $${paramIndex}::uuid`);
            params.push(filters.company_id);
            paramIndex++;
        }
        if (filters.store_id) {
            conditions.push(`rs.store_id = $${paramIndex}::uuid`);
            params.push(filters.store_id);
            paramIndex++;
        }
        if (filters.category_id) {
            conditions.push(`rs.category_id = $${paramIndex}::uuid`);
            params.push(filters.category_id);
            paramIndex++;
        }
        if (filters.type_id) {
            conditions.push(`rs.type_id = $${paramIndex}::uuid`);
            params.push(filters.type_id);
            paramIndex++;
        }
        if (filters.owner_id) {
            conditions.push(`com.owner_id = $${paramIndex}::uuid`);
            params.push(filters.owner_id);
            paramIndex++;
        }
        if (filters.product_code_code) {
            conditions.push(`rs.product_code_code = $${paramIndex}`);
            params.push(filters.product_code_code);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        // Prepare query to get stock card starting from dateStart
        function getStockCardQuery(whereClause, dateStart) {
            return `
                WITH RECURSIVE
                transaksi AS (
                    SELECT 
                        rs.*,
                        com.name AS company,
                        st.name AS store,
                        ss.name AS description,
                        CASE 
                            WHEN rs.qty >= 0 AND rs.weight > 0 THEN rs.price / rs.weight
                            ELSE 0
                        END AS incoming_price_per_weight,
                        CASE 
                            WHEN rs.qty >= 0 THEN rs.weight
                            ELSE 0
                        END AS incoming_weight,
                        qty as incoming_qty
                    FROM "Report_Stocks" rs
                    JOIN "Stock_Source" ss ON rs.source_id = ss.id
                    JOIN "Stores" st ON rs.store_id = st.id
                    JOIN "Companies" com ON st.company_id = com.id
                    ${whereClause}
                ),
                ordered AS (
                    SELECT *, ROW_NUMBER() OVER (ORDER BY trans_date, created_at) AS rn
                    FROM transaksi
                ),
                rekursif_avg AS (
                    SELECT 
                        o.*,
                        incoming_price_per_weight AS price_per_weight,
                        incoming_weight AS total_weight,
                        incoming_qty as total_qty,
                        CASE 
                            WHEN incoming_weight > 0 THEN incoming_price_per_weight
                            ELSE 0
                        END AS unit_price
                    FROM ordered o
                    WHERE rn = 1

                    UNION ALL

                    SELECT 
                        o.*,
                        CASE 
                            WHEN o.qty >= 0 THEN
                                ra.price_per_weight
                            ELSE
                                ra.price_per_weight
                        END AS price_per_weight,
                        CASE 
                            WHEN o.qty >= 0 THEN
                                ra.total_weight + o.incoming_weight
                            ELSE
                                ra.total_weight - ABS(o.weight)
                        END AS total_weight,
                        CASE 
                            WHEN o.qty >= 0 THEN
                                ra.total_qty + o.incoming_qty
                            ELSE
                                ra.total_qty - ABS(o.incoming_qty)
                        END AS total_qty,
                        CASE 
                            WHEN o.qty >= 0 AND o.source_id != 6 THEN
                                (ra.unit_price * ra.total_weight + o.incoming_price_per_weight * o.incoming_weight) / NULLIF(ra.total_weight + o.incoming_weight, 0)
                            ELSE
                                ra.unit_price
                        END AS unit_price
                    FROM rekursif_avg ra
                    JOIN ordered o ON o.rn = ra.rn + 1
                )
                SELECT 
                    product_id,
                    trans_code,
                    company,
                    store,
                    trans_date AS date,
                    product_code_code AS code,
                    product_name AS name,
                    description,
                    CASE WHEN qty >= 0 THEN price / NULLIF(weight, 0) ELSE 0 END AS price,
                    CASE WHEN qty >= 0 THEN qty ELSE 0 END AS "in",
                    CASE WHEN qty < 0 THEN -qty ELSE 0 END AS "out",
                    total_qty as balance,
                    CASE WHEN qty >= 0 THEN weight ELSE 0 END AS weight_in,
                    CASE WHEN qty < 0 THEN -weight ELSE 0 END AS weight_out,
                    total_weight AS balance_weight,
                    ROUND(unit_price, 2) AS unit_price,
                    ROUND((unit_price * total_weight), 2) AS stock_value
                FROM rekursif_avg
                ${dateStart ? `WHERE trans_date >= '${dateStart}'::timestamp` : ''}
                ORDER BY trans_date, created_at
            `;
        }
        const stockCardQuery = getStockCardQuery(whereClause, filters.dateStart);

        // If both dateStart and product_id exist, get initial stock before dateStart
        if (filters.dateStart && filters.product_id) {
            const conditionsInitialStock: string[] = [];
            const paramsInitialStock: any[] = [];
            let paramIndexInitialStock = 1;
            if (filters.product_id) {
                conditionsInitialStock.push(`rs.product_id = $${paramIndexInitialStock}::uuid`);
                paramsInitialStock.push(filters.product_id);
                paramIndexInitialStock++;
            }
            const dateEnd = new Date(filters.dateEnd);
            if (filters.dateEnd) {
                conditionsInitialStock.push(`rs.trans_date <= $${paramIndexInitialStock}`);
                // dateEnd sehari sebelum date End
                dateEnd.setDate(dateEnd.getDate() - 1);
                paramsInitialStock.push(dateEnd);
                paramIndexInitialStock++;
            }
            if (filters.company_id) {
                conditionsInitialStock.push(`st.company_id = $${paramIndexInitialStock}::uuid`);
                paramsInitialStock.push(filters.company_id);
                paramIndexInitialStock++;
            }
            if (filters.store_id) {
                conditionsInitialStock.push(`rs.store_id = $${paramIndexInitialStock}::uuid`);
                paramsInitialStock.push(filters.store_id);
                paramIndexInitialStock++;
            }
            if (filters.category_id) {
                conditionsInitialStock.push(`rs.category_id = $${paramIndexInitialStock}::uuid`);
                paramsInitialStock.push(filters.category_id);
                paramIndexInitialStock++;
            }
            if (filters.type_id) {
                conditionsInitialStock.push(`rs.type_id = $${paramIndexInitialStock}::uuid`);
                paramsInitialStock.push(filters.type_id);
                paramIndexInitialStock++;
            }
            if (filters.owner_id) {
                conditionsInitialStock.push(`com.owner_id = $${paramIndexInitialStock}::uuid`);
                paramsInitialStock.push(filters.owner_id);
                paramIndexInitialStock++;
            }
            if (filters.product_code_code) {
                conditionsInitialStock.push(`rs.product_code_code = $${paramIndexInitialStock}`);
                paramsInitialStock.push(filters.product_code_code);
                paramIndexInitialStock++;
            }
            if (filters.dateStart) {
                const beforeStart = new Date(filters.dateStart);
                beforeStart.setDate(beforeStart.getDate() - 1);
                conditionsInitialStock.push(`rs.trans_date <= $${paramIndexInitialStock}`);
                paramsInitialStock.push(beforeStart);
                paramIndexInitialStock++;
            }


            const whereClauseInitialStock = conditionsInitialStock.length > 0 ? 'WHERE ' + conditionsInitialStock.join(' AND ') : '';
            const initialStockQuery = getStockCardQuery(whereClauseInitialStock, null);

            try {
                let allresults: any = [];
                const stockCardResult: any = await this.db.$queryRawUnsafe(stockCardQuery, ...params);
                const initialStockResult: any = await this.db.$queryRawUnsafe(initialStockQuery, ...paramsInitialStock);
                // initialStockresult get last stock before dateStart
                if (initialStockResult.length > 0) {
                    let lastRow = initialStockResult[initialStockResult.length - 1];
                    // change description to 'Initial Stock'
                    lastRow.description = 'Initial Stock';
                    lastRow.detail_description = '';
                    lastRow.code = '';
                    lastRow.trans_code = '';
                    lastRow.date = dateEnd;
                    lastRow.price = 0;
                    lastRow.in = 0;
                    lastRow.out = 0;
                    lastRow.weight_in = 0;
                    lastRow.weight_out = 0;
                    console.log('lastRow', lastRow);
                    allresults = [lastRow, ...stockCardResult];
                }else {
                    // craete initial stock row with all value 0
                    const initialStockRow =  {
                        "product_id": "",
                        "trans_code": null,
                        "company": "",
                        "store": "",
                        "date": dateEnd,
                        "code": "",
                        "name": "",
                        "description": "Initial Stock",
                        "price": "0",
                        "in": 0,
                        "out": 0,
                        "balance": "0",
                        "weight_in": "0",
                        "weight_out": "0",
                        "balance_weight": "0",
                        "unit_price": "0",
                        "stock_value": "0"
                    }
                    allresults = [initialStockRow, ...stockCardResult];
                }
                return ResponseDto.success('Stock Card fetched with initial stock!', allresults, 200);
            } catch (error) {
                console.error('Error executing query:', error);
                return ResponseDto.error('Failed to fetch stock Card', 500);
            }
        } else {
            // No need to add initial stock, just run main query
            try {
                const result: any = await this.db.$queryRawUnsafe(stockCardQuery, ...params);
                return ResponseDto.success('Stock Card fetched!', result, 200);
            } catch (error) {
                console.error('Error executing query:', error);
                return ResponseDto.error('Failed to fetch stock Card', 500);
            }
        }
    }

    async getStockCardPrecise(filters : any) {
        console.log('filters in getStockCardPrecise:', filters);

        const conditions: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        // Build dynamic WHERE conditions for main stock query (starting at dateStart)
        if (filters.product_id) {
            conditions.push(`rs.product_id = $${paramIndex}::uuid`);
            params.push(filters.product_id);
            paramIndex++;
        }
        if (filters.dateStart) {
            // conditions.push(`rs.trans_date >= $${paramIndex}`);
            // params.push(filters.dateStart);
            // paramIndex++;
            filters.dateStart = new Date(filters.dateStart).toISOString().slice(0, 19).replace('T', ' ');
        }
        if (filters.dateEnd) {
            conditions.push(`rs.trans_date <= $${paramIndex}`);
            params.push(filters.dateEnd);
            paramIndex++;
        }
        if (filters.company_id) {
            conditions.push(`st.company_id = $${paramIndex}::uuid`);
            params.push(filters.company_id);
            paramIndex++;
        }
        if (filters.store_id) {
            conditions.push(`rs.store_id = $${paramIndex}::uuid`);
            params.push(filters.store_id);
            paramIndex++;
        }
        if (filters.category_id) {
            conditions.push(`rs.category_id = $${paramIndex}::uuid`);
            params.push(filters.category_id);
            paramIndex++;
        }
        if (filters.type_id) {
            conditions.push(`rs.type_id = $${paramIndex}::uuid`);
            params.push(filters.type_id);
            paramIndex++;
        }
        if (filters.owner_id) {
            conditions.push(`com.owner_id = $${paramIndex}::uuid`);
            params.push(filters.owner_id);
            paramIndex++;
        }
        if (filters.product_code_code) {
            conditions.push(`rs.product_code_code = $${paramIndex}`);
            params.push(filters.product_code_code);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        // Prepare query to get stock card starting from dateStart
        function getStockCardQuery(whereClause, dateStart) {
            return `
                WITH RECURSIVE
                transaksi AS (
                    SELECT 
                        rs.*,
                        com.name AS company,
                        st.name AS store,
                        ss.name AS description,
                        CASE 
                            WHEN rs.qty >= 0 AND rs.weight > 0 THEN rs.price / rs.weight
                            ELSE 0
                        END AS incoming_price_per_weight,
                        CASE 
                            WHEN rs.qty >= 0 THEN rs.weight
                            ELSE 0
                        END AS incoming_weight,
                        qty as incoming_qty
                    FROM "Report_Stocks" rs
                    JOIN "Stock_Source" ss ON rs.source_id = ss.id
                    JOIN "Stores" st ON rs.store_id = st.id
                    JOIN "Companies" com ON st.company_id = com.id
                    ${whereClause}
                ),
                ordered AS (
                    SELECT *, ROW_NUMBER() OVER (ORDER BY trans_date, created_at) AS rn
                    FROM transaksi
                ),
                rekursif_avg AS (
                    SELECT 
                        o.*,
                        incoming_price_per_weight * incoming_qty AS price_per_weight,
                        incoming_weight AS total_weight,
                        incoming_qty as total_qty,
                        CASE 
                            WHEN incoming_weight > 0 THEN incoming_price_per_weight
                            ELSE 0
                        END AS unit_price,
                        (o.price * incoming_qty) AS accumulated_price
                    FROM ordered o
                    WHERE rn = 1

                    UNION ALL

                    SELECT 
                        o.*,
                        CASE 
                            WHEN o.qty >= 0 THEN
                                ra.price_per_weight
                            ELSE
                                ra.price_per_weight
                        END AS price_per_weight,
                        CASE 
                            WHEN o.qty >= 0 THEN
                                ra.total_weight + o.incoming_weight
                            ELSE
                                ra.total_weight - ABS(o.weight)
                        END AS total_weight,
                        CASE 
                            WHEN o.qty >= 0 THEN
                                ra.total_qty + o.incoming_qty
                            ELSE
                                ra.total_qty - ABS(o.incoming_qty)
                        END AS total_qty,
                        (o.incoming_price_per_weight * o.incoming_qty) AS unit_price,
                        ra.accumulated_price + (o.price * o.incoming_qty) AS accumulated_price
                    FROM rekursif_avg ra
                    JOIN ordered o ON o.rn = ra.rn + 1
                )
                SELECT 
                    product_id,
                    trans_code,
                    company,
                    store,
                    trans_date AS date,
                    product_code_code AS code,
                    product_name AS name,
                    description,
                    price / weight AS price,
                    CASE WHEN qty >= 0 THEN qty ELSE 0 END AS "in",
                    CASE WHEN qty < 0 THEN -qty ELSE 0 END AS "out",
                    total_qty as balance,
                    CASE WHEN qty >= 0 THEN weight ELSE 0 END AS weight_in,
                    CASE WHEN qty < 0 THEN -weight ELSE 0 END AS weight_out,
                    total_weight AS balance_weight,
                    ROUND(unit_price, 2) AS unit_price,
                    ROUND(accumulated_price, 2) AS stock_value
                FROM rekursif_avg
                ${dateStart ? `WHERE trans_date >= '${dateStart}'::timestamp` : ''}
                ORDER BY trans_date, created_at
            `;
        }
        const stockCardQuery = getStockCardQuery(whereClause, filters.dateStart);

        // If both dateStart and product_id exist, get initial stock before dateStart
        if (filters.dateStart && filters.product_id) {
            const conditionsInitialStock: string[] = [];
            const paramsInitialStock: any[] = [];
            let paramIndexInitialStock = 1;
            if (filters.product_id) {
                conditionsInitialStock.push(`rs.product_id = $${paramIndexInitialStock}::uuid`);
                paramsInitialStock.push(filters.product_id);
                paramIndexInitialStock++;
            }
            const dateEnd = new Date(filters.dateEnd);
            if (filters.dateEnd) {
                conditionsInitialStock.push(`rs.trans_date <= $${paramIndexInitialStock}`);
                // dateEnd sehari sebelum date End
                dateEnd.setDate(dateEnd.getDate() - 1);
                paramsInitialStock.push(dateEnd);
                paramIndexInitialStock++;
            }
            if (filters.company_id) {
                conditionsInitialStock.push(`st.company_id = $${paramIndexInitialStock}::uuid`);
                paramsInitialStock.push(filters.company_id);
                paramIndexInitialStock++;
            }
            if (filters.store_id) {
                conditionsInitialStock.push(`rs.store_id = $${paramIndexInitialStock}::uuid`);
                paramsInitialStock.push(filters.store_id);
                paramIndexInitialStock++;
            }
            if (filters.category_id) {
                conditionsInitialStock.push(`rs.category_id = $${paramIndexInitialStock}::uuid`);
                paramsInitialStock.push(filters.category_id);
                paramIndexInitialStock++;
            }
            if (filters.type_id) {
                conditionsInitialStock.push(`rs.type_id = $${paramIndexInitialStock}::uuid`);
                paramsInitialStock.push(filters.type_id);
                paramIndexInitialStock++;
            }
            if (filters.owner_id) {
                conditionsInitialStock.push(`com.owner_id = $${paramIndexInitialStock}::uuid`);
                paramsInitialStock.push(filters.owner_id);
                paramIndexInitialStock++;
            }
            if (filters.product_code_code) {
                conditionsInitialStock.push(`rs.product_code_code = $${paramIndexInitialStock}`);
                paramsInitialStock.push(filters.product_code_code);
                paramIndexInitialStock++;
            }
            if (filters.dateStart) {
                const beforeStart = new Date(filters.dateStart);
                beforeStart.setDate(beforeStart.getDate() - 1);
                conditionsInitialStock.push(`rs.trans_date <= $${paramIndexInitialStock}`);
                paramsInitialStock.push(beforeStart);
                paramIndexInitialStock++;
            }


            const whereClauseInitialStock = conditionsInitialStock.length > 0 ? 'WHERE ' + conditionsInitialStock.join(' AND ') : '';
            const initialStockQuery = getStockCardQuery(whereClauseInitialStock, null);

            try {
                let allresults: any = [];
                const stockCardResult: any = await this.db.$queryRawUnsafe(stockCardQuery, ...params);
                const initialStockResult: any = await this.db.$queryRawUnsafe(initialStockQuery, ...paramsInitialStock);
                // initialStockresult get last stock before dateStart
                if (initialStockResult.length > 0) {
                    let lastRow = initialStockResult[initialStockResult.length - 1];
                    // change description to 'Initial Stock'
                    lastRow.description = 'Initial Stock';
                    lastRow.detail_description = '';
                    lastRow.code = '';
                    lastRow.trans_code = '';
                    lastRow.date = dateEnd;
                    lastRow.price = 0;
                    lastRow.in = 0;
                    lastRow.out = 0;
                    lastRow.weight_in = 0;
                    lastRow.weight_out = 0;
                    console.log('lastRow', lastRow);
                    allresults = [lastRow, ...stockCardResult];
                }else {
                    // craete initial stock row with all value 0
                    const initialStockRow =  {
                        "product_id": "",
                        "trans_code": null,
                        "company": "",
                        "store": "",
                        "date": dateEnd,
                        "code": "",
                        "name": "",
                        "description": "Initial Stock",
                        "price": "0",
                        "in": 0,
                        "out": 0,
                        "balance": "0",
                        "weight_in": "0",
                        "weight_out": "0",
                        "balance_weight": "0",
                        "unit_price": "0",
                        "stock_value": "0"
                    }
                    allresults = [initialStockRow, ...stockCardResult];
                }
                return ResponseDto.success('Stock Card fetched with initial stock!', allresults, 200);
            } catch (error) {
                console.error('Error executing query:', error);
                return ResponseDto.error('Failed to fetch stock Card', 500);
            }
        } else {
            // No need to add initial stock, just run main query
            try {
                const result: any = await this.db.$queryRawUnsafe(stockCardQuery, ...params);
                return ResponseDto.success('Stock Card fetched!', result, 200);
            } catch (error) {
                console.error('Error executing query:', error);
                return ResponseDto.error('Failed to fetch stock Card', 500);
            }
        }
    }

    // async getStockCard(filters: any) {
    //     console.log('filters in getStockCard:', filters);

    //     const conditions: string[] = [];
    //     const params: any[] = [];
    //     let paramIndex = 1;

    //     // Build dynamic WHERE conditions
    //     if (filters.product_id) {
    //         conditions.push(`rs.product_id = $${paramIndex}::uuid`);
    //         params.push(filters.product_id);
    //         paramIndex++;
    //     }
    //     if (filters.dateStart) {
    //         conditions.push(`rs.trans_date >= $${paramIndex}`);
    //         params.push(filters.dateStart);
    //         paramIndex++;
    //     }
    //     if (filters.dateEnd) {
    //         conditions.push(`rs.trans_date <= $${paramIndex}`);
    //         params.push(filters.dateEnd);
    //         paramIndex++;
    //     }
    //     if (filters.company_id) {
    //         conditions.push(`st.company_id = $${paramIndex}::uuid`);
    //         params.push(filters.company_id);
    //         paramIndex++;
    //     }
    //     if (filters.store_id) {
    //         conditions.push(`rs.store_id = $${paramIndex}::uuid`);
    //         params.push(filters.store_id);
    //         paramIndex++;
    //     }
    //     if (filters.category_id) {
    //         conditions.push(`rs.category_id = $${paramIndex}::uuid`);
    //         params.push(filters.category_id);
    //         paramIndex++;
    //     }
    //     if (filters.type_id) {
    //         conditions.push(`rs.type_id = $${paramIndex}::uuid`);
    //         params.push(filters.type_id);
    //         paramIndex++;
    //     }
    //     if (filters.owner_id) {
    //         conditions.push(`com.owner_id = $${paramIndex}::uuid`);
    //         params.push(filters.owner_id);
    //         paramIndex++;
    //     }
    //     if (filters.product_code_code) {
    //         conditions.push(`rs.product_code_code = $${paramIndex}`);
    //         params.push(filters.product_code_code);
    //         paramIndex++;
    //     }

    //     // Build WHERE clause string
    //     const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    //     // Final Query string with WITH RECURSIVE
    //     const finalQuery = `
    //         WITH RECURSIVE
    //         transaksi AS (
    //             SELECT 
    //                 rs.*,
    //                 com.name AS company,
    //                 st.name AS store,
    //                 ss.name AS description,
    //                 CASE 
    //                     WHEN rs.qty >= 0 AND rs.weight > 0 THEN rs.price * rs.weight
    //                     ELSE 0
    //                 END AS incoming_value,
    //                 CASE 
    //                     WHEN rs.qty >= 0 THEN rs.weight
    //                     ELSE 0
    //                 END AS incoming_weight
    //             FROM "Report_Stocks" rs
    //             JOIN "Stock_Source" ss ON rs.source_id = ss.id
    //             JOIN "Stores" st ON rs.store_id = st.id
    //             JOIN "Companies" com ON st.company_id = com.id
    //             ${whereClause}
    //         ),
    //         ordered AS (
    //             SELECT *, ROW_NUMBER() OVER (ORDER BY trans_date, created_at) AS rn
    //             FROM transaksi
    //         ),
    //         rekursif_avg AS (
    //             SELECT 
    //                 o.*,
    //                 incoming_value AS total_value,
    //                 incoming_weight AS total_weight,
    //                 CASE 
    //                     WHEN incoming_weight > 0 THEN incoming_value / incoming_weight
    //                     ELSE 0
    //                 END AS unit_price
    //             FROM ordered o
    //             WHERE rn = 1

    //             UNION ALL

    //             SELECT 
    //                 o.*,
    //                 CASE 
    //                     WHEN o.qty >= 0 THEN
    //                         ra.total_value + o.incoming_value
    //                     ELSE
    //                         ra.total_value - (ABS(o.weight) * ra.unit_price)
    //                 END AS total_value,
    //                 CASE 
    //                     WHEN o.qty >= 0 THEN
    //                         ra.total_weight + o.incoming_weight
    //                     ELSE
    //                         ra.total_weight - ABS(o.weight)
    //                 END AS total_weight,
    //                 CASE 
    //                     WHEN o.qty >= 0 THEN
    //                         (ra.total_value + o.incoming_value) / NULLIF(ra.total_weight + o.incoming_weight, 0)
    //                     ELSE
    //                         ra.unit_price
    //                 END AS unit_price
    //             FROM rekursif_avg ra
    //             JOIN ordered o ON o.rn = ra.rn + 1
    //         )
    //         SELECT 
    //             product_id,
    //             trans_code,
    //             company,
    //             store,
    //             trans_date AS date,
    //             product_code_code AS code,
    //             product_name AS name,
    //             description,
    //             price,
    //             CASE WHEN qty >= 0 THEN qty ELSE 0 END AS "in",
    //             CASE WHEN qty < 0 THEN -qty ELSE 0 END AS "out",
    //             SUM(qty) OVER (
    //                 PARTITION BY product_id 
    //                 ORDER BY trans_date, created_at 
    //                 ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    //             )::NUMERIC AS balance,
    //             CASE WHEN qty >= 0 THEN weight ELSE 0 END AS weight_in,
    //             CASE WHEN qty < 0 THEN -weight ELSE 0 END AS weight_out,
    //             SUM(weight) OVER (
    //                 PARTITION BY product_id 
    //                 ORDER BY trans_date, created_at 
    //                 ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    //             )::NUMERIC AS balance_weight,
    //             ROUND(unit_price, 2) AS unit_price,
    //             ROUND(total_value, 2) AS stock_value
    //         FROM rekursif_avg
    //         ORDER BY trans_date, created_at
    //     `;

    //     console.log("Final Query:", finalQuery);
    //     console.log("Parameters:", params);

    //     try {
    //         const result: any = await this.db.$queryRawUnsafe(finalQuery, ...params);
    //         // Add initial stock query here then append it
    //         return ResponseDto.success('Stock Card fetched!', result, 200);
    //     } catch (error) {
    //         console.error('Error executing query:', error);
    //         return ResponseDto.error('Failed to fetch stock Card', 500);
    //     }
    // }

    async getStockCardOld(filters: any) {
        console.log('filters in getStockCard:', filters);
    
        const conditions: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;
        let hasProductId = false;
    
        // Optional filter: product_id
        if (filters.product_id) {
            hasProductId = true;
            conditions.push(`rs.product_id = $${paramIndex}::uuid`);
            params.push(filters.product_id);  // ensure this is a valid UUID string
            paramIndex++;
        }
    
        // Optional filters
        if (filters.dateStart) {
            conditions.push(`rs.trans_date >= $${paramIndex}`);
            params.push(new Date(filters.dateStart));
            paramIndex++;
        }
        if (filters.dateEnd) {
            conditions.push(`rs.trans_date <= $${paramIndex}`);
            params.push(new Date(filters.dateEnd));
            paramIndex++;
        }
        if (filters.company_id) {
            conditions.push(`st.company_id = $${paramIndex}::uuid`);
            params.push(filters.company_id); // ensure this is a valid UUID string
            paramIndex++;
        }
        if (filters.store_id) {
            conditions.push(`rs.store_id = $${paramIndex}::uuid`);
            params.push(filters.store_id); // ensure this is a valid UUID string
            paramIndex++;
        }
        if (filters.category_id) {
            conditions.push(`rs.category_id = $${paramIndex}::uuid`);
            params.push(filters.category_id); // ensure this is a valid UUID string
            paramIndex++;
        }
        if (filters.type_id) {
            conditions.push(`rs.type_id = $${paramIndex}::uuid`);
            params.push(filters.type_id); // ensure this is a valid UUID string
            paramIndex++;
        }
        if (filters.owner_id) {
            conditions.push(`com.owner_id = $${paramIndex}::uuid`);
            params.push(filters.owner_id);  // ensure this is a valid UUID string
            paramIndex++;
        }
        if (filters.product_code_code) {
            conditions.push(`rs.product_code_code = $${paramIndex}`);
            params.push(filters.product_code_code);
            paramIndex++;
        }
    
        // Construct WHERE clause
        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    
        const baseCTE = `
            WITH RunningTotals AS (
                SELECT
                    rs.product_id,
                    rs.trans_code,
                    com.name AS company,
                    st.name AS store,
                    rs.price,
                    rs.trans_date AS date,
                    rs.product_code_code AS code,
                    rs.product_name AS name,
                    ss.name AS description,
                    CASE WHEN rs.qty >= 0 THEN rs.qty ELSE 0 END AS "in",
                    CASE WHEN rs.qty < 0 THEN -rs.qty ELSE 0 END AS "out",
                    SUM(rs.qty) OVER (PARTITION BY rs.product_id ORDER BY rs.trans_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)::NUMERIC AS balance,
                    CASE WHEN rs.qty >= 0 THEN rs.weight ELSE 0 END AS weight_in,
                    CASE WHEN rs.qty < 0 THEN -rs.weight ELSE 0 END AS weight_out,
                    SUM(rs.weight) OVER (PARTITION BY rs.product_id ORDER BY rs.trans_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)::NUMERIC AS balance_weight,
                    SUM(rs.price) FILTER (WHERE rs.qty > 0) OVER (PARTITION BY rs.product_id ORDER BY rs.trans_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)::NUMERIC AS sum_price_qty1,
                    SUM(rs.weight) FILTER (WHERE rs.qty > 0) OVER (PARTITION BY rs.product_id ORDER BY rs.trans_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)::NUMERIC AS sum_weight_qty1
                FROM "Report_Stocks" rs
                JOIN "Stock_Source" ss ON rs.source_id = ss.id
                JOIN "Stores" st ON rs.store_id = st.id
                JOIN "Companies" com ON st.company_id = com.id
                ${whereClause}
            )
        `;
    
        const unionInitialStock = hasProductId
            ? `
            SELECT * FROM (
                SELECT 
                    rs.product_id AS product_id,
                    '' AS trans_code,
                    'Initial Stock' AS company,
                    'Initial Stock' AS store,
                    0::numeric AS price,
                    $2::date AS date,
                    '' AS code,
                    'Initial Stock' AS name,
                    'Initial Stock' AS description,
                    0::numeric AS "in",
                    0::numeric AS "out",
                    COALESCE(SUM(rs.qty), 0) AS balance,
                    0::numeric AS weight_in,
                    0::numeric AS weight_out,
                    COALESCE(SUM(rs.weight), 0) AS balance_weight,
                    SUM(rs.price) FILTER (WHERE rs.qty > 0)::NUMERIC AS sum_price_qty1,
                    SUM(rs.weight) FILTER (WHERE rs.qty > 0)::NUMERIC AS sum_weight_qty1,
                    (SUM(rs.price) FILTER (WHERE rs.qty > 0) / NULLIF(SUM(rs.weight) FILTER (WHERE rs.qty > 0), 0)) AS avg_price_per_weight
                FROM "Report_Stocks" rs
                JOIN "Stock_Source" ss ON rs.source_id = ss.id
                JOIN "Stores" st ON st.id = rs.store_id 
                JOIN "Companies" com ON com.id = st.company_id 
                WHERE rs.product_id = $1::uuid AND rs.trans_date < $2
                GROUP BY rs.product_id

                UNION ALL

                SELECT 
                    $1::uuid AS product_id,
                    '' AS trans_code,
                    'Initial Stock' AS company,
                    'Initial Stock' AS store,
                    0::numeric AS price,
                    $2::date AS date,
                    '' AS code,
                    'Initial Stock' AS name,
                    'Initial Stock' AS description,
                    0::numeric AS "in",
                    0::numeric AS "out",
                    0::numeric AS balance,
                    0::numeric AS weight_in,
                    0::numeric AS weight_out,
                    0::numeric AS balance_weight,
                    0::numeric AS sum_price_qty1,
                    0::numeric AS sum_weight_qty1,
                    0 AS avg_price_per_weight
                WHERE NOT EXISTS (
                    SELECT 1 FROM "Report_Stocks" rs
                    WHERE rs.product_id = $1::uuid AND rs.trans_date < $2
                )
            ) AS initial_stock_data
            UNION ALL
            `
            : '';

    
        const finalQuery = `
            ${baseCTE}
            SELECT * FROM (
                ${unionInitialStock}
                SELECT
                    product_id,
                    trans_code,
                    company,
                    store,
                    price,
                    date,
                    code,
                    name,
                    description,
                    "in",
                    "out",
                    balance,
                    weight_in,
                    weight_out,
                    balance_weight,
                    sum_price_qty1,
                    sum_weight_qty1,
                    (sum_price_qty1 / NULLIF(sum_weight_qty1, 0)) AS avg_price_per_weight
                FROM RunningTotals
            ) AS final_result
            ORDER BY name, date ASC;
        `;
    
        console.log("Final Query:", finalQuery);
        console.log("Parameters:", params);
    
        try {
            const result: any = await this.db.$queryRawUnsafe(finalQuery, ...params);
            return ResponseDto.success('Stock Card fetched!', result, 200);
        } catch (error) {
            console.error('Error executing query:', error);
            return ResponseDto.error('Failed to fetch stock Card', 500);
        }
    }    

    async getStockMutation(filters: any) {
        const { company_id, dateStart, dateEnd, category_id, store_id } = filters;
        let query = `
            SELECT 
                rs.category_id,
                rs.category_name,
    
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
                COALESCE(SUM(CASE WHEN rs.trans_date < $4 THEN rs.weight ELSE 0 END), 0)::numeric AS final_gram
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

        if (!store_id && !company_id) {
            query += ` AND c.owner_id = $${paramIndex}::uuid`;
            params.push(filters.owner_id);
        }
    
        query += `
            GROUP BY rs.category_id, rs.category_name
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

    async getHPP(start_date, end_date,owner_id = null, store_id = null, company_id= null) { // TODOELLA CROSSCHEK
        var result = [];
    
    
        var formatFilters: any = {
            store: {
                company: {},
            },
            action: 'cogs'
        };
    
        // Jika ada owner_id, tambahkan ke filter
        if (owner_id) {
            formatFilters.store.company.owner_id = owner_id;
        }
    
        // Jika ada store_id, tambahkan langsung ke formatFilters
        if (store_id) {
            formatFilters.store_id = store_id;
        }
    
        // Jika ada company_id, pastikan store.company sudah ada sebelum menambahkan
        if (company_id) {
            if (!formatFilters.store) {
                formatFilters.store = {};
            }
            formatFilters.store.company_id = company_id;
        }
    
        const hppFetch = await this.db.report_Journals.aggregate({
            _sum: {
                amount: true,
            },
            where: {
                account_id: {
                    in: (
                        await this.db.trans_Account_Settings.findMany({
                            where: formatFilters,
                            select: {
                                account_id: true,
                            },
                        })
                    ).map((tas) => tas.account_id),
                },
                trans_date: {
                    gte: start_date,
                    lte: end_date,
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
        var productCode = data;

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
                    }
                })
                if (fetchPrevReportStock.length > 0) {
                    for (let stock of fetchPrevReportStock) {
                        if (stock.product_id) {
                            await this.delUnitPrice(stock.product_id, (stock.price.toNumber() / stock.weight.toNumber()), stock.qty, stock.weight);
                        }
                    }
                }
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
        
                const fetchCreateProductCode = await prisma.report_Stocks.findFirst({
                    where: {
                        product_code_id: productCode.id,
                        source_id: 1
                    }
                })
                if (fetchCreateProductCode) {
                    await this.delUnitPrice(fetchCreateProductCode.product_id, (fetchCreateProductCode.price.toNumber() / fetchCreateProductCode.weight.toNumber()), fetchCreateProductCode.qty, fetchCreateProductCode.weight);
                }

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
        console.log('this is stock out data',data);
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
            price: data.amount_stock ?? parseFloat(data.productCode.buy_price),
            qty: tempQty,
            created_at: new Date(data.trans_date),
        }
        const result = await this.create(MappedData);
        console.log('stock out result',result);
        await this.updateUnitPrice(MappedData.product_id, MappedData.qty, MappedData.weight);
        return result;
    }

    async handleStockInRepaired(data: any) {
        const source = await this.stockSourceService.findOne(undefined, { code: 'REPAIR' });
        const tempWeight = Math.abs(parseFloat(data.weight));
        const tempQty = 1;
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
        }
        const result = await this.create(MappedData);
        console.log('result stock in repaired', result);
        await this.updateUnitPrice(MappedData.product_id, MappedData.qty, MappedData.weight);
        return result;
    }

    async handlePurchaseStock(data) {
        const source = await this.stockSourceService.findOne(undefined, { code: 'PURCHASE' });
        var results = [];
        for (let prodCode of data.transaction_products) {
            console.log('ini product masuk purchae',prodCode)
            const tempWeight = Math.abs(parseFloat(prodCode.weight));
            const tempQty = 1;

            // Item not from store fetch category and type
            let fetchType = null;
            if (prodCode.product_code == null && prodCode.type != null && prodCode.type != '') {
                try {
                    // get api
                    // prodCode.type =  PERUX00102 - LAPAK 01
                    const prodCodeType = prodCode.type.split('-')[0].trim();
                    const response = await this.inventoryReaderClient
                        .send({ cmd: 'get:type' }, {
                            body: {
                                code: prodCodeType,
                                store_id: data.store_id,
                                company_id: data.store.company_id,
                            }
                        })
                        .toPromise();
                    // console.log('data response get category and type',response.data);
                    // data response get category and type {
                    //     data: [
                    //         {
                    //         id: '16d95fea-22c8-4755-b635-5e76242833cd',
                    //         code: 'PERUX00102',
                    //         name: 'Bintang 2',
                    //         description: '',
                    //         category_id: 'c3a06c3b-bf16-4dda-8434-ba6b9aac241d',
                    //         percent_price_reduction: '1',
                    //         fixed_price_reduction: '0',
                    //         percent_broken_reduction: '1',
                    //         fixed_broken_reduction: '0',
                    //         created_at: '2025-05-09T02:14:57.024Z',
                    //         updated_at: '2025-05-09T02:14:57.024Z',
                    //         deleted_at: null,
                    //         products: [Array],
                    //         prices: [Array],
                    //         category: [Object]
                    //         }
                    //     ]
                    //     }
                    fetchType = response.data.data.length > 0 ? response.data.data[0] : null;
                } catch(error) {
                    console.log('error get category and type',error);
                    await this.db.failed_Message.create({
                        data: {
                            queue: 'transaction_finance_updated',
                            routingKey: 'finance_service_queue',
                            payload: '',
                            error: 'Item Not From Store Fetch Category and Type error : '  + error.stack,
                        },
                    });
                }
            }
            
            let MappedData :any = {
                store_id: data.store_id,
                source_id: source.id,
                trans_id: data.trans_serv_id,
                trans_code: data.code,
                trans_date: data.created_at,
                category_id: prodCode.product_code?.product?.type?.category_id ?? (fetchType != null ? fetchType?.category?.id : null),
                category_code: prodCode.product_code?.product?.type?.category?.code ?? (fetchType != null ? fetchType?.category?.code : null),
                category_name: prodCode.product_code?.product?.type?.category?.name ?? (fetchType != null ? fetchType?.category?.name : null),
                type_id: prodCode.product_code?.product?.type?.id ?? (fetchType != null ? fetchType?.id : null),
                type_code: prodCode.product_code?.product?.type?.code ?? (fetchType != null ? fetchType?.code : null),
                type_name: prodCode.product_code?.product?.type?.name ?? (fetchType != null ? fetchType?.name : null),
                product_id: prodCode.product_code?.product?.id ?? null,
                product_code: prodCode.product_code?.product?.code ?? null,
                product_name: prodCode.product_code?.product?.name ?? null,
                product_code_code: prodCode.product_code?.barcode ?? null,
                product_code_id: prodCode.product_code?.id ?? null,
                weight: tempWeight,
                price: Math.abs(parseFloat(prodCode.total_price)),
                qty: tempQty,
                created_at: data.created_at,
            }

            if (prodCode.product_code == null) {
                MappedData.trans_product_id = prodCode.id; // table transactionProduct.id dari service transaction
            }
            console.log('purchase stock in mappedData',MappedData)
            const result = await this.create(MappedData);
            results.push(result);
            if (MappedData.product_id) {
                await this.addUnitPrice(MappedData.product_id, (MappedData.price / MappedData.weight), MappedData.qty, MappedData.weight);
            }
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
            
            let MappedData :any = {
                store_id: data.store_id,
                source_id: source.id,
                trans_id: data.trans_serv_id,
                trans_code: data.code,
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
            }

            if (prodCode.product_code == null) {
                MappedData.trans_product_id = prodCode.id; // table transactionProduct.id dari service transaction
            }
            console.log('trade stock in mappedData',MappedData)
            const result = await this.create(MappedData);
            results.push(result);
            if (MappedData.product_id && tempQty > 0) {
                await this.addUnitPrice(MappedData.product_id, (MappedData.price / MappedData.weight), MappedData.qty, MappedData.weight);
            } else if (MappedData.product_id && tempQty < 0) {
                await this.updateUnitPrice(MappedData.product_id, tempQty, tempWeight);
            }
        }
        return results;
    }

    async addUnitPrice(product_id, price_per_gram, qty, weight) {
        // Add Average Unit Price
        if (product_id == null) {
            return null;
        }
        let lastUnitPrice = await this.db.unit_Prices.findUnique({
            where: { product_id }
        });
        qty = Math.abs(qty);
        weight = Math.abs(weight);

        let newUnitPrice;

        if (!lastUnitPrice) {
            newUnitPrice = await this.db.unit_Prices.create({
                data: {
                    product_id,
                    avg_price: new Decimal(price_per_gram).toDecimalPlaces(2),
                    qty: new Decimal(qty).toDecimalPlaces(2),
                    weight: new Decimal(weight).toDecimalPlaces(2),
                }
            });
        } else {
            const lastQty = lastUnitPrice.qty.toNumber();
            const lastWeight = lastUnitPrice.weight.toNumber();
            const lastAvg = lastUnitPrice.avg_price.toNumber();
            const newQty = lastQty + qty;
            const newWeight = lastUnitPrice.weight.toNumber() + weight;
            let newPrice = lastAvg;
            if (newWeight != 0 && !isNaN(newWeight)) {
                newPrice = ((lastAvg * lastWeight) + (price_per_gram * weight)) / newWeight;
            }
            console.log('addUnit price', 'lastQty', lastQty, 'lastWeight', lastWeight, 'lastAvg', lastAvg, 'newQty', newQty, 'newWeight', newWeight, 'newPrice', newPrice);

            newUnitPrice = await this.db.unit_Prices.update({
                where: { product_id },
                data: {
                    avg_price: new Decimal(isNaN(newPrice) ? 0 : newPrice).toDecimalPlaces(2),
                    qty: new Decimal(newQty).toDecimalPlaces(2),
                    weight: new Decimal(newWeight).toDecimalPlaces(2),
                }
            });
        }

        return newUnitPrice;
    }

    async delUnitPrice(product_id, price_per_gram, qty, weight) {
        let lastUnitPrice = await this.db.unit_Prices.findUnique({
            where: { product_id }
        });
        qty = Math.abs(qty);
        weight = Math.abs(weight);

        if (lastUnitPrice) {
            const lastQty = lastUnitPrice.qty.toNumber();
            const lastAvg = lastUnitPrice.avg_price.toNumber();
            const lastWeight = lastUnitPrice.weight.toNumber();
            const newQty = lastQty - qty;
            const newWeight = lastWeight - weight;
            let newPrice = lastAvg; // default to last average price if newWeight is 0
            if (newWeight != 0 && !isNaN(newWeight)) {
                newPrice = ((lastAvg * lastWeight) - (price_per_gram * weight)) / newWeight;
            }
            console.log('newPrice', newPrice, 'newQty', newQty, 'newWeight', newWeight, 'lastAvg', lastAvg, 'lastWeight', lastWeight, 'lastQty', lastQty, 'price_per_gram', price_per_gram, 'weight', weight);

            lastUnitPrice = await this.db.unit_Prices.update({
                where: { product_id },
                data: {
                    avg_price: new Decimal(isNaN(newPrice) ? 0 : newPrice).toDecimalPlaces(2),
                    qty: new Decimal(newQty).toDecimalPlaces(2),
                    weight: new Decimal(newWeight).toDecimalPlaces(2),
                }
            });
        }

        return lastUnitPrice;
    }

    async updateUnitPrice(product_id, qty, weight) { // qty bisa negatif atau positif
        let lastUnitPrice = await this.db.unit_Prices.findUnique({
            where: { product_id }
        });

        if (lastUnitPrice) {
            const lastQty = lastUnitPrice.qty.toNumber();
            const newQty = lastQty + qty;
            const newWeight = lastUnitPrice.weight.toNumber() + weight;

            return await this.db.unit_Prices.update({
                where: { product_id },
                data: {
                    qty: new Decimal(newQty).toDecimalPlaces(2),
                    weight: new Decimal(newWeight).toDecimalPlaces(2),
                }
            });
        }
        return null;
    }


    async getUnitPrice(product_id, product_code_id, store_id) {
        const { inventory_val_method: method = 1 } =
            (await this.db.stores.findUnique({
                where: { id: store_id },
                select: { inventory_val_method: true }
            })) ?? {};

        // Average Unit Price
        if (method == 1) {
            console.log('getAvgUnitPrice', product_id);
            let lastUnitPrice = await this.db.unit_Prices.findUnique({
                where: {
                    product_id: product_id,
                }
            });
            if (lastUnitPrice) {
                return lastUnitPrice.avg_price.toNumber();
            } else {
                return 0;
            }
        } 
        // Precise Unit Price
        else {
            if (product_code_id == null) {
                return 0; 
            }
            const lastRS = await this.db.report_Stocks.findFirst({
                where: {
                    product_code_id: product_code_id,
                    source_id: {
                        in: [1, 4, 5, 6] // dari purchase from customer
                    },
                    qty: {
                        gt: 0
                    }
                },
                orderBy:  { 
                    trans_date: 'desc' 
                },
            });
            console.log('lastRS', lastRS);
            return lastRS ? (lastRS.price.toNumber() / lastRS.weight.toNumber()) : 0;
        }
    }
}
