import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountsModule } from './accounts/accounts.module';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { LoggerMiddleware } from './common/logger.middleware';
import { CompaniesModule } from './companies/companies.module';
import { DiscoveryModule } from '@nestjs/core';
import { StoresModule } from './stores/stores.module';
import { AccountTypesModule } from './account-types/account-types.module';
import { MessagePatternDiscoveryService } from './discovery/message-pattern-discovery.service';
import { TransactionModule } from './transaction/transaction.module';
import { TransTypeModule } from './trans-type/trans-type.module';

@Module({
  imports: [AccountsModule, DatabaseModule, CommonModule, CompaniesModule, DiscoveryModule, StoresModule, AccountTypesModule, TransactionModule, TransTypeModule],
  controllers: [AppController],
  providers: [AppService, MessagePatternDiscoveryService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');
  }
}
