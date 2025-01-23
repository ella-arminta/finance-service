import { Module } from '@nestjs/common';
import { TutupKasirService } from './tutup-kasir.service';
import { TutupKasirController } from './tutup-kasir.controller';
import { TutupKasirValidation } from './tutup-kasir.validation';

@Module({
  controllers: [TutupKasirController],
  providers: [
    TutupKasirService,
    TutupKasirValidation
  ],
})
export class TutupKasirModule {}
