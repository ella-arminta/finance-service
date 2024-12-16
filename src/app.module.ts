import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MicroserviceController } from './microservice/microservice.controller';
import { AccountsModule } from './accounts/accounts.module';

@Module({
  imports: [AccountsModule],
  controllers: [AppController, MicroserviceController],
  providers: [AppService],
})
export class AppModule {}
