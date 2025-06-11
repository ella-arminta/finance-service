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
import { TutupKasirModule } from './tutup-kasir/tutup-kasir.module';
import { JournalsModule } from './journals/journals.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskScheduleModule } from './task-schedule/task-schedule.module';
import { SharedModule } from './shared.module';
import { RecurringModule } from './recurring/recurring.module';
import { ReportModule } from './report-journals/report-journals.module';
import { TransAccountSettingsModule } from './trans-account-settings/trans-account-settings.module';
import { ReportStocksModule } from './report-stocks/report-stocks.module';
import { OperationModule } from './operation/operation.module';
import { ActionAccountSettingModule } from './action-account-setting/action-account-setting.module';
import { PayableReceivableModule } from './payable-receivable/payable-receivable.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config'; 

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AccountsModule, 
    DatabaseModule, 
    CommonModule, 
    CompaniesModule,
    DiscoveryModule, 
    StoresModule, 
    AccountTypesModule, 
    TransactionModule, 
    TransTypeModule, 
    TutupKasirModule, 
    JournalsModule, 
    ScheduleModule.forRoot(), 
    TaskScheduleModule, 
    RecurringModule, 
    ReportModule,
    SharedModule,
    TransAccountSettingsModule,
    ReportStocksModule,
    OperationModule,
    ActionAccountSettingModule,
    PayableReceivableModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST'),
          port: +config.get<number>('MAIL_PORT'),
          secure: true,
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASS'),
          },
        },
        defaults: {
          from: config.get('MAIL_FROM'),
        },
        template: {
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),

  ],
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
