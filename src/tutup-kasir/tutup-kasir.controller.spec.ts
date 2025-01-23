import { Test, TestingModule } from '@nestjs/testing';
import { TutupKasirController } from './tutup-kasir.controller';
import { TutupKasirService } from './tutup-kasir.service';

describe('TutupKasirController', () => {
  let controller: TutupKasirController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TutupKasirController],
      providers: [TutupKasirService],
    }).compile();

    controller = module.get<TutupKasirController>(TutupKasirController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
