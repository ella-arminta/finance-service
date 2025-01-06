import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MicroserviceController } from './microservice/microservice.controller';
import { AccountsModule } from './accounts/accounts.module';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { LoggerMiddleware } from './common/logger.middleware';
import { CompaniesModule } from './companies/companies.module';

@Module({
  imports: [AccountsModule, DatabaseModule, CommonModule, CompaniesModule],
  controllers: [AppController, MicroserviceController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');
  }
}
