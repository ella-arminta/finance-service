import { Injectable } from '@nestjs/common';
import { Trans_Account_Settings } from '@prisma/client';
import { BaseService } from 'src/common/base.service';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class TransAccountSettingsService extends BaseService<Trans_Account_Settings> {
    constructor(
        db: DatabaseService,
    ) {
        const relations = {
            store: true,
            company: true,
            account: true,
        }
        super('trans_Account_Settings', db, relations, true);
    }

    async getGoldSalesAccount(data: any) {
        var goldSalesAccount = await this.db.trans_Account_Settings.findUnique({
            where: {
                store_id_company_id_action: {
                    store_id: data.store_id,
                    company_id: data.store.company_id,
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
            const newAccount = await this.db.accounts.create({
                data: {
                    code: codePendapatan,
                    name: 'Penjualan Emas ' + data.store.name,
                    account_type: { connect: { id: 5 } },
                    description: 'Default Akun Penjualan ' + data.store.name,
                    store: { connect: { id: data.store_id } },
                    company: { connect: { id: data.store.company_id } },
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
                        connect: { id: data.store.company_id }
                    },
                    account: {
                        connect: { id: newAccount.id }
                    },
                    description: 'Default Akun Penjualan ' + data.store.name,
                    action: 'goldSales'
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
                store_id_company_id_action: {
                    store_id: data.store_id,
                    company_id: data.store.company_id,
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
            const newAccount = await this.db.accounts.create({
                data: {
                    code: codePendapatan,
                    name: 'Penjualan Emas ' + data.store.name,
                    account_type: { connect: { id: 5 } },
                    description: 'Default Akun Penjualan ' + data.store.name,
                    store: { connect: { id: data.store_id } },
                    company: { connect: { id: data.store.company_id } },
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
                        connect: { id: data.store.company_id }
                    },
                    account: {
                        connect: { id: newAccount.id }
                    },
                    description: 'Default Akun Diskon Penjualan ' + data.store.name,
                    action: 'discountSales'
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
                store_id_company_id_action: {
                    store_id: data.store_id,
                    company_id: data.store.company_id,
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
            const newAccount = await this.db.accounts.create({
                data: {
                    code: codePiutang,
                    name: 'Piutang Usaha ' + data.store.name,
                    account_type: { connect: { id: 4 } },
                    description: 'Default Akun Piutang Usaha ' + data.store.name,
                    store: { connect: { id: data.store_id } },
                    company: { connect: { id: data.store.company_id } },
                    deactive: false,
                    // created_by: data.employee_id
                }
            });
            // Assign
            piutangAccount = await this.db.trans_Account_Settings.create({
                data: {
                    store: {
                        connect: { id: data.store_id }
                    },
                    company: {
                        connect: { id: data.store.company_id }
                    },
                    account: {
                        connect: { id: newAccount.id }
                    },
                    description: 'Default Akun Piutang Usaha ' + data.store.name,
                    action: 'piutang'
                },
                include: {
                    account: true
                }
            });
        }

        return piutangAccount;
    }

    //TODOELLA BUTUH LIHAT LAGI INI ASUMSI SOALNYA , GIMANA KALO MISAL TAX NYA ADA STORE_IDNYA
    async getTaxAccount(data: any) {
        var taxAccount = await this.db.trans_Account_Settings.findFirst({
            where: {
                store_id: data.store.id,
                company_id: data.store.company_id,
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
            const newAccount = await this.db.accounts.create({
                data: {
                    code: codeTax,
                    name: 'Hutang Pajak Penjualan ',
                    account_type: { connect: { id: 3 } },
                    description: 'Default Akun Pajak Penjualan ',
                    company: { connect: { id: data.store.company_id } },
                    deactive: false,
                    // created_by: data.employee_id
                }
            });
            // Assign
            taxAccount = await this.db.trans_Account_Settings.create({
                data: {
                    company: {
                        connect: { id: data.store.company_id }
                    },
                    store: {
                        connect: { id: data.store.id }
                    },
                    account: {
                        connect: { id: newAccount.id }
                    },
                    description: 'Default Akun Pajak Penjualan ' + data.store.name,
                    action: 'tax'
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
                store_id_company_id_action: {
                    store_id: data.store_id,
                    company_id: data.store.company_id,
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
                default:
                    name = 'Kas';
                    break;
            }

            const newAccount = await this.db.accounts.create({
                data: {
                    code: codeKas,
                    name: name + ' ' + data.store.name,
                    account_type: { connect: { id: 1 } },
                    description: 'Default ' + name + ' ' + data.store.name,
                    company: { connect: { id: data.store.company_id } },
                    deactive: false,
                    // created_by: data.employee_id
                }
            });
            // Assign
            paymentMethodAccount = await this.db.trans_Account_Settings.create({
                data: {
                    company: {
                        connect: { id: data.store.company_id }
                    },
                    account: {
                        connect: { id: newAccount.id }
                    },
                    description: 'Default Akun ' + name + ' ' + data.store.name,
                    action: 'pm' + type
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
                company_id: data.store.company_id,
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
            const newAccount = await this.db.accounts.create({
                data: {
                    code: codeStock,
                    name: 'PERSEDIAAN ' + data.store.name,
                    account_type: { connect: { id: 1 } },
                    description: 'Akun persediaan toko ',
                    company: { connect: { id: data.store.company_id } },
                    deactive: false,
                    // created_by: data.employee_id
                }
            });
            // Assign
            inventoryAccount = await this.db.trans_Account_Settings.create({
                data: {
                    company: {
                        connect: { id: data.store.company_id }
                    },
                    account: {
                        connect: { id: newAccount.id }
                    },
                    description: 'Default Akun persediaan toko ' + data.store.name,
                    action: 'persediaan'
                },
                include: {
                    account: true
                }
            });
        }
        return inventoryAccount;
    }
}
