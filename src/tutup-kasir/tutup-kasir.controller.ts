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
      date: new Date(newdata.date),
    }

    var validatedData = await this.validateService.validate(this.tkValidation.CREATE, sanitizedData);

    newdata = await this.tutupKasirService.create(validatedData);
    return ResponseDto.success('Data Created!', newdata, 201);    
  }

  @MessagePattern({ cmd: 'get:generate-tk-code' })
  @Describe('Get tutup kasir code')
  async getTutupKasirCoded (data: any) {
    const params = data.params;
    const newdata = data.body;

    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    var store_id =  (params.user.store_id && params.user.store_id.length > 0) ? params.user.store_id[0] : 'ea9bd13a-2ba6-4ec1-9bbf-225131d77ded';
    if (newdata.store_id) {
      store_id = newdata.store_id;
    }


    const result = await this.tutupKasirService.generateTkCode(store_id, year, month);
    return ResponseDto.success('Data Fetched!', result, 200);
  }

  // get tutupkasir
  @MessagePattern({ cmd: 'get:tutup-kasir' })
  @Describe('Get All Tutup Kasir') // SCOPE CABANG
  async getTutupKasir(data: any) {
    const params = data.params;
    const filters = data.body;
    var filtersValidated = await this.validateService.validate(this.tkValidation.FILTER, filters);
    if (filtersValidated.start_date) {
      if (filtersValidated.date === undefined) {
        filtersValidated.date = {};
      }
      filtersValidated.date.gte = new Date(filtersValidated.start_date);
      delete filtersValidated.start_date;
    } 
    if  (filtersValidated.end_date) {
      if (filtersValidated.date === undefined) {
        filtersValidated.date = {};
      }
      filtersValidated.date.lte = new Date(filtersValidated.end_date);
      delete filtersValidated.end_date;
    }
    console.log('filtersValidated', filtersValidated);
    const datas =  await this.tutupKasirService.findAll(filtersValidated);
    return ResponseDto.success('Data Retrieved!', datas, 200);
  }

  // findone
  @MessagePattern({ cmd: 'get:tutup-kasir/*' })
  @Describe('Get Tutup Kasir by id')
  async findOneTutupKasir(data: any) {
    const id = data.params.id;
    const result = await this.tutupKasirService.findOne(id);
    return ResponseDto.success('Data Retrieved!', result, 200);
  }

  // update
  @MessagePattern({ cmd: 'put:tutup-kasir/*' })
  @Describe('Update Tutup Kasir')
  async updateTutupKasir(data: any) {
    const newdata = data.body;
    const params = data.params;
    const id = params.id;
    var sanitizedData = {
      ...newdata,
      updated_by: params.user.id,
      updated_at: new Date(),
      tanggal_buka : new Date(newdata.tanggal_buka),
      date: new Date(newdata.date),
    }
    var validatedData = await this.validateService.validate(this.tkValidation.UPDATE, sanitizedData);
    const result = await this.tutupKasirService.update(id, validatedData);
    return ResponseDto.success('Data Updated!', result, 200);
  }
}
