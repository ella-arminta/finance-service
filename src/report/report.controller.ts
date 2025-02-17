import { Controller } from '@nestjs/common';
import { ReportService } from './report.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Describe } from 'src/decorator/describe.decorator';
import { ResponseDto } from 'src/common/response.dto';
import { ValidationService } from 'src/common/validation.service';
import { ReportValidation } from './report.validation';

@Controller()
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly validateService: ValidationService,
    private readonly reportValidation: ReportValidation,
  ) {}

    @MessagePattern({ cmd: 'get:profit-loss' })
    @Describe({
      description: 'Get Profit and Lost Statement',
      fe: [
        'finance/profit-loss:open'
      ]
    })
    async findOne(@Payload() data: any) {
      const params = data.params;
      const filters = data.body;
      const userId = params.user.id;
      var filtersValidated = await this.validateService.validate(this.reportValidation.FILTER, filters);
      const datas =  await this.reportService.getProfitLoss(userId,filtersValidated);

      return ResponseDto.success('Data Retrieved!', datas, 200);
    }

    @MessagePattern({ cmd: 'post:pdf-profit-loss'})
    @Describe({
        description: 'Generate PDF Profit and Lost Statement',
        fe: [
          'finance/profit-loss:open'
        ]
    })
    async postPdf(@Payload() data: any) {
      try {
        const filters = data.body.filters;
        const genData = data.body.data;
        const userId = data.params.user.id;
        const pdfBuffer = await this.reportService.generatePDF(userId,genData, filters);
        const pdfBase64 = pdfBuffer.toString('base64'); 
        return ResponseDto.success('PDF Generated Successfully!', { pdf: pdfBase64 });
      }
      catch (error) {
        return ResponseDto.error('Failed to generate PDF', error, 500);
      }
    }
}
