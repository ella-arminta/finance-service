import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MicroserviceController } from './microservice/microservice.controller';
import { AccountsModule } from './accounts/accounts.module';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [AccountsModule, DatabaseModule, CommonModule],
  controllers: [AppController, MicroserviceController],
  providers: [AppService],
})
export class AppModule {}
