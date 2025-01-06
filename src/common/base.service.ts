import { PrismaClient, Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

export class BaseService<T> {
  constructor(
    private readonly prismaModel: keyof PrismaClient, // Restrict to PrismaClient keys
    readonly db: DatabaseService
  ) {}

  async create(data: T): Promise<T> {
    return (this.db[this.prismaModel] as any).create({ data });
  }

  async findAll(): Promise<T[]> {
    return (this.db[this.prismaModel] as any).findMany();
  }

  async findOne(id: number): Promise<T | null> {
    return (this.db[this.prismaModel] as any).findUnique({ where: { id } });
  }

  async update(id: number, data: Partial<T>): Promise<T> {
    return (this.db[this.prismaModel] as any).update({ where: { id }, data });
  }

  async delete(id: number): Promise<T> {
    return (this.db[this.prismaModel] as any).delete({ where: { id } });
  }
}
