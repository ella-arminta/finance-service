import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/base.service';
import { Trans } from '@prisma/client'
import { DatabaseService } from 'src/database/database.service';
import { TransTypeService } from 'src/trans-type/trans-type.service';
import { Prisma } from '@prisma/client';
import { filter } from 'rxjs';

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
      store: true,
    }
    super('trans', db, relations);
  }

  async create(data: any) {
    try {
      const result = await this.db.$transaction(async (prisma) => {
        // Create the main transaction record
        var accounts = data.accounts;
        // all data but remove accounts
        var newtrans = { ...data };
        delete newtrans.accounts;

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
        console.log('udpatedTrans', trans);
        // Update the transaction details
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
        console.log('updated TransDetails', transDetails);
      });

      return result;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw new Error('Transaction update failed');
    }
  }


  async delete(id: any) {
    // delete trans_details with the id of the transaction
    // then if success delete the transaction
    try {
      const result = await this.db.$transaction(async (prisma) => {
        const transDetails = await this.db.trans_Details.deleteMany({
          where: {
            trans_id: id
          }
        });
        // delete the transaction
        const trans = await this.db.trans.delete({
          where: {
            id: id
          }
        })
      });
      return result;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw new Error('Transaction deletion failed');
    }
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
    const indexTransaction = await this.countThisMonthTransaction(store_id, year, month, transType.id) + 1;
    var transactionCode = transType.code + '/' + year.toString().slice(-2) + month.toString().padStart(2, '0') + '/' + indexTransaction.toString().padStart(5, '0');
    return transactionCode;
  }

  async getReportUangKeluarMasuk(filters: any) {    
    try  {
      let query = Prisma.sql`
        SELECT 
          t.id as id,
          t.code as code, 
          t.trans_date as trans_date, 
          a.name as account_name, 
          t.total as total, 
          t.description as description, 
          t.created_by as created_by,
          td.kas
        FROM "Trans" t
        JOIN "Trans_Details" td ON t.id = td.trans_id
        JOIN "Accounts" a ON td.account_id = a.id
        WHERE td.kas = true
      `;
  
      if (filters.account_name && filters.account_name != '' && filters.account_name.length > 0) {
        query = Prisma.sql`${query} AND td.account_id = ${filters.account_name[0]}::uuid`;
      }
      
      const result = await this.db.$queryRaw(query);
  
      return result;
    } catch (error) {
      console.error('Error fetching report:', error);
      throw error;
    }
  }  
}
