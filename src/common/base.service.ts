import { PrismaClient, Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

export class BaseService<T> {
  constructor(
    private readonly prismaModel: keyof PrismaClient, // Restrict to PrismaClient keys
    readonly db: DatabaseService,
    protected relations: Record<string, any>,
    protected isSoftDelete = false,
  ) {}

  async create(data: any): Promise<T> {
    // console.log('data in base service', data);
    return (this.db[this.prismaModel] as any).create({ 
      data,
      include: this.relations
    });
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


  async update(id: any, data: Partial<T>) {
    return (this.db[this.prismaModel] as any).update({ where: { id }, data });
  }

  async delete(id: any){
    const deletedData = await this.findOne(id);
    if (deletedData == null) {
      console.log('data not found');
      return null;
    }

    if (this.isSoftDelete) {
      return  (this.db[this.prismaModel] as any).update({
        where: { id },
        data: { deleted_at: new Date() },
      });
    }
    return (this.db[this.prismaModel] as any).delete({
      where: { id },
    });
  }

  async deleteAll(params = {}) {
    const whereConditions: Record<string, any> = {
      ...(this.isSoftDelete ? { deleted_at: null } : {}),
      ...params,
    };
  
    return (this.db[this.prismaModel] as any).deleteMany({
      where: whereConditions,
    });
  }
}
