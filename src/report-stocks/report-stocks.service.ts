import { Injectable } from '@nestjs/common';
import { Report_Stocks } from '@prisma/client';
import { BaseService } from 'src/common/base.service';
import { DatabaseService } from 'src/database/database.service';
import { StockSourceService } from './stock-source.service';
import { ReportStockValidation } from './report-stocks.validation';
import { ValidationService } from 'src/common/validation.service';

@Injectable()
export class ReportStocksService extends BaseService<Report_Stocks> {
    constructor(
        db: DatabaseService,
        private readonly stockSourceService: StockSourceService,
        private readonly reportStockValidation: ReportStockValidation,
        private readonly validationService: ValidationService,
    ) {
        const relations = {
        }
        super('report_Stocks', db, relations);
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
                const mappedData = {
                    company_id: data.store.company_id,
                    company_code: data.store.company.code,
                    company_name: data.store.company.name,
                    store_id : data.store.id,
                    store_code : data.store.code,
                    store_name: data.store.name,
                    source_id: source.id,
                    source_code: source.code,
                    source_name : source.name,
                    trans_id : data.id,
                    trans_code: data.code,
                    trans_date: new Date(data.created_at),
                    category_id : prod.product_code.product.type.category.id,
                    category_code: prod.product_code.product.type.category.code,
                    category_name: prod.product_code.product.type.category.name,
                    type_id : prod.product_code.product.type.id,
                    type_code : prod.product_code.product.type.code,
                    type_name : prod.product_code.product.type.name,
                    product_id  : prod.product_code.product.id,
                    product_name : prod.product_code.product.name,
                    product_code_code : prod.product_code.barcode,
                    product_code_id : prod.product_code.id,
                    weight : parseFloat(prod.product_code.weight),
                    total_price  : parseFloat(prod.total_price),
                    price: parseFloat(prod.product_code.fixed_price),
                }
                stocksReports.push(mappedData);
            });

            const reportStocks = await this.db.report_Stocks.createMany({
                data: stocksReports
            });

            return reportStocks;

        } catch (error) {
            console.log('Error handle stock sold:' , error);
            throw new Error(`Error handle stock sold: ${error.message}`);
        }
    }

    async handleBuyStock(data: any) {
        const source = await this.stockSourceService.findOne(undefined, { code: 'INSTOCK' });
        const validData = await this.validationService.validate(this.reportStockValidation.CREATE, data);
        const MappedData = {
            company_id: validData.product.store.company.id,
            company_code: validData.product.store.company.code,
            company_name: validData.product.store.company.name,
            store_id: validData.product.store.id,
            store_code: validData.product.store.code,
            store_name: validData.product.store.name,
            source_id: source.id,
            source_code: source.code,
            source_name: source.name,
            trans_id: null,
            trans_date: validData.created_at,
            category_id: validData.product.type.category_id,
            category_code: validData.product.type.category.code,
            category_name: validData.product.type.category.name,
            type_id: validData.product.type.id,
            type_code: validData.product.type.code,
            type_name: validData.product.type.name,
            product_id: validData.product.id,
            product_name: validData.product.name,
            product_code_code: validData.barcode,
            product_code_id: validData.id,
            weight: validData.weight,
            price: validData.buy_price,
        }
        const result = await this.create(MappedData);
        return result;
    }
}
