import { Injectable } from '@nestjs/common';
import { Action_Account_Settings } from '@prisma/client';
import { BaseService } from 'src/common/base.service';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ActionAccountSettingService extends BaseService<Action_Account_Settings> {
    constructor(
            db: DatabaseService,
    ) {
        const relations = {
        }
        super('action_Account_Settings', db, relations);
    }

    async findOne(id?: any, query?: Record<string, any>) {
        // Gabungkan id dan query jika ada
        const whereConditions: Record<string, any> = {
            ...(id ? { action: id } : {}), // Hanya tambahkan `id` jika ada
            ...(query ?? {}), // Gabungkan query jika ada
        };
  
        return this.db.action_Account_Settings.findFirst({ // Use findFirst() instead of findUnique()
            where: whereConditions,
            include: this.relations,
        });
    }
}
