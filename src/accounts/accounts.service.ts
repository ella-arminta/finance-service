import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Accounts, Prisma } from '@prisma/client';
import { connect } from 'http2';
import { BaseService } from 'src/common/base.service';
import { CompaniesService } from 'src/companies/companies.service';
import { DatabaseService } from 'src/database/database.service';
import { RmqHelper } from 'src/helper/rmq.helper';
import { StoresService } from 'src/stores/stores.service';

@Injectable()
export class AccountsService extends BaseService<Accounts> {
  constructor(
    protected readonly companyService: CompaniesService,
    protected readonly storeService: StoresService,
    @Inject('TRANSACTION') private readonly transClient: ClientProxy,
    @Inject('INVENTORY') private readonly inventoryClient: ClientProxy,
    db: DatabaseService) {
    const relations = {
      store: true,
      account_type: true,
      company: true,
    }
    super('accounts', db, relations, true);
  }

  public accountDefaultCode = {
      1: 11001, // Kas
      5: 40000, // Pendapatan
      2: 60000, // Beban
      4: 12000, // Piutang
      3: 21001, // Hutang
      8: 80000, // Biaya Lain-lain
      7: 70000  // Pendapatan Lain-lain
  };


  async generateDefaultAccountsByComp(company_id: string) {
    var company = await this.companyService.findOne(company_id);
    if (!company) {
      throw new Error('Company not found');
    }
    var lastCodeForKas = await this.findAll({ company_id: company_id, account_type_id: 1 }, true, { code: 'desc' });
    var codeKas = 11001;
    if (lastCodeForKas.length > 0) {
      var lastCode = lastCodeForKas[0].code;
      codeKas = lastCode + 1;
    }
    var lastCodeForHutang = await this.findAll({ company_id: company_id, account_type_id: 3 }, true, { code: 'desc' });
    var codeHutang = 21001;
    if (lastCodeForHutang.length > 0) {
      var lastCode = lastCodeForHutang[0].code;
      codeHutang = lastCode + 1;
    }

    var defaultAccount = [
      {
        code: codeKas++,
        name: 'KAS ' + company.name.toUpperCase(),
        deactive: false,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        company: {
          connect: { id: company_id },
        },
        account_type: {
          connect: { id: 1 },
        }
      },
      {
        code: codeHutang++,
        name: 'HUTANG DAGANG PERUSAHAAN X',
        deactive: false,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        company: {
          connect: { id: company_id },
        },
        account_type: {
          connect: { id: 3 },
        }
      },
      {
        code: codeHutang++,
        name: 'HUTANG PAJAK PENJUALAN',
        deactive: false,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        company: {
          connect: { id: company_id },
        },
        account_type: {
          connect: { id: 3 },
        }
      },
    ]
    var result = [];
    for (let account of defaultAccount) {
      var accountExist = await this.findAll({ code: account.code, company_id: account.company.connect.id }, true);
      if (accountExist.length > 0) {
        console.log('accountExist', accountExist);
        console.log('the account', account);
        continue;
      }
      var newAccount = await this.create(account);
      result.push(newAccount);
    }

    return result;
  }

  async generateDefaultAccountsByStore(store_id) {
    const store = await this.storeService.findOne(store_id);
    const company_id = store.company_id;
    
    const latestCodes = await Promise.all(Object.entries(this.accountDefaultCode).map(async ([id, defaultCode]) => {
      const lastAccount = await this.findAll({ company_id, account_type_id: Number(id) }, true, { code: 'desc' });
      return { account_type_id: Number(id), code: lastAccount.length ? lastAccount[0].code + 1 : defaultCode };
    }));
  
    
    const codeMap = Object.fromEntries(latestCodes.map(({ account_type_id, code }) => [account_type_id, code]));
    
    const accounts = [
        { type: 1, name: 'KAS', actions: ['pm1'] },
        { type: 1, name: 'BANK', actions: ['pm2'] },
        { type: 1, name: 'KAS CREDIT CARD', actions: ['pm3'] },
        { type: 1, name: 'KAS DEBIT CARD', actions: ['pm4'] },
        { type: 5, name: 'PENJUALAN', actions: ['goldSales'] },
        { type: 7, name: 'PENDAPATAN LAIN-LAIN' },
        { type: 2, name: 'BEBAN GAJI KARYAWAN' },
        { type: 2, name: 'BIAYA TELEPON' },
        { type: 2, name: 'BIAYA SEWA' },
        { type: 2, name: 'BIAYA IKLAN' },
        { type: 8, name: 'BIAYA LAIN-LAIN' },
        { type: 4, name: 'PIUTANG', actions: ['piutang'] },
        { type: 3, name: 'HUTANG' },
        { type: 5, name: 'DISKON PENJUALAN', actions: ['discountSales'] },
        { type: 1, name: 'PERSEDIAAN', actions: ['persediaan'] },
        { type: 2, name: 'Beban Kerugian Barang Hilang', actions: ['lost', 'other'] },
        { type: 1, name: 'Persediaan dalam reparasi', actions: ['repair'] },
        { type: 2, name: 'Beban Penyusutan Reparasi Emas', actions: ['repairDeprec'] },
        { type: 1, name: 'Harga Pokok Penjualan', actions: ['cogs'] },
    ].map(({ type, name, actions = [] }) => ({
        company: { connect: { id: company_id } },
        code: codeMap[type]++,
        name: `${name} ${store.name.toUpperCase()}`,
        account_type: { connect: { id: type } },
        deactive: false,
        created_at: new Date(),
        updated_at: new Date(),
        store: { connect: { id: store_id } },
        deleted_at: null,
        actions: actions
    }));

    for (const account of accounts) {
        const existingAccount = await this.findAll({ code: account.code, company_id, account_type_id: account.account_type.connect.id }, true);
        if (existingAccount.length) {
            console.log('Account already exists:', existingAccount);
            console.log('Account to create:', account);
            continue;
        }
        const accountActions = account.actions;
        delete account.actions;
        const newAccount = await this.create(account);
        console.log('New account created:', newAccount);

        if (accountActions) {
          for (const action of accountActions) {
            await this.db.trans_Account_Settings.create({
                data: {
                  account: { connect: { id: newAccount.id } },
                  maction: { connect: { action } },
                  store: { connect: { id: store_id }}
                }
            });
          }
        }
    }

    // Trans Account Settings For Account Scope Company
    const accountScopeCompany = [
        { action: 'tax', name: 'HUTANG PAJAK PENJUALAN' },
    ];
    for (const account of accountScopeCompany) {
        const accountData = await this.findAll({ name: account.name, company_id }, false);
        if (accountData.length) {
            await this.db.trans_Account_Settings.create({
                data: {
                  account: { connect: { id: accountData[0].id } },
                  maction: { connect: { action: account.action } },
                  store: { connect: { id: store_id }}
                }
            });
        }
    }
    
    return accounts;
  }

  async create(data: Prisma.AccountsCreateInput): Promise<Accounts> {
    // console.log('data in base service', data);
    const newdata = await this.db.accounts.create({ 
      data,
      include: this.relations
    });

    return newdata;
  }

  async delete(id: any){
    const deletedData = await this.findOne(id);
    if (deletedData == null) {
      console.log('data not found');
      return null;
    }

    if (this.isSoftDelete) {
      const result =await  this.db.accounts.update({
        where: { id },
        data: { deleted_at: new Date() },
      });
    } else {
      const result =  await this.db.accounts.delete({
        where: { id },
      });
    }

    return deletedData;
  }

  async update(id: any, data: Prisma.AccountsUpdateInput) {
    const updatedData = await this.db.accounts.update({ where: { id }, data });
    return updatedData;
  }
}
