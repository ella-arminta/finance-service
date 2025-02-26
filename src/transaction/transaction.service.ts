import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/base.service';
import { Trans } from '@prisma/client'
import { DatabaseService } from 'src/database/database.service';
import { TransTypeService } from 'src/trans-type/trans-type.service';
import { Prisma } from '@prisma/client';
import { filter } from 'rxjs';
import { ResponseDto } from 'src/common/response.dto';
import { TransAccountSettingsService } from 'src/trans-account-settings/trans-account-settings.service';
import { ReportStocksService } from 'src/report-stocks/report-stocks.service';

@Injectable()
export class TransactionService extends BaseService<Trans> {
  constructor(
    db: DatabaseService,
    private readonly reportStockService: ReportStocksService,
    private readonly transAccountSettingsServ: TransAccountSettingsService,
  ) {
    const relations = {
      trans_type: true,
      trans_details: {
        include: {
          account: true
        }
      },
      store: {
        include: {
          company: true
        }
      }
    }
    super('trans', db, relations, true);
  }

  async create(data: any) {
    try {
      const result = await this.db.$transaction(async (prisma) => {
        // Create the main transaction record
        var accounts = data.accounts;
        // all data but remove accounts
        var newtrans = { ...data };
        delete newtrans.accounts;
        // remove recurring_period 
        if ("recurring_period_code" in newtrans) {
          delete newtrans.recurring_period_code;
        }


        const trans = await this.db.trans.create({
          data: {
            ...newtrans,
            trans_details: {
              create: accounts.map(account => ({
                account_id: account.account_id,
                amount: account.amount,
                description: account.description,
                kas: account.kas
              })),
            },
          },
          include: this.relations
        });

        // If no errors occur, return the created transaction
        return trans;
      });

      // Return the result if everything goes well
      return result;
    } catch (error) {
      console.error('Error creating transaction:', error);
      // You can throw the error to the caller to handle it further
      throw new Error('Transaction creation failed');
    }
  }

  async createRecurring(data: any) {
    try {
      const result = await this.db.$transaction(async (prisma) => {
        // Create the main transaction record
        var accounts = data.accounts;
        // all data but remove accounts
        var newtrans = { ...data };
        delete newtrans.accounts;
        // TRANS START DATE
        newtrans.trans_start_date = newtrans.trans_date;
        delete newtrans.trans_date;
        delete newtrans.code;

        const trans = await this.db.trans_Recurring.create({
          data: {
            ...newtrans,
            trans_details_recurring: {
              create: accounts.map(account => ({
                account_id: account.account_id,
                amount: account.amount,
                description: account.description,
                kas: account.kas ?? false
              })),
            },
          },
          include: {
            trans_type: true,
            trans_details_recurring: true
          }
        });

        // If no errors occur, return the created transaction
        return trans;
      });

      // Return the result if everything goes well
      return result;
    } catch (error) {
      console.error('Error creating transaction:', error);
      // You can throw the error to the caller to handle it further
      throw new Error('Transaction creation failed');
    }
  }

  async update(id: any, data: any) {
    try {
      const result = await this.db.$transaction(async (prisma) => {
        // Update the main transaction record
        var accounts = data.accounts;
        // all data but remove accounts
        var updatedTrans = { ...data };
        delete updatedTrans.accounts;

        const trans = await this.db.trans.update({
          where: { id: id },
          data: {
            ...updatedTrans,
          }
        });
        // Update the transaction details
        if (accounts) {
          // delete all transaction details before
          const prevTransDetails = await this.db.trans_Details.deleteMany({
            where: {
              trans_id: id
            }
          });
          // then create new transaction details
          const transDetails = await this.db.trans_Details.createMany({
            data: accounts.map(account => ({
              trans_id: id,
              ...account
            })),
          });
        }
      });

      return result;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw new Error('Transaction update failed');
    }
  }


  async delete(id: any) {
    try {
      // delete trans_details with the id of the transaction
      const result = await this.db.$transaction(async (prisma) => {
        const transDetails = await this.db.trans_Details.updateMany({
          where: {
            trans_id: id
          },
          data: {
            deleted_at: new Date()
          }
        });
        // delete the transaction
        const trans = await this.db.trans.update({
          where: { id: id },
          data: {
            deleted_at: new Date(),
          }
        })
      });
      return result;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw new Error('Transaction deletion failed');
    }
  }

  async updateStatus(id: any, status: number) {
    const trans = await this.findOne(id);

    try {
      // Status == 1/approved -> insert report journals
      if (status == 1) {
        trans.trans_details.forEach(async (row) => {
          const data = {
            trans_id: trans.id,
            code: trans.code,
            company_id: trans.store.company.id,
            company_name: trans.store.company.name,
            store_id: trans.store_id,
            store_name: trans.store.name,
            trans_date: trans.trans_date,
            trans_type_id: trans.trans_type_id,
            trans_type_code: trans.trans_type.code,
            trans_type_name: trans.trans_type.name,
            description: trans.description,
            account_id: row.account_id,
            account_name: row.account.name,
            amount: row.amount,
            detail_description: row.description,
            cash_bank: row.kas,
          };
          const result = await this.db.report_Journals.create({
            data: {
              trans_id: trans.id,
              code: trans.code,
              company_id: trans.store.company.id,
              company_name: trans.store.company.name,
              store_id: trans.store_id,
              store_name: trans.store.name,
              trans_date: trans.trans_date,
              trans_type_id: trans.trans_type_id,
              trans_type_code: trans.trans_type.code,
              trans_type_name: trans.trans_type.name,
              description: trans.description,
              account_id: row.account_id,
              account_name: row.account.name,
              account_code: row.account.code,
              amount: row.amount,
              detail_description: row.description,
              cash_bank: row.kas,
            }
          });

        });
      }
      // Status == 0/ rejected -> deleted from  report journals
      else if (status == 0) {
        // Delete from report journals
        const result = await this.db.report_Journals.deleteMany({
          where: {
            trans_id: trans.id,
          }
        });
      }

    } catch (error) {
      return ResponseDto.error('Error updating transaction status', null);
    }

    // Update trans
    const updatedTrans = await this.update(id, { approve: status });

    return updatedTrans;
  }

  async countThisMonthTransaction(store_id: string, year: number, month: number, trans_type_id: number) {
    const count = await this.db.trans.count({
      where: {
        store_id: store_id,
        trans_date: {
          gte: new Date(year, month - 1, 1), // First day of the month
          lt: new Date(year, month, 1),      // First day of the next month
        },
        trans_type_id: trans_type_id
      },
    });
    return count;
  }

  async getTransCode(transType, store_id: string) {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const Store = await this.db.stores.findFirst({
      where: { id: store_id },
    });
    // last transaction code
    const lastTrans = await this.db.trans.findFirst({
      where: {
        store_id: store_id,
        created_at: {
          gte: new Date(year, month - 1, 1), // First day of the month
          lt: new Date(year, month, 1),      // First day of the next month
        },
        trans_type_id: transType.id
      },
      orderBy: [
        { code: 'desc' },
        { created_at: 'desc' }
      ]
    })
    // get the last index of the transaction code
    var indexTransaction = 1;
    if (lastTrans) {
      const lastTransCode = lastTrans.code;
      indexTransaction = parseInt(lastTransCode.split('/').pop()) + 1;
    }
    var transactionCode = transType.code + '/' + Store.code.toUpperCase() + '/' + year.toString().slice(-2) + month.toString().padStart(2, '0') + '/' + indexTransaction.toString().padStart(5, '0');
    return transactionCode;
  }

  async getReportUangKeluarMasuk(filters: any) {
    try {
      let query = Prisma.sql`
        SELECT 
          t.id as id,
          t.code as code, 
          t.trans_date as trans_date, 
          a.name as account_name, 
          ABS(t.total) as total, 
          t.description as description, 
          t.approve as approve,
          t.created_by as created_by,
          td.kas
        FROM "Trans" t
        JOIN "Trans_Details" td ON t.id = td.trans_id
        JOIN "Accounts" a ON td.account_id = a.id
        WHERE td.kas = true
      `;

      if (filters.account_id && filters.account_od !== '') {
        query = Prisma.sql`${query} AND td.account_id = ${filters.account_id}::uuid`;
      }
      if (filters.trans_type_id && filters.trans_type_id !== '') {
        query = Prisma.sql`${query} AND t.trans_type_id = ${filters.trans_type_id}`;
      }
      if (filters.start_date) {
        // Directly pass the formatted date as a string
        query = Prisma.sql`${query} AND t.trans_date >= ${filters.start_date}::date`;
      }
      if (filters.end_date) {
        // Directly pass the formatted date as a string
        query = Prisma.sql`${query} AND t.trans_date <= ${filters.end_date}::date`;
      }

      if (filters.auth && filters.auth.store_id) {
        query = Prisma.sql`${query} AND t.store_id = ${filters.auth.store_id}::uuid`;
      }

      query = Prisma.sql`${query} AND t.deleted_at IS NULL`;

      const result = await this.db.$queryRaw(query);

      return result;
    } catch (error) {
      console.error('Error fetching report:', error);
      throw error;
    }
  }


  async createSales(data: any) {
    const transType = await this.db.trans_Type.findUnique({ where: { code: 'SAL' } });
    const hasTax = true // TODOELLA: Check if the store has tax
    const store = await this.db.stores.findUnique({ where: { id: data.store_id }, include: { company: true } });
    var diskonTotal = 0;
    var salesEmasTotal = 0;
    data.store = store;
    var transDetailsFormated = [];

    // REFORMAT TRANSACTION DETAIL
    // Kas / Piutang Usaha     (D)  9.990  
    // Diskon Penjualan        (D)  1.000  
    // Pendapatan                         (K) 10.000  (gk termasuk diskon)
    // Hutang Pajak Penjualan             (K)    990  

    // JOURNAL ENTRY (KREDIT)
    // Tax yg dibayar customer
    if (hasTax) {
      const taxAccount = await this.transAccountSettingsServ.getTaxAccount(data);

      transDetailsFormated.push({
        account_id: taxAccount.account_id,
        account_name: taxAccount.account.name,
        amount: Math.abs(data.tax_price) * -1,
        detail_description: 'Pajak Penjualan',
        cash_bank: false,
        account_code: taxAccount.account.code
      })
    }
    // Details / Journal Entry
    // Sales Operation
    data.transaction_operations.forEach(det => {
      transDetailsFormated.push({
        account_id: det.operation.account_id,
        account_name: det.operation.account.name,
        amount: Math.abs(det.total_price) * -1,
        detail_description: det.name,
        cash_bank: false,
        account_code: det.operation.account.code
      })
    })
    // Sales Emas 
    data.transaction_products.forEach(det => {
      salesEmasTotal += (Math.abs(det.total_price) + Math.abs(det.discount)) * -1;
      diskonTotal += Math.abs(det.discount);
    })

    // Journal entry sales emas
    const goldSalesAccount = await this.transAccountSettingsServ.getGoldSalesAccount(data);
    transDetailsFormated.push({
      account_id: goldSalesAccount.account_id,
      account_name: goldSalesAccount.account.name,
      amount: salesEmasTotal,
      detail_description: 'Penjualan Emas',
      cash_bank: false,
      account_code: goldSalesAccount.account.code
    })

    // JOURNAL ENTRY (DEBIT)
    // Diskon Penjualan
    const discountAccount = await this.transAccountSettingsServ.getDiscountAccount(data);
    if (diskonTotal > 0) {
      transDetailsFormated.push({
        account_id: discountAccount.account_id,
        account_name: discountAccount.account.name,
        amount: diskonTotal,
        detail_description: 'Diskon penjualan',
        cash_bank: true,
        account_code: discountAccount.account.code
      })
    }
    // PIUTANG
    if (data.status == 0) { // draft / pending
      const piutangAccount = await this.transAccountSettingsServ.getPiutangAccount(data);
      transDetailsFormated.push({
        account_id: piutangAccount.account_id,
        account_name: piutangAccount.account.name,
        amount: data.total_price, // TODOELLA : Check if this is correct
        description: 'Piutang Usaha',
        cash_bank: true,
        account_code: piutangAccount.account.code
      })
    }
    // status: paid / done
    else {
      // payment_method   Int // 1: Cash, 2: Bank Transfer, 3: Credit Card, 4: Debit Card
      const PaymentMethodAccount = await this.transAccountSettingsServ.getPaymentMethodAccount(data);
      transDetailsFormated.push({
        account_id: PaymentMethodAccount.account_id,
        account_name: PaymentMethodAccount.account.name,
        amount: data.total_price,  // (sub_price - diskon_price + tax_price)
        description: 'Pembayaran ' + data.payment_method,
        cash_bank: true,
        account_code: PaymentMethodAccount.account.code
      })
    }

    // CREATE TRANSACTION
    var reportJournal;
    var reportStock;
    try {
      await this.db.$transaction(async (prisma) => {
        // Insert report journal entries
        reportJournal = await prisma.report_Journals.createMany({
          data: transDetailsFormated.map(row => ({
            trans_id: data.id,
            code: data.code,
            company_id: store.company_id,
            company_name: store.company.name,
            company_code: store.company.code,
            store_id: store.id,
            store_name: store.name,
            store_code: store.code,
            trans_date: data.created_at,
            trans_type_id: transType.id, // SALES
            trans_type_code: transType.code,
            trans_type_name: transType.name,
            description: data.description,
            account_id: row.account_id,
            account_name: row.account_name,
            account_code: row.account_code,
            amount: row.amount,
            detail_description: row.detail_description,
            cash_bank: row.cash_bank,
          })),
        });

        // Call handleSoldStock inside the transaction
        reportStock = await this.reportStockService.handleSoldStock(data);
      });
    } catch (error) {
      console.error('Error creating sales transaction:', error);
      throw new Error(`Error creating sales transaction: ${error.message}`);
    }

    return reportJournal;
  }

  // BUY PRODUCT
  async buyProduct(data: any) {
    // Persediaan Barang Dagang    (D) Rp10.000.000  
    // PPN Masukan                 (D) Rp1.000.000  
    //       Kas/Bank/Utang Dagang            (K) Rp11.000.000  
  
    // console.log('buyProduct',data);
    // buyProduct {
    //   id: '0c5fd3ec-50fc-4f6d-b311-2f403d009a9d',
    //   barcode: 'CHER0010100010009',
    //   product_id: '87958f93-183e-44af-bd5c-51ad8baa4391',
    //   weight: '12',
    //   fixed_price: '100000',
    //   status: 0,
    //   taken_out_at: null,
    //   buy_price: '100000',
    //   tax_purchase: '13000',
    //   created_at: '2025-02-23T13:19:20.806Z',
    //   updated_at: '2025-02-23T13:19:20.806Z',
    //   deleted_at: null,
    //   product: {
    //     id: '87958f93-183e-44af-bd5c-51ad8baa4391',
    //     code: 'CHER001010001',
    //     name: 'Gelang Hello Kitty Biru',
    //     description: 'kjh',
    //     images: [ 'uploads\\product\\9ff93394-482a-4586-8c56-af9c9bea7bb5.png' ],
    //     status: 1,
    //     type_id: 'd69d62c7-5a16-4b8d-9aab-081055ea1c34',
    //     store_id: 'e344156f-49d6-4179-87b9-03d22cc18ebf',
    //     created_at: '2025-02-19T08:35:31.340Z',
    //     updated_at: '2025-02-19T08:35:31.340Z',
    //     deleted_at: null,
    //     type: {
    //       id: 'd69d62c7-5a16-4b8d-9aab-081055ea1c34',
    //       code: 'CHER00101',
    //       name: 'Hello Kitty',
    //       description: 'gelang hello kitty',
    //       category_id: 'de069412-d0da-4518-8a6d-e1368d2076d4',
    //       created_at: '2025-02-19T08:33:06.933Z',
    //       updated_at: '2025-02-19T08:33:06.933Z',
    //       deleted_at: null,
    //       category: [Object]
    //     }
    //   }
    // }
    const store = await this.db.stores.findFirst({
      where: {
        id: data.product.store_id
      },
      include: { company: true }
    });
    const transType = await this.db.trans_Type.findUnique({ where: { code: 'PURSUP' } });
    var transDetailsFormated = [];
    const inventoryAccount = await this.transAccountSettingsServ.getInventoryAccount(data);
    transDetailsFormated.push({
      account_id: inventoryAccount.account_id,
      account_name: inventoryAccount.account.name,
      amount: Math.abs(parseFloat(data.buy_price)),
      detail_description: 'Persediaan Barang Dagang',
      cash_bank: false,
      account_code: inventoryAccount.account.code
    })
    const taxAccount = await this.transAccountSettingsServ.getTaxAccount(data);
    transDetailsFormated.push({
      account_id: taxAccount.account_id,
      account_name: taxAccount.account.name,
      amount: Math.abs(parseFloat(data.tax_purchase)),
      detail_description: 'PPN Masukan',
      cash_bank: false,
      account_code: taxAccount.account.code
    })
    const kasBankAccount = await this.db.accounts.findFirst({
      where: {
        id: data.account_id
      }
    })
    transDetailsFormated.push({
      account_id: kasBankAccount.id,
      account_name: kasBankAccount.name,
      amount: (Math.abs(parseFloat(data.tax_purchase)) + Math.abs(parseFloat(data.buy_price))) * -1,
      detail_description: 'Pembelian ' + data.product.name,
      cash_bank: true,
      account_code: kasBankAccount.code
    })

    const generatedCode = await this.getTransCode(transType, data.store_id);

    // CREATE TRANSACTION
    var reportJournal;
    var stockIn;
    try {
      await this.db.$transaction(async (prisma) => {
        // Insert report journal entries
        reportJournal = await prisma.report_Journals.createMany({
          data: transDetailsFormated.map(row => ({
            trans_id: null,
            code: generatedCode,
            company_id: store.company_id,
            company_name: store.company.name,
            company_code: store.company.code,
            store_id: store.id,
            store_name: store.name,
            store_code: store.code,
            trans_date: data.created_at,
            trans_type_id: transType.id,
            trans_type_code: transType.code,
            trans_type_name: transType.name,
            description: 'Pembelian ' + data.product.name,
            account_id: row.account_id,
            account_name: row.account_name,
            account_code: row.account_code,
            amount: row.amount,
            detail_description: row.detail_description,
            cash_bank: row.cash_bank,
          })),
        });
        // Signal Stock In 
        stockIn = await this.reportStockService.handleBuyStock(data);
      });
    } catch (error) {
      console.error('Error creating sales transaction:', error);
      throw new Error(`Error creating sales transaction: ${error.message}`);
    }
    
    return reportJournal;
  }

  async cancelBuyProduct(data) {

  }
}
