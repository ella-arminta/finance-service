import { Injectable } from '@nestjs/common';
import { Accounts } from '@prisma/client';
import { BaseService } from 'src/common/base.service';
import { CompaniesService } from 'src/companies/companies.service';
import { DatabaseService } from 'src/database/database.service';
import { StoresService } from 'src/stores/stores.service';

@Injectable()
export class AccountsService extends BaseService<Accounts> {
  constructor(
    protected readonly companyService: CompaniesService,
    protected readonly storeService: StoresService,
    db: DatabaseService) {
    const relations = {
      store: true,
      account_type: true,
      company: true,
    }
    super('accounts', db, relations, true);
  }

  async generateDefaultAccountsByComp(company_id: string) {
    var company = await this.companyService.findOne(company_id);
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
        code: codeKas,
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
        code: codeHutang,
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
    ]
    var result = [];
    for (let account of defaultAccount) {
      var accountExist = await this.findAll({ code: account.code, company_id: account.company.connect.id }, true);
      if (accountExist.length > 0) {
        continue;
      }
      var newAccount = await this.create(account);
      result.push(newAccount);
    }
    return result;
  }

  async generateDefaultAccountsByStore(store_id: string) {
    var store = await this.storeService.findOne(store_id);
    // code kas
    var lastCodeForKas = await this.findAll({ company_id: store.company_id, account_type_id: 1 }, true, { code: 'desc' });
    var codeKas = 11001;
    if (lastCodeForKas.length > 0) {
      var lastCode = lastCodeForKas[0].code;
      codeKas = lastCode + 1;
    }
    // code pendapatan
    var lastCodeForPendapatan = await this.findAll({ company_id: store.company_id, account_type_id: 5 }, true, { code: 'desc' });
    var codePendapatan = 40000;
    if (lastCodeForPendapatan.length > 0) {
      var lastCode = lastCodeForPendapatan[0].code;
      codePendapatan = lastCode + 1;
    }
    // code beban
    var lastCodeForBeban = await this.findAll({ company_id: store.company_id, account_type_id: 2 }, true, { code: 'desc' });
    var codeBeban = 60000;
    if (lastCodeForBeban.length > 0) {
      var lastCode = lastCodeForBeban[0].code;
      codeBeban = lastCode + 1;
    }

    // code piutang
    var lastCodeForPiutang = await this.findAll({ company_id: store.company_id, account_type_id: 4 }, true, { code: 'desc' });
    var codePiutang = 12000;
    if (lastCodeForPiutang.length > 0) {
      var lastCode = lastCodeForPiutang[0].code;
      codePiutang = lastCode + 1;
    }

    var defaultAccount = [
      {
        company: {
          connect: { id: store.company_id },
        },
        code: codeKas,
        name: 'KAS ' + store.name.toUpperCase(),
        account_type : {
          connect: { id: 1 },
        },
        deactive: false,
        created_at: new Date(),
        updated_at: new Date(),
        store: {
          connect: { id: store_id },
        },
      },
      {
        company : {
          connect: { id: store.company_id },
        },
        code: codePendapatan++,
        name: 'PENDAPATAN EMAS BATANGAN ' + store.name.toUpperCase(),
        account_type : {
          connect: { id: 5 },
        },
        deactive: false,
        created_at: new Date(),
        updated_at: new Date(),
        store: {
          connect: { id: store_id },
        },
        deleted_at: null,
      },
      {
        company : {
          connect: { id: store.company_id },
        },
        code: codePendapatan++,
        name: 'PENDAPATAN PERHIASAN ' + store.name.toUpperCase(),
        account_type : {
          connect: { id: 5 },
        },
        deactive: false,
        created_at: new Date(),
        updated_at: new Date(),
        store: {
          connect: { id: store_id },
        },
        deleted_at: null,
      },
      {
        company : {
          connect: { id: store.company_id },
        },
        code: codeBeban++,
        name: 'BEBAN GAJI KARYAWAN ' +store.code.toUpperCase(),
        account_type : {
          connect: { id: 2 },
        },
        deactive: false,
        created_at: new Date(),
        updated_at: new Date(),
        store: {
          connect: { id: store_id },
        },
        deleted_at: null,
      },
      {
        company : {
          connect: { id: store.company_id },
        },
        code: codeBeban++,
        name: 'BIAYA TELEPON ' +store.code.toUpperCase(),
        account_type : {
          connect: { id: 2 },
        },
        deactive: false,
        created_at: new Date(),
        updated_at: new Date(),
        store: {
          connect: { id: store_id },
        },
        deleted_at: null,
      },
      {
        company : {
          connect: { id: store.company_id },
        },
        code: codeBeban++,
        name: 'BIAYA SEWA ' +store.code.toUpperCase(),
        account_type : {
          connect: { id: 2 },
        },
        deactive: false,
        created_at: new Date(),
        updated_at: new Date(),
        store: {
          connect: { id: store_id },
        },
        deleted_at: null,
      },
      {
        company : {
          connect: { id: store.company_id },
        },
        code: codeBeban++,
        name: 'BIAYA IKLAN ' +store.code.toUpperCase(),
        account_type : {
          connect: { id: 2 },
        },
        deactive: false,
        created_at: new Date(),
        updated_at: new Date(),
        store: {
          connect: { id: store_id },
        },
        deleted_at: null,
      },
      {
        company : {
          connect: { id: store.company_id },
        },
        code: codeBeban++,
        name: 'BIAYA LAIN-LAIN ' +store.code.toUpperCase(),
        account_type : {
          connect: { id: 2 },
        },
        deactive: false,
        created_at: new Date(),
        updated_at: new Date(),
        store: {
          connect: { id: store_id },
        },
        deleted_at: null,
      },
      {
        company : {
          connect: { id: store.company_id },
        },
        code: codePiutang,
        name: 'PIUTANG ' + store.name.toUpperCase(),
        account_type : {
          connect: { id: 4 },
        },
        deactive: false,
        created_at: new Date(),
        updated_at: new Date(),
        store: {
          connect: { id: store_id },
        },
        deleted_at: null,
      },
      {
        company : {
          connect: { id: store.company_id },
        },
        code: codeBeban++,
        name: 'DISKON PENJUALAN ' + store.name.toUpperCase(),
        account_type : {
          connect: { id: 2 },
        },
        deactive: false,
        created_at: new Date(),
        updated_at: new Date(),
        store: {
          connect: { id: store_id },
        },
        deleted_at: null,
      },
    ]
    var result = [];
    for (let account of defaultAccount) {
      var accountExist = await this.findAll({ code: account.code, company_id: account.company.connect.id }, true);
      if (accountExist.length > 0) {
        continue;
      }
      var newAccount = await this.create(account);
      result.push(newAccount);
    }
    return result;
  }
}
