import { Injectable } from '@nestjs/common';
import { Account_Types } from '@prisma/client';
import { BaseService } from 'src/common/base.service';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class AccountTypesService extends BaseService<Account_Types> {
  constructor(db: DatabaseService) {
    const relations = {
    }
    super('account_Types', db, relations, true);
  }

  async generateCode(accountTypes: Account_Types, company_id: string): Promise<number> {
    const gencode = accountTypes.code; // Account type code as prefix
    let generatedCode: number;
  
    const startRange = gencode * Math.pow(10, 5 - gencode.toString().length);
    const endRange = startRange + Math.pow(10, 5 - gencode.toString().length) - 1;
  
    // Find the last code in the range
    const lastCode = await this.db.accounts.findFirst({
      where: {
        company_id: company_id,
        code: {
          gte: startRange, // Greater than or equal to startRange
          lte: endRange,  // Less than or equal to endRange
        },
      },
      orderBy: {
        code: 'desc', // Order by descending to get the largest code
      },
    });
  
    if (lastCode) {
      const lastCodeNumber = lastCode.code;
      const newCode = lastCodeNumber + 1; // Increment the last code
      generatedCode = newCode;
    } else {
      // No existing codes, start with `gencode00001`
      generatedCode = startRange + 1;
    }
  
    return generatedCode;
  }  

}
