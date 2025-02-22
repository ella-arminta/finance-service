import { Injectable } from '@nestjs/common';
import { Trans_Recurring } from '@prisma/client';
import { BaseService } from 'src/common/base.service';
import { DatabaseService } from 'src/database/database.service';
import { TransactionService } from 'src/transaction/transaction.service';

@Injectable()
export class RecurringService extends BaseService<Trans_Recurring> {
    constructor(
        db: DatabaseService,
        private readonly transService: TransactionService
      ) {
        const relations = {
            trans_type: true,
            trans_details_recurring: {
                include: {
                    account: true
                }
            },
            store: true,
            recurring_period: true
        }
        super('trans_Recurring', db, relations,true);
    }

    async findAllRecurringPeriod() {
        return this.db.recurring_Period.findMany();
    }

    async update(id: any, data: any) {
        try {
            const result = await this.db.$transaction(async (prisma) => {
                // Update the main transaction record
                var accounts = data.accounts;
                // all data but remove accounts
                var updatedTrans = { ...data };
                delete updatedTrans.accounts;
                
                const  trans = await this.db.trans_Recurring.update({
                    where: { id: id },
                    data: {
                    ...updatedTrans,
                    }
                });
                // console.log('udpatedTrans', trans);
                // Update the transaction details
                // delete all transaction details before
                const prevTransDetails = await this.db.trans_Details_Recurring.deleteMany({
                    where: {
                        trans_id: id 
                    }
                });
                // then create new transaction details
                const transDetails = await this.db.trans_Details_Recurring.createMany({
                    data: accounts.map(account => ({
                        trans_id: id,
                        ...account
                    })),
                });
                // console.log('updated TransDetails', transDetails);
            });

            return result;
        } catch (error) {
            console.error('Error updating transaction:', error);
            throw new Error('Transaction update failed');
        }
    }

    async create(data:any) {
        var newdata = await this.transService.createRecurring(data);
        return newdata;
    }
}
