import { PrismaClient, Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

export class BaseService<T> {
  constructor(
    private readonly prismaModel: keyof PrismaClient, // Restrict to PrismaClient keys
    readonly db: DatabaseService,
    protected relations: Record<string, any>,
    protected isSoftDelete = false,
  ) {}

  async create(data: T): Promise<T> {
    console.log('data in base service', data);
    return (this.db[this.prismaModel] as any).create({ 
      data,
      include: this.relations
    });
  }

  async findAll(params = {}, literal = false): Promise<T[]> {
    const whereConditions: Record<string, any> = {
      ...(this.isSoftDelete ? { deleted_at: null } : {}),
      ...params,
    };
  
    // Handle `LIKE` behavior for string parameters
    if (!literal) {
      for (const key in params) {
        const value = params[key];
        if (typeof value === 'string') {
          // Use 'contains' for wildcard matching (like `LIKE %value%`)
          whereConditions[key] = { contains: value };
        } else {
          whereConditions[key] = value;
        }
      }
    }
    console.log('where conditions',whereConditions);
  
    return (this.db[this.prismaModel] as any).findMany({
      where: whereConditions,
      include: this.relations,
    });
  }
  

  async findOne(id: any): Promise<T | null> {
    const whereConditions: Record<string, any> = {
      ...(this.isSoftDelete ? { id: id, deleted_at: null } : { id }),
    };
    console.log('where conditions',whereConditions);
    return (this.db[this.prismaModel] as any).findUnique({
      where: whereConditions,
      include: this.relations,
    });
  }

  async update(id: any, data: Partial<T>): Promise<T> {
    return (this.db[this.prismaModel] as any).update({ where: { id }, data });
  }

  async delete(id: any): Promise<T> {
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
}
