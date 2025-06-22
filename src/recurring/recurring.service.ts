import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Trans_Recurring } from '@prisma/client';
import { BaseService } from 'src/common/base.service';
import { DatabaseService } from 'src/database/database.service';
import { TransactionService } from 'src/transaction/transaction.service';
import { RecurringType } from '@prisma/client';
import { last } from 'cheerio/dist/commonjs/api/traversing';

@Injectable()
export class RecurringService extends BaseService<Trans_Recurring> {
    protected readonly relations: any;

    constructor(
        db: DatabaseService,
        private readonly transService: TransactionService,
      ) {
        const relations = {
            trans_type: true,
            trans_details_recurring: {
                include: {
                    account: true
                }
            },
            store: true,
        }
        super('trans_Recurring', db, relations,true);
        this.relations = relations;
    }

    async findAllRecurringPeriod() {
        return Object.values(RecurringType);
    }

    async update(id: any, data: any, user_id: string | null = null) {
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
                await prisma.action_Log.create({
                    data: {
                        user_id: user_id,
                        event: 'UPDATE',
                        resource: 'recurring',
                        diff: JSON.stringify({ ...data, id }),
                    },
                })
            });

            return result;
        } catch (error) {
            console.error('Error updating transaction:', error);
            throw new Error('Transaction update failed');
        }
    }

    async create(data:any, user_id: string | null = null) {
        var newdata = await this.transService.createRecurring(data, user_id);
        return newdata;
    }

    @Cron('0 0 * * *', {
        timeZone: 'Asia/Jakarta',
    })
    async handleRecurringTransactionCron() {
        const today = new Date();
        const isoToday = new Date(today.toISOString().split('T')[0]); // normalize to 00:00
    
        const recurrences = await this.db.trans_Recurring.findMany({
            where: {
                deleted_at: null,
                startDate: { lte: isoToday },
                OR: [
                    { endDate: null },
                    { endDate: { gte: isoToday } }
                ]
            },
            include: this.relations
        });
    
        console.log('recurrences', recurrences);
        for (const data of recurrences) {
            if (this.shouldRunToday(data, isoToday)) {
                console.log('data should run today:', data);
                await this.createTransactionFromRecurring(data);
    
                await this.db.trans_Recurring.update({
                    where: { id: data.id },
                    data: { last_recurring_date: isoToday },
                });
            }
        }
    }

    private shouldRunToday(dataRecurring: any, today: Date): boolean {
        const {
            recurringType,
            interval,
            last_recurring_date,
            startDate,
            daysOfWeek,
            dayOfMonth,
            monthOfYear,
            dayOfYear,
        } = dataRecurring;

        const lastDate = last_recurring_date ?? startDate;
        const diffDays = Math.floor(
            (today.getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24),
        ) +  (last_recurring_date == null ? 1 : 0); 

        switch (recurringType) {
            case 'DAY':
            return diffDays >= interval; // Every X days

            case 'WEEK':
            const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
            console.log('currentDay in week type', currentDay, 'daysofweek', daysOfWeek);
            const weeksPassed = Math.floor(diffDays / 7); // pembulatan kebawah
            return weeksPassed >= interval && daysOfWeek.includes(currentDay);

            case 'MONTH':
                const monthsPassed =
                    (today.getFullYear() - new Date(lastDate).getFullYear()) * 12 +
                    today.getMonth() -
                    new Date(lastDate).getMonth();
            
                // Determine if today is the last day of the month
                const isLastDayOfMonth = (() => {
                    const nextDay = new Date(today);
                    nextDay.setDate(today.getDate() + 1);
                    return nextDay.getDate() === 1;
                })();
            
                if (dayOfMonth === -1) {
                    return monthsPassed >= interval && isLastDayOfMonth;
                }
            
                return monthsPassed >= interval && today.getDate() === dayOfMonth;
            

            case 'YEAR': {
                const yearsPassed =
                    today.getFullYear() - new Date(lastDate).getFullYear();
            
                const currentMonth = today.getMonth(); // 0-11
                const currentDay = today.getDate();
            
                // Check if today is the last day of the month
                const isLastDayOfMonth = (() => {
                    const nextDay = new Date(today);
                    nextDay.setDate(today.getDate() + 1);
                    return nextDay.getDate() === 1;
                })();
            
                return (
                    yearsPassed >= interval &&
                    monthOfYear.includes(currentMonth) &&
                    (
                        (dayOfYear === -1 && isLastDayOfMonth) ||
                        (dayOfYear !== -1 && currentDay === dayOfYear)
                    )
                );
            }
                

            default:
            return false;
        }
    }
    
    async createTransactionFromRecurring(data: any, user_id: string | null = null) {
        try {
            // today
            console.log('data create transaction from recurring', data);
            const today = new Date();
            const result = await this.db.$transaction(async (prisma) => {
                // data only get the transaction 
                const trans = await this.db.trans.create({
                    data: {
                        code: data.code ,
                        store_id:data.store_id,
                        trans_date: today,
                        trans_type_id: data.trans_type_id,
                        total: data.total,
                        description: data.description,
                        updated_at: today,
                        created_by: data.created_by,
                        trans_details: {
                            create: data.trans_details_recurring.map(data => ({
                                account_id: data.account_id,
                                amount: data.amount,
                                description: data.description,
                                kas: data.kas
                            })),
                        },
                    },
                    include: this.relations
                });

                await prisma.action_Log.create({
                    data: {
                        user_id: user_id,
                        event: 'CREATE',
                        resource: 'recurring',
                        diff: JSON.stringify({ ...data }),
                    },
                })
        
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
}
