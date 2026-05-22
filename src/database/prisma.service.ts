import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected to database');

    // Enable query logging in development
    if (process.env.NODE_ENV === 'development') {
      this.$on('query' as never, (e: any) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Params: ${e.params}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from database');
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('cleanDatabase is not allowed in production');
    }
    const models = Reflect.ownKeys(this).filter(
      (key) =>
        typeof key === 'string' && !key.startsWith('_') && !key.startsWith('$'),
    );
    return Promise.all(
      models.map((modelKey) => {
        const model = this[modelKey as keyof PrismaService];
        if (model && typeof (model as any).deleteMany === 'function') {
          return (model as any).deleteMany();
        }
        return Promise.resolve();
      }),
    );
  }
}
