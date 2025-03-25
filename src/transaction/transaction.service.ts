import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/base.service';
import { Trans } from '@prisma/client'
import { DatabaseService } from 'src/database/database.service';
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
    var hppTotal = 0;
    data.store = store;
    var transDetailsFormated = [];

    // REFORMAT TRANSACTION DETAIL
    // Kas / Piutang Usaha     (D)  9.990  
    // Diskon Penjualan        (D)  1.000  
    // Pendapatan                         (K) 10.000  (gk termasuk diskon)
    // Hutang Pajak Penjualan             (K)    990  
    // PERSEDIAAN JURNAL TODOELLA crosscheck
    // Harga Pokok Penjualan   (D)  2.000        
    // Persediaan                         (K)  2.000

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
      // {
      //   id: 'f30f5ccc-5f7f-4fe5-aa08-f4233ac80f4f',
      //   transaction_id: 'a9fde691-221b-47a7-aed1-7acfe0423354',
      //   product_code_id: 'c9172e6c-be97-4e3e-a4ac-c1d25fc7b62f',
      //   transaction_type: 1,
      //   name: 'AA0020100040001 - Putih',
      //   type: 'AA00201 - Gelang',
      //   weight: '12',
      //   price: '5000',
      //   adjustment_price: '0',
      //   discount: '0',
      //   total_price: '60000',
      //   status: 1,
      //   comment: null,
      //   created_at: '2025-03-24T01:10:02.621Z',
      //   updated_at: '2025-03-24T01:10:02.621Z',
      //   deleted_at: null,
      //   product_code: {
      //     id: 'c9172e6c-be97-4e3e-a4ac-c1d25fc7b62f',
      //     barcode: 'AA0020100040001',
      //     product_id: '38043fba-3b36-43d7-a7c9-0e6317916868',
      //     weight: '12',
      //     fixed_price: '5000',
      //     status: 1,
      //     taken_out_at: null,
      //     created_at: '2025-03-18T06:49:50.661Z',
      //     updated_at: '2025-03-24T01:10:02.649Z',
      //     deleted_at: null,
      //     product: [Object]
      //   },
      salesEmasTotal += (Math.abs(det.total_price) + Math.abs(det.discount)) * -1;
      diskonTotal += Math.abs(det.discount);
      console.log('biy price',det.product_code.buy_price);
      hppTotal += Math.abs(det.product_code.buy_price);
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

    // Journal entry persediaan
    // Hpp (debit)
    const hppAccount = await this.transAccountSettingsServ.getDefaultAccount(
      'cogs', store.id, store.company_id, `Harga Pokok Penjualan ${store.name}`, 2, 'Default Akun HPP'
    )
    transDetailsFormated.push({
      account_id: hppAccount.account_id,
      account_name: hppAccount.account.name,
      amount: hppTotal,
      detail_description: 'Harga Pokok Penjualan',
      cash_bank: false,
      account_code: hppAccount.account.code
    })
    // persediaan (kredit)
    const inventoryAccount = await this.transAccountSettingsServ.getDefaultAccount(
      'persediaan', store.id, store.company_id, `Default akun persediaan ${store.name}`, 1, 'Default Akun Persediaan'
    )
    transDetailsFormated.push({
      account_id: inventoryAccount.account_id,
      account_name: inventoryAccount.account.name,
      amount: hppTotal * -1,
      detail_description: 'Persediaan Barang Dagang',
      cash_bank: false,
      account_code: inventoryAccount.account.code
    })

    // Journal Entry PIUTANG
    if (data.status == 0) { // draft / pending
      const piutangAccount = await this.transAccountSettingsServ.getPiutangAccount(data);
      transDetailsFormated.push({
        account_id: piutangAccount.account_id,
        account_name: piutangAccount.account.name,
        amount: data.total_price, // TODOELLA : Check if this is correct
        detail_description: 'Piutang Usaha',
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
    // Persediaan Barang Dagang    (D)
    const inventoryAccount = await this.transAccountSettingsServ.getInventoryAccount(data);
    transDetailsFormated.push({
      account_id: inventoryAccount.account_id,
      account_name: inventoryAccount.account.name,
      amount: Math.abs(parseFloat(data.buy_price)),
      detail_description: 'Persediaan Barang Dagang',
      cash_bank: false,
      account_code: inventoryAccount.account.code
    })
    // PPN Masukan                 (D)
    const taxAccount = await this.transAccountSettingsServ.getTaxAccount(data);
    transDetailsFormated.push({
      account_id: taxAccount.account_id,
      account_name: taxAccount.account.name,
      amount: Math.abs(parseFloat(data.tax_purchase)),
      detail_description: 'PPN Masukan',
      cash_bank: false,
      account_code: taxAccount.account.code
    })
    // Kas/Bank/Utang Dagang            (K)
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
            trans_id: data.id,
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

  async handleStockOut(data: any) {
    // handlestockout data {
    //     productCode: {
    //       id: '4e5df22e-9616-499d-a78e-322090cc944e',
    //       barcode: 'AA0010100020001',
    //       product_id: 'f983f7dd-4efe-4b14-a1a0-e7e3aa6b9cad',
    //       weight: '10',
    //       fixed_price: '100000',
    //       status: 0,
    //       taken_out_at: null,
    //       buy_price: '120000',
    //       tax_purchase: '13200',
    //       image: '',
    //       account_id: 'f609be50-160a-4edd-b3ac-755ab5c5739a',
    //       created_at: '2025-03-18T01:26:15.638Z',
    //       updated_at: '2025-03-18T01:26:15.638Z',
    //       deleted_at: null,
    //       product: {
    //         id: 'f983f7dd-4efe-4b14-a1a0-e7e3aa6b9cad',
    //         code: 'AA001010002',
    //         name: 'PRODUCT BAR',
    //         description: 'asd',
    //         images: [Array],
    //         status: 1,
    //         tags: [],
    //         type_id: '81b1af2f-9a6a-41c0-806c-012fd002310f',
    //         store_id: '8dedffbb-f267-490a-9feb-e1547b01fcda',
    //         created_at: '2025-03-18T01:25:39.801Z',
    //         updated_at: '2025-03-18T01:25:39.801Z',
    //         deleted_at: null,
    //         type: [Object],
    //         store: [Object]
    //       }
    //     },
    //     reason: 2,
    //     trans_date: 2025-03-18T01:26:15.638Z
    //   }
    // Persediaan dalam Perbaikan    Rp 1.000.000  
    //     Cr. Persediaan Barang Dagangan      Rp 1.000.000    
    const reasonDict = { 0: 'none', 1: 'repair', 2: 'lost', 3: 'other' };
    const { reason, productCode, trans_date } = data;
    const store = productCode.product.store;
    
    if (reason === 0) return ResponseDto.success('No action needed.', null, 200);
    
    var transType = await this.db.trans_Type.findUnique({ where: { code: 'KD' } });
    const transCode = await this.getTransCode(transType, store.id);
    const reasonText = reasonDict[reason];

    const inventoryAccount = await this.transAccountSettingsServ.getDefaultAccount(
        'persediaan', store.id, store.company_id, `Persediaan ${store.name}`, 1, 'Default Akun Persediaan'
    );

    const accountMap = {
        1: await this.transAccountSettingsServ.getDefaultAccount(
            'repair', store.id, store.company_id, `Persediaan dalam Perbaikan ${store.name}`, 1, 'Default Akun Perbaikan'
        ),
        2: await this.transAccountSettingsServ.getDefaultAccount(
            'lost', store.id, store.company_id, `Beban Persediaan Hilang${store.name}`, 2, 'Default Akun Kerugian'
        ),
        3: await this.transAccountSettingsServ.getDefaultAccount(
            'other', store.id, store.company_id, `Beban Persediaan Hilang ${store.name}`, 2, 'Default Akun Beban hilang lain'
        )
    };

    const selectedAccount = accountMap[reason];
    const amount = Math.abs(parseFloat(productCode.buy_price));

    try {
        await this.db.$transaction(async (prisma) => {
            const reportJournalDebit =  await prisma.report_Journals.create({
                data: 
                    { 
                      trans_id: productCode.id, 
                      code: transCode, 
                      store_id: store.id, 
                      trans_date, 
                      trans_type_id: transType.id, 
                      description: `Barang Keluar ${reasonText}`, 
                      account_id: selectedAccount.account_id, 
                      amount, 
                      detail_description: `${selectedAccount.account.name} ${store.name}`, 
                      cash_bank: true 
                    },
            });
            console.log('reportJournalDebit',reportJournalDebit);
            const reportJournalKredit = await prisma.report_Journals.create({
                data: { 
                  trans_id: productCode.id, 
                  code: transCode, 
                  store_id: store.id, 
                  trans_date,
                  trans_type_id: transType.id, 
                  description: `Barang Keluar ${reasonText}`, 
                  account_id: inventoryAccount.account_id, 
                  amount: amount * -1, 
                  detail_description: `Persediaan ${store.name}`, 
                  cash_bank: false 
                }
            });
            console.log('reportJournalKredit',reportJournalKredit);

            data.trans_id = productCode.id;
            await this.reportStockService.handleStockOut(data);
        });

        return ResponseDto.success('Stocks out handled!', null, 200);
    } catch (error) {
        console.error('Error creating stock out:', error);
        throw new Error(`Error creating stock out: ${error.message}`);
    }
  }


  async handleUnstockOut(data: any) {
    try {
      await this.db.$transaction(async (prisma) => {
        console.log('ini product_code_id', data.productCode.id);
        // delete from report journals
        const delReportJournals = await this.db.report_Journals.deleteMany({
          where: {
            trans_id: data.productCode.id,
            trans_type_id: 6
          }
        });

        // taken out reason // 0: none, 1: repair, 2: lost, 3: taken out by the owner
        // delete from report stock
        const stockOut = await this.db.report_Stocks.deleteMany({
          where: {
            product_code_id: data.productCode.id,
            source_id:data.productCode.taken_out_reason == 1 ? 6 : 2
          }
        });
        console.log('stockout report stock',stockOut);
      });
    } catch (error) {
      console.error('Error unstock out:', error);
      throw new Error(`Error unstock out: ${error.message}`);
    }

    return ResponseDto.success('Unstocks out handled!', null, 200);
  }

  async handleStockRepaired(data: any) {
    console.log('data repaired', data);
    const {productCode, trans_date, account_id, weight, expense } = data;
    console.log(productCode, trans_date, account_id, weight, expense);
    // data repaired {
    //   productCode: {
    //     id: '311d1827-5ff4-447c-9a9e-dd689471fc27',
    //     barcode: 'AA0010100030001',
    //     product_id: '436446a4-be6d-406b-bb15-50a7a09eff47',
    //     weight: '1',
    //     fixed_price: '100000',
    //     status: 3,
    //     taken_out_at: '2025-03-18T00:00:00.000Z',
    //     taken_out_reason: 1,
    //     taken_out_by: 'd643abb7-2944-4412-8bb5-5475679f5ade',
    //     buy_price: '120000',
    //     tax_purchase: '13200',
    //     image: 'uploads\\product\\7af0061b-6928-4b22-9fa1-c33362d55a49.png',
    //     account_id: 'f609be50-160a-4edd-b3ac-755ab5c5739a',
    //     created_at: '2025-03-18T06:43:46.930Z',
    //     updated_at: '2025-03-18T13:09:51.444Z',
    //     deleted_at: null,
    //     product: {
    //       id: '436446a4-be6d-406b-bb15-50a7a09eff47',
    //       code: 'AA001010003',
    //       name: 'BUBU',
    //       description: 'asdf',
    //       images: [Array],
    //       status: 1,
    //       tags: [],
    //       type_id: '81b1af2f-9a6a-41c0-806c-012fd002310f',
    //       store_id: '8dedffbb-f267-490a-9feb-e1547b01fcda',
    //       created_at: '2025-03-18T06:42:33.941Z',
    //       updated_at: '2025-03-18T06:42:33.941Z',
    //       deleted_at: null,
    //       type: [Object],
    //       store: [Object]
    //     }
    //   },
    //   trans_date: '2025-03-18T15:48:16.154Z',
    //   account_id: [ 'f609be50-160a-4edd-b3ac-755ab5c5739a' ]
    // }
    const transType = await this.db.trans_Type.findUnique({ where: { code: 'MD' } });
    const transCode = await this.getTransCode(transType, productCode.product.store_id);

    // Expense Perbaikan
    // Beban Perbaikan (Debit)   xxx  
    //   Kas/Utang (Kredit)      xxx  
    const repairExpenseAccount = await this.transAccountSettingsServ.getDefaultAccount(
      'repairCost', productCode.product.store_id, productCode.product.store.company_id, 'BIAYA PERBAIKAN', 2, 'Default Akun Biaya Perbaikan'
    );
    const kasAccount = await this.db.accounts.findFirst({
      where: {
        id: account_id[0]
      }
    });
    const amountExpense = Math.abs(parseFloat(expense));

    // Persediaan Barang
    // Persediaan Barang (Debit)                                            xxx  (nilai setelah perbaikan)  
    // Kerugian Penyusutan Emas (Debit)  / penyesuaian persediaan (kredit)         xxx  (nilai emas yang hilang)  
    //   Persediaan dalam Perbaikan (Kredit)                                        xxx  (nilai sebelum perbaikan)  
    const inventoryAccount = await this.transAccountSettingsServ.getInventoryAccount(productCode);
    const repairDeprecAccount = await this.transAccountSettingsServ.getDefaultAccount(
      'repairDeprec', productCode.product.store_id, productCode.product.store.company_id, 'Kerugian Penyusutan Emas akibat reparasi', 1, 'Default Akun Kerugian Penyusutan Emas akibat reparaasi'
    )
    const repairInventoryAccount = await this.transAccountSettingsServ.getDefaultAccount(
      'repair', productCode.product.store_id, productCode.product.store.company_id, 'Persediaan dalam Perbaikan', 1, 'Default Akun Persediaan dalam Perbaikan'
    );
    const stockAdjAccount = await this.transAccountSettingsServ.getDefaultAccount(
      'stockAdj', productCode.product.store_id, productCode.product.store.company_id, 'Penyesuaian Persediaan', 1, 'Default Akun Penyesuaian Stock emas'
    );
    // Perhitungan persediaan : 
    // persediaan barang (debit) = harga beli akhir
    const beratAwal = parseFloat(productCode.weight);
    const hargaBeliAwal = parseFloat(productCode.buy_price);
    const beratAkhir = parseFloat(weight);
    const hargaPerGram = hargaBeliAwal / beratAwal;
    const hargaBeliAkhir = hargaPerGram * beratAkhir;
    const selisihBerat = beratAwal - beratAkhir;
    const kerugianPenyusutanEmas = selisihBerat > 0 ? hargaPerGram * selisihBerat : 0;
    const penyesuaianPersediaan = selisihBerat < 0 ? hargaPerGram * Math.abs(selisihBerat) : 0;

    await this.db.$transaction(async (prisma) => {
      const reportJournalExpense = await prisma.report_Journals.createMany({
        data: [
          // Beban Perbaikan (Debit)
          { 
            trans_id: productCode.id, 
            code: transCode, 
            store_id: productCode.product.store_id, 
            trans_date,
            trans_type_id: transType.id, 
            description: `Beban Perbaikan`, 
            account_id: repairExpenseAccount.account_id, 
            amount: amountExpense, 
            detail_description: `Beban Perbaikan ${productCode.product.store.name}`, 
            cash_bank: true 
          },
          // Kas Utang (Kredit)
          {
            trans_id: productCode.id,
            code: transCode,
            store_id: productCode.product.store_id,
            trans_date, 
            trans_type_id: transType.id,
            description: 'Pembayaran biaya perbaikain',
            account_id: kasAccount.id,
            amount: amountExpense * -1,
            detail_description: 'Pembayaran biaya perbaikan',
            cash_bank: false
          },
          // Persediaan Barang (Debit)   
          {
            trans_id: productCode.id,
            code: transCode,
            store_id: productCode.product.store_id,
            trans_date,
            trans_type_id: transType.id,
            description: `Masuk persediaan stok habis diperbaiki`,
            account_id: inventoryAccount.account_id,
            amount: Math.abs(hargaBeliAkhir),
            detail_description: 'Masuk persediaan stok habis diperbaiki',
            cash_bank: false
          },
           // Kerugian Penyusutan Emas (Debit) / Penyesuaian Persediaan (Kredit)
        ...(kerugianPenyusutanEmas != 0 || penyesuaianPersediaan != 0
          ? [{
              trans_id: productCode.id,
              code: transCode,
              store_id: productCode.product.store_id,
              trans_date,
              trans_type_id: transType.id,
              description: 'Penyesuaian Persediaan akibat reparasi',
              account_id: kerugianPenyusutanEmas !== 0 
                ? repairDeprecAccount.account_id 
                : stockAdjAccount.account_id,
              amount: kerugianPenyusutanEmas !== 0 
                ? Math.abs(kerugianPenyusutanEmas) 
                : Math.abs(penyesuaianPersediaan) * -1,
              detail_description: kerugianPenyusutanEmas !== 0 
                ? 'Kerugian Penyusutan Emas akibat reparasi' 
                : 'Penyesuaian Persediaan akibat reparasi',
              cash_bank: false
            }]
          : []),
          // Persediaan dalam Perbaikan (Kredit)
          {
            trans_id: productCode.id,
            code: transCode,
            store_id: productCode.product.store_id,
            trans_date,
            trans_type_id: transType.id,
            description: 'Persediaan dalam perbaikan dikeluarkan, barang telah direparasi',
            account_id: repairInventoryAccount.account_id,
            amount: Math.abs(hargaBeliAwal) * -1,
            detail_description: 'Persediaan dalam perbaikan dikeluarkan, barang telah direparasi',
            cash_bank: false
          }
        ]
      });
      // Stock In Repaired
      data.trans_id = productCode.id;
      data.productCode.buy_price = hargaBeliAkhir;  // Update buy price
      const reportStocks = await this.reportStockService.handleStockInRepaired(data);
    });

    return ResponseDto.success('Stocks repaired handled!', null, 200);
  }

  async handleStockOpnameApproved(data: any) {
    console.log('data', data);
       // this is stock not scanned [
    //   {
    //     id: 'c9172e6c-be97-4e3e-a4ac-c1d25fc7b62f',
    //     barcode: 'AA0020100040001',
    //     product_id: '38043fba-3b36-43d7-a7c9-0e6317916868',
    //     weight: 12,
    //     fixed_price: 5000,
    //     status: 0,
    //     taken_out_at: null,
    //     taken_out_reason: 0,
    //     taken_out_by: null,
    //     buy_price: 400000,
    //     tax_purchase: 44000,
    //     image: 'uploads\\product\\88813eb4-bfd2-4b7b-b555-d461a986b13b.png',
    //     account_id: 'f609be50-160a-4edd-b3ac-755ab5c5739a',
    //     created_at: 2025-03-18T06:49:50.612Z,
    //     updated_at: 2025-03-18T06:49:50.612Z,
    //     deleted_at: null,
    //     product: {
    //       id: '38043fba-3b36-43d7-a7c9-0e6317916868',
    //       code: 'AA002010004',
    //       name: 'Putih',
    //       description: 'asdf',
    //       images: [Array],
    //       status: 1,
    //       tags: [],
    //       type_id: '19d5aba0-b8ff-4091-b0a8-a34d837a653a',
    //       store_id: '8dedffbb-f267-490a-9feb-e1547b01fcda',
    //       created_at: 2025-03-18T06:49:01.709Z,
    //       updated_at: 2025-03-18T06:49:01.709Z,
    //       deleted_at: null,
    //       type: [Object]
    //     }
    //   }
    // ]
    // Lost Stocks 
    const stockNotScanned = data.stockNotScanned;
    const store_id = stockNotScanned[0].product.store_id;
    const company_id = stockNotScanned[0].product.store.company_id;
    const reason = 'lost';
    const transType = await this.db.trans_Type.findUnique({ where: { code: 'KD' } });
    const transCode = await this.getTransCode(transType, stockNotScanned[0].product.store_id);
    const lostAccount = await this.transAccountSettingsServ
        .getDefaultAccount(
          reason,
          store_id,
          company_id,
          'Beban Kerugian Barang Hilang ' + stockNotScanned[0].product.store.name,
          2,
          'Default Akun Beban Kerugian barang hilang cabang',
        )
    const inventoryAccount = await this.transAccountSettingsServ.getDefaultAccount(
          'persediaan',
          store_id,
          company_id,
          'Persediaan ' + stockNotScanned[0].product.store.name,
          1,
          'Default Akun Persediaan barang cabang',
        )

    for (var productCode of stockNotScanned) {
      // Dr. Beban Kerugian Barang Hilang    Rp 1.000.000  
      //     Cr. Persediaan Barang Dagangan      Rp 1.000.000    
      try {
        await this.db.$transaction(async (prisma) => {
          if (!data.id) {
            throw new Error('ID Stock Opname must exist')
          }
          // Debit
          console.log('ini data.id', data.id);
          var reportJournals = await this.db.report_Journals.create({
            data: {
              trans_id: data.id,
              code: transCode,
              store_id: productCode.product.store_id,
              trans_date: data.trans_date,
              trans_type_id: transType.id,
              description: `Barang Keluar ${reason} setelah opname stock tgl. ${new Date(data.trans_date).toLocaleDateString('id-ID')}`,
              account_id: lostAccount.account_id,
              amount: Math.abs(parseFloat(productCode.buy_price)),
              detail_description: 'Beban Kerugian Barang Hilang ' + productCode.product.store.name,
              cash_bank: true
            }
          })
          // Credit
          var reportJournals = await this.db.report_Journals.create({
            data: {
              trans_id: data.id,
              code: transCode,
              store_id: productCode.product.store_id,
              trans_date: data.trans_date,
              trans_type_id: transType.id,
              description: `Barang Keluar ${reason} setelah opname stock tgl. ${new Date(data.trans_date).toLocaleDateString('id-ID')}`,
              account_id: inventoryAccount.account_id,
              amount: Math.abs(parseFloat(productCode.buy_price)) * -1,
              detail_description: 'Persediaan Barang Dagang ' + productCode.product.store.name,
              cash_bank: false
            }
          })

          // Report Stock
          data.trans_id = data.id;
          data.productCode = productCode;
          var stockOut = await this.reportStockService.handleStockOut(data);
        });
      } catch (error) {
        console.error('Error creating stock out:', error);
        throw new Error(`Error creating stock out: ${error.message}`);
      }
    }

    return ResponseDto.success('Stocks loss during opname handled!', null, 200);
  }

  async handleStockOpnameDisapproved(data: any) {
    // console.log(data);
    // {
    //   stockNotScanned: [
    //     {
    //       id: '82db2d45-857b-4545-bede-8930da2c2064',
    //       barcode: 'AA0020100040004',
    //       product_id: '38043fba-3b36-43d7-a7c9-0e6317916868',
    //       weight: '10',
    //       fixed_price: '5000',
    //       status: 1,
    //       taken_out_at: null,
    //       taken_out_reason: 0,
    //       taken_out_by: null,
    //       buy_price: '120000',
    //       tax_purchase: '13200',
    //       image: 'uploads\\product\\7fa3336d-7277-4c5e-85a7-84ef2ef968eb.png',
    //       account_id: 'f609be50-160a-4edd-b3ac-755ab5c5739a',
    //       created_at: '2025-03-24T08:15:02.575Z',
    //       updated_at: '2025-03-24T08:15:47.257Z',
    //       deleted_at: null,
    //       product: [Object]
    //     }
    //   ]
    // }
    const { stockNotScanned, id} = data;
    const transType = await this.db.trans_Type.findUnique({ where: { code: 'KD' } });
    // setelah opname stock tgl

    console.log('stocknotscanned handledisapproved', stockNotScanned);
    for (var productCode of stockNotScanned) {
      // Dr. Beban Kerugian Barang Hilang    Rp 1.000.000  
      //     Cr. Persediaan Barang Dagangan      Rp 1.000.000    
      try {
        await this.db.$transaction(async (prisma) => {
          if (!productCode?.id || !transType?.id) {
            throw new Error('Product ID atau Trans Type ID tidak boleh null');
          }
          // delete journals
          const delReportJournals = await prisma.report_Journals.deleteMany({
            where: {
              trans_id: id,
              trans_type_id: transType.id,
              description: {
                contains: 'setelah opname stock tgl'
              }
            }
          });
          console.log('deleted ReportJournals', delReportJournals);

          // delete from report stocks
          const delReportStocks = await prisma.report_Stocks.deleteMany({
            where: {
              source_id: 2, // OUTSTOCK
              trans_id: id,
            }
          });
          console.log('deleted reportStocks', delReportStocks);


        });
      } catch (error) {
        console.error('Error creating stock out:', error);
        throw new Error(`Error creating stock out: ${error.message}`);
      }
    }
    return ResponseDto.success('Stocks loss during opname handled!', null, 200);
  }
}
