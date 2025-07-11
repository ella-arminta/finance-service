import { PrismaClient, Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { ResponseDto } from './response.dto';

export class BaseService<T> {
  constructor(
    private readonly prismaModel: keyof PrismaClient, // Restrict to PrismaClient keys
    readonly db: DatabaseService,
    protected relations: Record<string, any>,
    protected isSoftDelete = false,
  ) {}

  async create(data: any, user_id: string | null = null): Promise<T> {
    // console.log('data in base service', data);
    const newdata = await (this.db[this.prismaModel] as any).create({ 
      data,
      include: this.relations
    });
    await this.db.action_Log.create({
      data: {
        user_id: user_id,
        event: 'CREATE',
        resource: this.prismaModel as string,
        diff: JSON.stringify(data)
      },
    })
    return newdata;
  }

  async findAll(params = {}, literal = false, orderBy: Record<string, 'asc' | 'desc'> = {}): Promise<T[]> {
    const whereConditions: Record<string, any> = {
      ...(this.isSoftDelete ? { deleted_at: null } : {}),
      ...params,
    };
  
    // Handle `LIKE` behavior for string parameters
    if (!literal) {
      for (const key in params) {
        const value = params[key];
        if (typeof value === 'string') {
          if (key.includes('id')) {
            continue;
          }
          // Use 'contains' for wildcard matching (like `LIKE %value%`)
          whereConditions[key] = { contains: value };
        } else {
          whereConditions[key] = value;
        }
      }
    }
    // console.log('where conditions',whereConditions);
  
    return (this.db[this.prismaModel] as any).findMany({
      where: whereConditions,
      include: this.relations,
      orderBy
    });
  }
  

  async findOne(id?: any, query?: Record<string, any>) {
      // Gabungkan id dan query jika ada
      const whereConditions: Record<string, any> = {
          ...(id ? { id } : {}), // Hanya tambahkan `id` jika ada
          ...(this.isSoftDelete ? { deleted_at: null } : {}), // Tambahkan filter soft delete
          ...(query ?? {}), // Gabungkan query jika ada
      };

      return id 
          ? (this.db[this.prismaModel] as any).findUnique({
              where: { id },
              include: this.relations,
          })
          : (this.db[this.prismaModel] as any).findFirst({ // Use findFirst() instead of findUnique()
              where: whereConditions,
              include: this.relations,
          });
  }


  async update(id: any, data: Partial<T>, user_id: string | null = null) {
    const updatedData = await (this.db[this.prismaModel] as any).update({ where: { id }, data });
    await this.db.action_Log.create({
      data: {
        user_id: user_id,
        event: 'UPDATE',
        resource: this.prismaModel as string,
        diff: JSON.stringify(data)
      },
    })
    return updatedData;
  }

  async delete(id: any, user_id: string | null = null) {
    const deletedData = await this.findOne(id);
    if (deletedData == null) {
      console.log('data not found');
      return null;
    }

    var successFulldelete;
    if (this.isSoftDelete) {
      successFulldelete = await  (this.db[this.prismaModel] as any).update({
        where: { id },
        data: { deleted_at: new Date() },
      });
    } else {
      successFulldelete = await (this.db[this.prismaModel] as any).delete({
        where: { id },
      });
    }

    await this.db.action_Log.create({
      data: {
        user_id: user_id,
        event: 'DELETE',
        resource: this.prismaModel as string,
        diff: JSON.stringify(id)
      },
    })

    return successFulldelete;
  }

  async deleteAll(params = {}, user_id:string|null =null) {
    const whereConditions: Record<string, any> = {
      ...(this.isSoftDelete ? { deleted_at: null } : {}),
      ...params,
    };
  
    const deleted = await (this.db[this.prismaModel] as any).deleteMany({
      where: whereConditions,
    });

    await this.db.action_Log.create({
      data: {
        user_id: user_id,
        event: 'DELETEALL',
        resource: this.prismaModel as string,
        diff: JSON.stringify(deleted)
      },
    })

    return  deleted;
  }

  async sync(data: any[]) {
    const datas = await Promise.all(
      data.map((d) =>
        (this.db[this.prismaModel] as any).upsert({
          where: { id: d.id },
          update: d,
          create: d,
        })
      )
    );
    return ResponseDto.success('Data synced!', datas);
  }
}
