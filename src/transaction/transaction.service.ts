import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/base.service';
import { Trans } from '@prisma/client'
import { DatabaseService } from 'src/database/database.service';
import { TransTypeService } from 'src/trans-type/trans-type.service';
import { Prisma } from '@prisma/client';
import { filter } from 'rxjs';
import { ResponseDto } from 'src/common/response.dto';

@Injectable()
export class TransactionService extends BaseService<Trans> {
  constructor(
    db: DatabaseService,
    private readonly transTypeService: TransTypeService,
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
            trans_details_recurring:true
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
        
        const  trans = await this.db.trans.update({
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
              amount: row.amount,
              detail_description: row.description,
              cash_bank: row.kas,
            }
          });
  
        });
      }
      // Status == 0/ rejected -> deleted from  report journals
      else  if (status == 0) {
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
        { code: 'desc'},
        { created_at: 'desc'}
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

      query = Prisma.sql`${query} AND t.deleted_at IS NULL`;
  
      const result = await this.db.$queryRaw(query);
  
      return result;
    } catch (error) {
      console.error('Error fetching report:', error);
      throw error;
    }
  }

  async createSales(data: any) {
    // Kas / Piutang Usaha     (D)  9.990  
    // Diskon Penjualan        (D)  1.000  
    // Pendapatan                         (K) 10.000  (gk termasuk diskon)
    // Utang Pajak (PPN)                  (K)    990  
    const transType = await this.transTypeService.findOne({ where: { code: 'SAL' } });
    const transTypeId = transType.id;
    const hasTax = true // TODOELLA: Check if the store has tax
    const store = await this.db.stores.findUnique({ where: { id: data.store_id } });
    var diskonTotal = 0;
    var salesEmasTotal = 0;
    data.store = store;
    var transDetailsFormated = [];

    // REFORMAT TRANSACTION DETAIL
    // JOURNAL ENTRY (KREDIT)
    // Tax yg dibayar customer
    if (hasTax) {
      const taxAccount = await this.db.trans_Account_Settings.findUnique({
        where: {
          store_id_company_id_action: { 
            store_id: null, 
            company_id: data.auth.company_id, 
            action: 'tax' 
          }
        }
      });
      
      transDetailsFormated.push({
        account_id: taxAccount.account_id,
        amount:  Math.abs(data.tax_price) * -1,
        description: 'Pajak Penjualan',
        kas: false
      })
    }
    // Details / Journal Entry operation
    data.transaction_details.forEach(det => {
      // Sales Operation
      if ("operation_id" in det) {
        transDetailsFormated.push({
          account_id: det.account_id,
          amount: Math.abs(det.total_price) * -1,
          description: det.name,
          kas: false,
        })
      } 
      // Sales Emas
      else {
        salesEmasTotal += (Math.abs(det.total_price) + Math.abs(det.discount)) * -1;
        diskonTotal += Math.abs(det.discount);
      }
    })
    // Journal entry sales emas
    const goldSalesAccount = await this.getGoldSalesAccount(data);
    transDetailsFormated.push({
      account_id: goldSalesAccount.account_id,
      amount: salesEmasTotal,
      description: 'Penjualan Emas',
      kas: false,
    })

    // JOURNAL ENTRY (DEBIT)
    // Diskon Penjualan
    const discountAccount = await this.getDiscountAccount(data);
    if (diskonTotal > 0) {
      transDetailsFormated.push({
        account_id: discountAccount.account_id,
        amount: diskonTotal,
        description: 'Diskon penjualan',
        kas:true        
      })
    }
    // Account Debit
    // payment_method   Int // 1: Cash, 2: Bank Transfer, 3: Credit Card, 4: Debit Card
    

    // CREATE TRANSACTION
    try {
      const trans = await this.db.trans.create({
        data: {
          code: data.code,
          store: { connect: { id: data.store_id } },
          trans_type: { connect: { id: transTypeId } },
          total : data.total_price,
          description: store.name + ' Sales',
          trans_date: new Date(),
          weight_total: data.weight_total,
          sub_total_price: data.sub_total_price,
          tax_price: data.tax_price,
          created_by: data.employee_id,
          updated_by: null,
          
          // trans_details: {
          //   create: {}
          // }
        }
      })

    }catch (error) {
      return ResponseDto.error('Error creating sales transaction',null);
    }

    // INPUT TO JOURNAL
  }


  async getGoldSalesAccount(data: any) {
    var goldSalesAccount = await this.db.trans_Account_Settings.findUnique({
      where: {
        store_id_company_id_action: { 
          store_id: data.store_id, 
          company_id: data.auth.company_id, 
          action: 'goldSales' 
        }
      }
    });
    // create an account and set is as gold sales what if foldS
    if (!goldSalesAccount) {
      // Generate Account Code
      var lastCodeForPendapatan = await this.db.accounts.findMany({
        where: {
          company_id: data.store.company_id,
          account_type_id: 5
        },
        orderBy: {
          code: 'desc'
        }
      });
      var codePendapatan = 40000;
      if (lastCodeForPendapatan.length > 0) {
        var lastCode = lastCodeForPendapatan[0].code;
        codePendapatan = lastCode + 1;
      }
      // Create new account
      const newAccount = await this.db.accounts.create({
        data: {
          code: codePendapatan,
          name: 'Penjualan Emas ' + data.store.name,
          account_type: { connect: { id: 5 } },
          description: 'Default Akun Penjualan ' + data.store.name,
          store: { connect: { id: data.store_id } },
          company: { connect: { id: data.auth.company_id } },
          deactive: false,
          // created_by: data.employee_id,
        }
      })

      // Assign to trans_account_settings 
      goldSalesAccount = await this.db.trans_Account_Settings.create({
        data: {
          store: {
            connect: { id: data.store_id }
          },
          company: {
            connect: {id: data.auth.company_id}
          },
          account: {
            connect: {id: newAccount.id}
          },
          description: 'Default Akun Penjualan ' + data.store.name,
          action: 'goldSales'
        }
      });
    }

    return goldSalesAccount;
  }

  async getDiscountAccount(data: any) {
    var discountAccount = await this.db.trans_Account_Settings.findUnique({
      where: {
        store_id_company_id_action: { 
          store_id: data.store_id, 
          company_id: data.auth.company_id, 
          action: 'discountSales' 
        }
      }
    });
    if (!discountAccount)  {
      // Create new pendapatan account
      var lastCodeForPendapatan = await this.db.accounts.findMany({
          where: {
            company_id: data.store.company_id,
            account_type_id: 5
          },
          orderBy: {
            code: 'desc'
          }
      });
      var codePendapatan = 40000;
      if (lastCodeForPendapatan.length > 0) {
        var lastCode = lastCodeForPendapatan[0].code;
        codePendapatan = lastCode + 1;
      }
      const newAccount = await this.db.accounts.create({
        data: {
          code: codePendapatan,
          name: 'Penjualan Emas ' + data.store.name,
          account_type: { connect: { id: 5 } },
          description: 'Default Akun Penjualan ' + data.store.name,
          store: { connect: { id: data.store_id } },
          company: { connect: { id: data.auth.company_id } },
          deactive: false,
          // created_by: data.employee_id
        }
      });
      // Assign to trans_account_settings 
      discountAccount = await this.db.trans_Account_Settings.create({
        data: {
          store: {
            connect: { id: data.store_id }
          },
          company: {
            connect: {id: data.auth.company_id}
          },
          account: {
            connect: {id: newAccount.id}
          },
          description: 'Default Akun Diskon Penjualan ' + data.store.name,
          action: 'discountSales'
        }
      });
    }

    return discountAccount;
  }
}
