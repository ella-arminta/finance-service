import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TutupKasirService } from './tutup-kasir.service';
import { Describe } from 'src/decorator/describe.decorator';
import { ValidationService } from 'src/common/validation.service';
import { TutupKasirValidation } from './tutup-kasir.validation';
import { ResponseDto } from 'src/common/response.dto';

@Controller()
export class TutupKasirController {
  constructor(
    private readonly tutupKasirService: TutupKasirService,
    private readonly validateService: ValidationService,
    private readonly tkValidation: TutupKasirValidation,
  ) {}

  @MessagePattern({ cmd: 'post:tutup-kasir' })
  @Describe('Create Tutup Kasir') // SCOPE CABANG
  async tutupKasir(@Payload() data: any) {
    // TODOELLA NGEFIX ANGKA DIFRONTEND (transaction_id, debit kreditnya)
    var newdata = data.body;
    const params = data.params;

    //GENERATE TRANSACTION CODE  format : TK/YYMM/00001 
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const indexTransaction = await this.tutupKasirService.countTutupKasir(newdata.store_id, year, month) + 1;
    var Code = 'TK/' + year.toString().slice(-2) + month.toString().padStart(2, '0') + '/' + indexTransaction.toString().padStart(5, '0');

    var sanitizedData = {
      ...newdata,
      code: Code,
      created_by: params.user.id,
      updated_by: params.user.id,
      created_at: new Date(),
      updated_at: new Date(),
      tanggal_buka : new Date(newdata.tanggal_buka),
      trans_date: new Date(newdata.date),
    }

    var validatedData = await this.validateService.validate(this.tkValidation.CREATE, sanitizedData);

    newdata = await this.tutupKasirService.create(validatedData);
    return ResponseDto.success('Data Created!', newdata, 201);    
  }
}
