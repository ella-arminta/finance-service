import { Injectable } from '@nestjs/common';
import { Trans_Account_Settings } from '@prisma/client';
import { AccountsService } from 'src/accounts/accounts.service';
import { BaseService } from 'src/common/base.service';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class TransAccountSettingsService extends BaseService<Trans_Account_Settings> {
    constructor(
        db: DatabaseService,
        private readonly accountService: AccountsService
    ) {
        const relations = {
            store: true,
            account: true,
        }
        super('trans_Account_Settings', db, relations);
    }

    async getAllAccountIdByAction(action, owner_id ,store_id = null, company_id = null): Promise<string[]> {
        const whereQuery: any = { action };
    
        if (store_id) {
            whereQuery['store_id'] = store_id;
        }
        if (company_id) {
            whereQuery['store'] = { company_id };
        }

        if (!store_id && !company_id) {
            whereQuery['store'] = {
                company: {
                    owner_id: owner_id
                }
            }
        }
    
        return this.db.trans_Account_Settings.findMany({
            where: whereQuery,
            select: {
                account_id: true
            }
        }).then(results => results.map(account => account.account_id)); // Plugging map directly into the query
    }

    async getAllOperationAccount(owner_id ,store_id = null, company_id = null): Promise<string[]> {
        const whereQuery = {};
    
        if (store_id) {
            whereQuery['store_id'] = store_id;
        }
        if (company_id) {
            whereQuery['store'] = { company_id };
        }

        if (!store_id && !company_id) {
            whereQuery['store'] = {
                company: {
                    owner_id: owner_id
                }
            }
        }
    
        return this.db.operations.findMany({
            where: whereQuery,
            select: {
                account_id: true
            }
        }).then(results => results.map(account => account.account_id)); // Plugging map directly into the query
    }

    async getGoldSalesAccount(data: any) {
        var goldSalesAccount = await this.db.trans_Account_Settings.findUnique({
            where: {
                store_id_action: {
                    store_id: data.store_id,
                    action: 'goldSales'
                }
            },
            include: {
                account: true
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
            const newAccount = await this.accountService.create({
                code: codePendapatan,
                name: 'Penjualan Emas ' + data.store.name,
                account_type: { connect: { id: 5 } },
                description: 'Default Akun Penjualan ' + data.store.name,
                store: { connect: { id: data.store_id } },
                company: { connect: { id: data.store.company_id } },
                deactive: false,
                // created_by: data.employee_id,
            })

            // Assign to trans_account_settings 
            goldSalesAccount = await this.db.trans_Account_Settings.create({
                data: {
                    store: {
                        connect: { id: data.store_id }
                    },
                    account: {
                        connect: { id: newAccount.id }
                    },
                    maction: {
                        connect: { action: 'goldSales' }
                    }
                },
                include: {
                    account: true
                }
            });
        }

        return goldSalesAccount;
    }

    async getDiscountAccount(data: any) {
        var discountAccount = await this.db.trans_Account_Settings.findUnique({
            where: {
                store_id_action: {
                    store_id: data.store_id,
                    action: 'discountSales'
                }
            },
            include: {
                account: true
            }
        });
        if (!discountAccount) {
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
            const newAccount = await this.accountService.create({
                code: codePendapatan,
                name: 'Penjualan Emas ' + data.store.name,
                account_type: { connect: { id: 5 } },
                description: 'Default Akun Penjualan ' + data.store.name,
                store: { connect: { id: data.store_id } },
                company: { connect: { id: data.store.company_id } },
                deactive: false,
            });
            // Assign to trans_account_settings 
            discountAccount = await this.db.trans_Account_Settings.create({
                data: {
                    store: {
                        connect: { id: data.store_id }
                    },
                    account: {
                        connect: { id: newAccount.id }
                    },
                    maction: {
                        connect: { action: 'discountSales' }
                    }
                },
                include: {
                    account: true
                }
            });
        }

        return discountAccount;
    }

    async getPiutangAccount(data: any) {
        var piutangAccount = await this.db.trans_Account_Settings.findUnique({
            where: {
                store_id_action: {
                    store_id: data.store_id,
                    action: 'piutang'
                }
            },
            include: {
                account: true
            }
        });
        if (!piutangAccount) {
            // Create new piutang account
            var lastCodeForPiutang = await this.db.accounts.findMany({
                where: {
                    company_id: data.store.company_id,
                    account_type_id: 4,
                },
                orderBy: {
                    code: 'desc'
                }
            });
            var codePiutang = 12000;
            if (lastCodeForPiutang.length > 0) {
                var lastCode = lastCodeForPiutang[0].code;
                codePiutang = lastCode + 1;
            }
            const newAccount = await this.accountService.create({
                code: codePiutang,
                name: 'Piutang Usaha ' + data.store.name,
                account_type: { connect: { id: 4 } },
                description: 'Default Akun Piutang Usaha ' + data.store.name,
                store: { connect: { id: data.store_id } },
                company: { connect: { id: data.store.company_id } },
                deactive: false,
                // created_by: data.employee_id
            });
            // Assign
            piutangAccount = await this.db.trans_Account_Settings.create({
                data: {
                    store: {
                        connect: { id: data.store_id }
                    },
                    account: {
                        connect: { id: newAccount.id }
                    },
                    maction: {
                        connect: { action: 'piutang' }
                    }
                },
                include: {
                    account: true
                }
            });
        }

        return piutangAccount;
    }

    async getTaxAccount(data: any) {
        var taxAccount = await this.db.trans_Account_Settings.findFirst({
            where: {
                store_id: data.store.id,
                action: 'tax'
            },
            include: {
                account: true
            }
        });

        if (!taxAccount) {
            // Create new tax account
            var lastCodeForTax = await this.db.accounts.findMany({
                where: {
                    company_id: data.store.company_id,
                    account_type_id: 3
                },
                orderBy: {
                    code: 'desc'
                }
            });
            var codeTax = 21001;
            if (lastCodeForTax.length > 0) {
                var lastCode = lastCodeForTax[0].code;
                codeTax = lastCode + 1;
            }
            const newAccount = await this.accountService.create({
                code: codeTax,
                name: 'Hutang Pajak Penjualan ',
                account_type: { connect: { id: 3 } },
                description: 'Default Akun Pajak Penjualan ',
                company: { connect: { id: data.store.company_id } },
                deactive: false,
            });
            // Assign
            taxAccount = await this.db.trans_Account_Settings.create({
                data: {
                    store: {
                        connect: { id: data.store.id }
                    },
                    account: {
                        connect: { id: newAccount.id }
                    },
                    maction: {
                        connect: { action: 'tax' }
                    }
                },
                include: {
                    account: true
                }
            });
        }
        return taxAccount;
    }

    async getPaymentMethodAccount(data: any) {
        const type = data.payment_method;
        var paymentMethodAccount = await this.db.trans_Account_Settings.findUnique({
            where: {
                store_id_action: {
                    store_id: data.store_id,
                    action: 'pm' + type
                }
            },
            include: {
                account: true
            }
        })

        if (!paymentMethodAccount) {
            // 1: Cash, 2: Bank Transfer, 3: Credit Card, 4: Debit Card
            // code kas
            var lastCodeForKas = await this.db.accounts.findMany({
                where: {
                    company_id: data.store.company_id,
                    account_type_id: 1
                },
                orderBy: {
                    code: 'desc'
                }
            });
            var codeKas = 11001;
            if (lastCodeForKas.length > 0) {
                var lastCode = lastCodeForKas[0].code;
                codeKas = lastCode + 1;
            }

            var name = '';
            switch (type) {
                case 1:
                    name = 'Kas';
                    break;
                case 2:
                    name = 'Bank Transfer';
                    break;
                case 3:
                    name = 'Credit Card';
                    break;
                case 4:
                    name = 'Debit Card';
                    break;
                case 5:
                    name = 'Midtrans';
                    break;
                default:
                    name = 'Kas';
                    break;
            }

            const newAccount = await this.accountService.create({
                code: codeKas,
                name: name + ' ' + data.store.name,
                account_type: { connect: { id: 1 } },
                description: 'Default ' + name + ' ' + data.store.name,
                company: { connect: { id: data.store.company_id } },
                deactive: false,
                // created_by: data.employee_id
            });
            // Assign
            paymentMethodAccount = await this.db.trans_Account_Settings.create({
                data: {
                    store: {
                        connect: { id: data.store_id }
                    },
                    account: {
                        connect: { id: newAccount.id }
                    },
                    maction: {
                        connect: { action: 'pm' + type }
                    }
                },
                include: {
                    account: true
                }
            });
        }

        return paymentMethodAccount;
    }

    async getInventoryAccount(data) {
        data.store = await this.db.stores.findUnique({
            where: {
                id: data.product.store_id
            }
        });
        var inventoryAccount = await this.db.trans_Account_Settings.findFirst({
            where: {
                store_id: data.product.store_id,
                action: 'persediaan'
            },
            include: {
                account: true
            }
        });

        if (!inventoryAccount) {
            // Create new tax account
            var lastCodeForInventory = await this.db.accounts.findMany({
                where: {
                    company_id: data.store.company_id,
                    account_type_id: 1
                },
                orderBy: {
                    code: 'desc'
                }
            });
            var codeStock = 11001;
            if (lastCodeForInventory.length > 0) {
                var lastCode = lastCodeForInventory[0].code;
                codeStock = lastCode + 1;
            }
            const newAccount = await this.accountService.create({
                code: codeStock,
                name: 'PERSEDIAAN ' + data.store.name,
                account_type: { connect: { id: 1 } },
                description: 'Akun persediaan toko ',
                company: { connect: { id: data.store.company_id } },
                deactive: false,
                // created_by: data.employee_id
            });
            // Assign
            inventoryAccount = await this.db.trans_Account_Settings.create({
                data: {
                    store: {
                        connect: { id: data.store.id }
                    },
                    account: {
                        connect: { id: newAccount.id }
                    },
                    maction: {
                        connect: { action: 'persediaan' }
                    }
                },
                include: {
                    account: true
                }
            });
        }
        return inventoryAccount;
    }

    async getDefaultAccount(action, store_id, company_id, name, account_type_id, description) {
        var defaultAccount = await this.db.trans_Account_Settings.findFirst({
            where: {
                store_id: store_id,
                action: action
            },
            include: {
                account: true
            }
        });

        if (!defaultAccount) {
            // Create new tax account
            var lastCodeForDefault = await this.db.accounts.findMany({
                where: {
                    company_id: company_id,
                    account_type_id: account_type_id
                },
                orderBy: {
                    code: 'desc'
                }
            });
            var codeDefault = this.accountService.accountDefaultCode[account_type_id];
            if (lastCodeForDefault.length > 0) {
                var lastCode = lastCodeForDefault[0].code;
                codeDefault = lastCode + 1;
            }
            const newAccount = await this.accountService.create({
                code: codeDefault,
                name: name,
                account_type: { connect: { id: account_type_id } },
                description: description,
                company: { connect: { id: company_id } },
                deactive: false,
            });
            // Assign
            defaultAccount = await this.db.trans_Account_Settings.create({
                data: {
                    store: {
                        connect: { id: store_id }
                    },
                    account: {
                        connect: { id: newAccount.id }
                    },
                    maction: {
                        connect: { action: action }
                    }
                },
                include: {
                    account: true
                }
            });
        }
        return defaultAccount;
    }
    

    async findAll(params = {}, literal = false, orderBy: Record<string, 'asc' | 'desc'> = {}): Promise<any> {
        var result = await this.db.action_Account_Settings.findMany({
            include: {
                trans_Account_settings: {
                    where: params,
                    include: {
                        account: true
                    }
                }
            },
        });
        return  result;
    }

    async find(params = {}) {
        console.log('find params',params);
        var result = this.db.trans_Account_Settings.findMany({
            where: params,
            include: {
                account: true,
                maction: true
            }
        })
        return result;
    }

    async create(data: any): Promise<any> {
        let result = null;
        let prevData = await this.db.trans_Account_Settings.findUnique({
            where: {
                store_id_action: {
                    store_id: data.store_id,
                    action: data.action
                }
            }
        })
        // Update
        if (prevData) {
            result = await this.db.trans_Account_Settings.update({
                where: {
                    id: prevData.id
                },
                data: {
                    account: {
                        connect: { id: data.account_id }
                    },
                }
            });
        } 
        // Create new
        else {
            result = await this.db.trans_Account_Settings.create({
                data: {
                    store: {
                        connect: { id: data.store_id }
                    },
                    account: {
                        connect: { id: data.account_id }
                    },
                    maction: {
                        connect: { action: data.action }
                    }
                }
            })
        }
        return result;
    }
}
