import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Payable_Receivables } from '@prisma/client';
import { BaseService } from 'src/common/base.service';
import { ResponseDto } from 'src/common/response.dto';
import { DatabaseService } from 'src/database/database.service';
import { ReportService } from 'src/report-journals/report-journals.service';
import { add, format, isSameDay } from 'date-fns';

@Injectable()
export class PayableReceivableService extends BaseService<Payable_Receivables> {
    private readonly logger = new Logger(PayableReceivableService.name);

    constructor(
        db: DatabaseService,
        private readonly reportJournalService: ReportService,
        private readonly mailerService: MailerService,
    ) {
        const relations = {
            report_journal: true,
            reminder_payable_receivables: true,
            payable_receivables_detail: true,
        }
        super('payable_Receivables', db, relations);
    }

    async findAll(params: any = {}, literal = false, orderBy: Record<string, 'asc' | 'desc'> = {}): Promise<any[]> {
        if (!params.company_id && params.store_id) {
            const store = await this.db.stores.findFirst({
                where: {
                    id: params.store_id,
                },
                select: {
                    company_id: true,
                }
            });
            if (store) {
                params.company_id = store.company_id;
            } else {
                throw new Error('Store not found');
            }
        }

        const taxAccounts = await this.db.trans_Account_Settings.findMany({
            where: {
                action: 'tax',
                store: {
                    company_id: params.company_id,
                }
            }
        });

        const taxAccountIDs = taxAccounts.map((item) => item.account_id);

        params.account_id = {
            notIn: taxAccountIDs
        };

        params.payable_receivables_detail = null;
        params.journal_reverse_detail = null;

        if (params.status) {
            const statusList = Array.isArray(params.status) ? params.status.map(Number) : [+params.status];
            delete params.status;
            
            const now = new Date();
            const orConditions: any[] = [];
            
            if (statusList.includes(1)) {
                orConditions.push({
                payable_receivables: {
                    status: 1,
                }
                });
            }
            
            if (statusList.includes(2)) {
                orConditions.push({
                payable_receivables: {
                    status: 0,
                    due_date: { gte: now }
                }
                });
                orConditions.push({
                    payable_receivables: {
                        due_date: null,
                    }
                });
            }
            
            if (statusList.includes(3)) {
                orConditions.push({
                payable_receivables: {
                    status: 0,
                    due_date: { lt: now }
                }
                });
            }
            
            // Kalau ada kondisi, masukkan ke where pakai `OR`
            if (orConditions.length > 0) {
                params.OR = orConditions;
            }
        }          
        console.log('params', params);

        const result = await this.reportJournalService.findAll(params);
        return result;
    }

    async findOne(id: number, params: any = {}): Promise<any> {
        const result = await this.reportJournalService.findOne(id);
        return result;
    }

    // Update Payment Payable Receivable
    async update(report_journal_id: any, data: any) {
        let reportJournalParent = await this.reportJournalService.findOne(report_journal_id);
        if (!reportJournalParent) {
            return ResponseDto.error('Report Journal not found', null, 400);
        }
        const type = reportJournalParent.account.account_type_id == 3 ? 1 : 2; // 1 = Hutang, 2 = Piutang
        let payableReceivable = await this.db.payable_Receivables.findUnique({
            where: {
                report_journal_id: report_journal_id,
            },
        })
        // VALIDATION
        const totalPaid = payableReceivable?.amount_paid.toNumber() ?? 0;
        const totalAmount = Math.abs(reportJournalParent.amount);
        const currentPayment = Math.abs(data.amount_paid);
        if (payableReceivable?.status == 1) {
            return ResponseDto.error('Payable Receivable sudah lunas', null, 400);
        }
        if (totalAmount < totalPaid + currentPayment) {
            return ResponseDto.error('The amount paid exceeds the total bill', null, 400);
        }

        // CREATE
        let updatedPayableReceivable = null;
        let payableReceivablesDetail = null;
        try {
            await this.db.$transaction(async (tx) => {

                // Create Payable Receivables when not found
                if (!payableReceivable) {
                    payableReceivable = await tx.payable_Receivables.create({
                        data: {
                            report_journal: {
                                connect: { id: report_journal_id }
                            },
                            type: type,
                            status: 0,
                            created_by: data.created_by,
                        },
                    });
                }
                // Create payable receivables detail
                const todayDateTime = new Date();
                payableReceivablesDetail = await tx.payable_Receivables_Detail.create({
                    data: {
                        payable_receivable: {
                            connect: { id: payableReceivable.id }
                        },
                        report_journal: {
                            create: {
                                trans_serv_id: reportJournalParent.trans_serv_id,
                                code: reportJournalParent.code,
                                store: {
                                    connect: { id: reportJournalParent.store_id }
                                },
                                trans_date: todayDateTime,
                                trans_type: {
                                    connect: { id: reportJournalParent.trans_type_id }
                                },
                                description: reportJournalParent.description,
                                account: {
                                    connect: { id: data.account_id }
                                },
                                amount: currentPayment * (type === 1 ? -1 : 1),
                                detail_description: data.detail_description,
                            }
                        },
                        journal_reverse: {
                            create: {
                                trans_serv_id: reportJournalParent.trans_serv_id,
                                code: reportJournalParent.code,
                                store: {
                                    connect: { id: reportJournalParent.store_id }
                                },
                                trans_date: todayDateTime,
                                trans_type: {
                                    connect: { id: reportJournalParent.trans_type_id }
                                },
                                description: reportJournalParent.description,
                                account: {
                                    connect: { id: reportJournalParent.account_id }
                                },
                                amount: currentPayment * (type === 1 ? 1 : -1),
                                detail_description: data.detail_description,
                            }
                        },
                        created_at: todayDateTime,
                        created_by: data.created_by,
                    },
                    include: {
                        report_journal: {
                            include: {
                                account: true,
                            }
                        },
                        journal_reverse: true,
                    }
                })
                // firstJournal = await tx.report_Journals.create({
                //     data: {
                //         trans_serv_id: reportJournalParent.trans_serv_id,
                //         code: reportJournalParent.code,
                //         store: {
                //             connect: { id: reportJournalParent.store_id }
                //         },
                //         trans_date: todayDateTime,
                //         trans_type: {
                //             connect: { id:reportJournalParent.trans_type_id }
                //         },
                //         description: reportJournalParent.description,
                //         account: {
                //             connect: { id: data.account_id }
                //         },
                //         amount: currentPayment * (type === 1 ? -1 : 1),
                //         detail_description: data.detail_description,
                //         payable_receivables_detail: {
                //             create: {
                //                 payable_receivable: {
                //                     connect: { id: payableReceivable.id }
                //                 },
                //             },
                //         }
                //     },
                //     include: {
                //         account: true,
                //     }
                // });
                // // second journal
                // await tx.report_Journals.create({
                //     data: {
                //         trans_serv_id: reportJournalParent.trans_serv_id,
                //         code: reportJournalParent.code,
                //         store: {
                //             connect: { id: reportJournalParent.store_id }
                //         },
                //         trans_date: todayDateTime,
                //         trans_type: {
                //             connect: {id: reportJournalParent.trans_type_id}
                //         },
                //         description: reportJournalParent.description,
                //         account: {
                //             connect: { id: reportJournalParent.account_id }
                //         },
                //         amount: currentPayment * (type === 1 ? 1 : -1),
                //         detail_description: data.detail_description,
                //         payable_receivables_detail: {
                //             create: {
                //                 payable_receivable: {
                //                     connect: { id: payableReceivable.id }
                //                 },
                //             },
                //         }
                //     }
                // });
                // create payable receivables detail 
                // await tx.payable_Receivables_Detail.create({
                //     data: {
                //         payable_receivable: {
                //             connect: { id: payableReceivable.id }
                //         },
                //         report_journal: {
                //             connect: { id: firstJournal.id }
                //         },
                //         created_at: todayDateTime
                //     }
                // });
                // update payable receivable
                updatedPayableReceivable = await tx.payable_Receivables.update({
                    where: {
                        id: payableReceivable.id,
                    },
                    data: {
                        amount_paid: totalPaid + currentPayment,
                        status: totalPaid + currentPayment >= totalAmount ? 1 : 0,
                        updated_at: todayDateTime,
                        updated_by: data.created_by
                    },
                    include: {
                        report_journal: true,
                    }
                });
            });
        } catch (error) {
            return ResponseDto.error('Failed to create payable receivable', error, 400);
        }
        updatedPayableReceivable.first_journal = payableReceivablesDetail.report_journal;
        updatedPayableReceivable.detail_id = payableReceivablesDetail.id;
        return ResponseDto.success('Payable Receivable updated', updatedPayableReceivable, 200);
    }

    async delete(detail_id: any) {
        const detail = await this.db.payable_Receivables_Detail.findUnique({
            where: { id: detail_id },
            include: {
                report_journal: {
                    include: {
                        account: true,
                    }
                },
                journal_reverse: true,
                payable_receivable: {
                    include: {
                        report_journal: true, // untuk update amount_paid
                    }
                }
            }
        });
        if (!detail) {
            return ResponseDto.error('Data not found', null, 400);
        }

        let firstJournal = detail.report_journal;
        let updatedPayableReceivables = null;
        try {
            await this.db.$transaction(async (tx) => {
                // Step 1: Delete the detail
                await tx.payable_Receivables_Detail.delete({
                    where: { id: detail_id }
                });

                // delte first journal
                await tx.report_Journals.delete({
                    where: { id: detail.report_journal_id }
                });

                // Step 3: Delete journal_reverse
                await tx.report_Journals.delete({
                    where: { id: detail.journal_reverse_id }
                });

                // Step 4: Update payable_receivable if needed
                const oldPaid = detail.payable_receivable.amount_paid?.toNumber() ?? 0;
                const totalAmount = Math.abs(detail.payable_receivable.report_journal.amount?.toNumber()) ?? 0;
                const newPaid = oldPaid - Math.abs(firstJournal.amount.toNumber());

                updatedPayableReceivables = await tx.payable_Receivables.update({
                    where: { id: detail.payable_receivable_id },
                    data: {
                        amount_paid: newPaid,
                        status: newPaid >= totalAmount ? 1 : 0,
                        updated_at: new Date(),
                    }
                });
            });
        } catch (error) {
            console.error(error);
            return ResponseDto.error('Failed to delete payable receivable', error, 500);
        }

        updatedPayableReceivables.first_journal = firstJournal;
        return ResponseDto.success('Payable Receivable deleted', updatedPayableReceivables, 200);
    }

    async updateDueDate(report_journal_id: any, due_date: any) {
        let reportJournalParent = await this.reportJournalService.findOne(report_journal_id);
        if (!reportJournalParent) {
            return ResponseDto.error('Report Journal not found', null, 400);
        }
        const type = reportJournalParent.account.account_type_id == 3 ? 1 : 2; // 1 = Hutang, 2 = Piutang
        let payableReceivable = await this.db.payable_Receivables.findUnique({
            where: {
                report_journal_id: report_journal_id,
            },
        })
        try {
            await this.db.$transaction(async (tx) => {
                // Create Payable Receivables when not found
                if (!payableReceivable) {
                    payableReceivable = await tx.payable_Receivables.create({
                        data: {
                            report_journal: {
                                connect: { id: report_journal_id }
                            },
                            type: type,
                            due_date: due_date,
                            status: 0,
                            created_at: new Date(),
                            created_by: 'created_by' in reportJournalParent ? reportJournalParent.created_by : null,
                        },
                    });
                } else {
                    await tx.payable_Receivables.update({
                        where: {
                            id: payableReceivable.id,
                        },
                        data: {
                            due_date: due_date,
                            updated_at: new Date(),
                        },
                    });
                }
            });
        } catch (error) {
            console.error(error);
            return ResponseDto.error('Failed to delete payable receivable', error, 500);
        }

        return ResponseDto.success('Payable Receivable updated', payableReceivable, 200);
    }

    async createReminder(report_journal_id: any, data: any) {
        let reportJournalParent = await this.reportJournalService.findOne(report_journal_id);
        if (!reportJournalParent) {
            return ResponseDto.error('Report Journal not found', null, 400);
        }
        const type = reportJournalParent.account.account_type_id == 3 ? 1 : 2; // 1 = Hutang, 2 = Piutang
        let payableReceivable = await this.db.payable_Receivables.findUnique({
            where: {
                report_journal_id: report_journal_id,
            },
        })
        if (!payableReceivable) {
            return ResponseDto.error('Please fill due date first', null, 400);
        }
        // Create reminder Payable Receivables
        // if (data.mode === 'interval') {
        //     const dueDate = payableReceivable.due_date; // pastikan ini Date object
        //     const interval = data.interval;

        //     // Buat salinan untuk menghindari mutasi objek asli
        //     let remindDate = new Date(dueDate.getTime());

        //     switch (data.period) {
        //       case 'day':
        //         remindDate.setDate(remindDate.getDate() - interval);
        //         break;
        //       case 'week':
        //         remindDate.setDate(remindDate.getDate() - interval * 7);
        //         break;
        //       case 'month':
        //         remindDate.setMonth(remindDate.getMonth() - interval);
        //         break;
        //       case 'year':
        //         remindDate.setFullYear(remindDate.getFullYear() - interval);
        //         break;
        //       default:
        //         console.warn('Invalid period');
        //         break;
        //     }

        //     data.date_remind = remindDate;
        // }
        let createReminder;
        try {
            await this.db.$transaction(async (tx) => {
                createReminder = await tx.reminder_Payable_Receivables.create({
                    data: {
                        payable_receivable: {
                            connect: { id: payableReceivable.id }
                        },
                        interval: data.interval ?? null,
                        period: data.period ?? null,
                        date_remind: data.date_remind ?? null,
                        emails: data.emails,
                    },
                })
            });
        } catch (error) {
            console.error(error);
            return ResponseDto.error('Failed to delete payable receivable', error, 500);
        }

        return ResponseDto.success('Payable Receivable updated', createReminder, 200);
    }

    async deleteReminder(reminder_id) {
        const reminder = await this.db.reminder_Payable_Receivables.findUnique({
            where: { id: reminder_id },
        });
        if (!reminder) {
            return ResponseDto.error('Data not found', null, 400);
        }

        try {
            await this.db.reminder_Payable_Receivables.delete({
                where: { id: reminder_id },
            });
        } catch (error) {
            console.error(error);
            return ResponseDto.error('Failed to delete reminder', error, 500);
        }

        return ResponseDto.success('Reminder deleted', null, 200);
    }
    

    @Cron('0 0 * * *') // every day at 00:00
    async handleCron() {
        this.logger.log('Running cron job...');
        await this.handleReminderJob();
    }
    async handleReminderJob() {
      this.logger.log('Running reminder cron job...');
  
      const today = new Date();
  
      const reminders = await this.db.reminder_Payable_Receivables.findMany({
        where: {
          OR: [
            { date_remind: today },
            {
              interval: { not: null },
              period: { not: null },
            },
          ],
          payable_receivable: {
            due_date: { not: null },
            status: 0,
          }
        },
        include: {
          payable_receivable: {
            include: {
              report_journal: {
                include: {
                    trans_type: true,
                    account: true,
                    store: {
                        include: {
                            company: true,
                        },
                    },
                },
              },
            },
          },
        },
      });
  
      for (const reminder of reminders) {
        const { date_remind, interval, period, emails, payable_receivable } = reminder;
  
        const dueDate = payable_receivable.due_date;
        if (!dueDate) continue;
  
        let shouldSend = false;
  
        if (date_remind) {
          shouldSend = isSameDay(new Date(date_remind), today);
        } else if (interval && period) {
          const reminderDate = this.subtractPeriod(dueDate, interval, period);
          shouldSend = isSameDay(reminderDate, today);
        }
  
        if (shouldSend && emails.length > 0) {
          await this.sendEmail(emails, payable_receivable);
        }
      }
    }
  
    subtractPeriod(date: Date, interval: number, period: string): Date {
        const periodMap = {
            year: 'years',
            month: 'months',
            week: 'weeks',
            day: 'days',
        };
        
      return add(date, {
        [periodMap[period]]: -interval,
      });
    }
  
    async sendEmail(toEmails: string[], payable: any) {
      const type = payable.type === 1 ? 'Hutang' : 'Piutang';
      const formattedDate = format(new Date(payable.due_date), 'dd MMM yyyy');
  
      await this.mailerService.sendMail({
        to: toEmails,
        subject: `[${payable.report_journal.store.name}] Reminder Pembayaran ${type}`,
        html: `
          <h3>Pengingat ${type} [${payable.report_journal.code}]</h3>
          <p>Berikut adalah detail pengingat pembayaran:</p>
          <ul>
            <li><strong>Perusahaan:</strong> ${payable.report_journal.store.company.name}</li>
            <li><strong>Toko:</strong> ${payable.report_journal.store.name}</li>
            <li><strong>Jenis:</strong> ${type}</li>
            <li><strong>Tanggal Jatuh Tempo: </strong> ${formattedDate}</li>
            <li><strong>Jumlah yang belum dibayar: </strong> Rp. ${(payable.report_journal.amount && payable.amount_paid ? (payable.report_journal.amount - payable.amount_paid) : 0).toLocaleString('id-ID')}</li>
            <li><strong>Status:</strong> ${payable.status === 0 ? 'Belum Lunas' : 'Lunas'}</li>
            <li><strong>Nama Akun:</strong> ${payable.report_journal.account.name}</li>
            <li><strong>Transaksi:</strong> ${format(new Date(payable.report_journal.trans_date), 'dd MMM yyyy')}  - ${payable.report_journal.code} - ${payable.report_journal.trans_type.name}</li>
            <li><strong>Deskripsi:</strong> ${payable.report_journal.description}</li>
          </ul>
          <p>Terima kasih.</p>
        `,
      });
  
      this.logger.log(`Email reminder sent to: ${toEmails.join(', ')}`);
    }
  
}
