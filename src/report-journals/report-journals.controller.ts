import { Controller } from '@nestjs/common';
import { ReportService } from './report-journals.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Describe } from 'src/decorator/describe.decorator';
import { ResponseDto } from 'src/common/response.dto';
import { ValidationService } from 'src/common/validation.service';
import { ReportValidation } from './report-journals.validation';

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
      console.log('the first fitler',filters);
      var filtersValidated = await this.validateService.validate(this.reportValidation.FILTER, filters);
      const datas =  await this.reportService.getProfitLoss(userId,filtersValidated);

      return ResponseDto.success('Data Retrieved!', datas, 200);
    }

    @MessagePattern({ cmd: 'get:profit-loss-year' })
    @Describe({
      description: 'Get Profit and Lost Yearly Statement',
      fe: [
        'finance/profit-loss:open'
      ]
    })
    async profitLossYearly(@Payload() data: any) {
      const params = data.params;
      const filters = data.body;
      const userId = params.user.id;
      console.log('the first fitler',filters);
      var filtersValidated = await this.validateService.validate(this.reportValidation.FILTER, filters);
      // get the year of startdate
      filtersValidated.year = filtersValidated.start_date ? filtersValidated.start_date.getFullYear() : new Date().getFullYear(); // Add year to filters
      try {
        const datas =  await this.reportService.getProfitLossYearly(userId, filtersValidated);
        return ResponseDto.success('Data Retrieved!', datas, 200);
      } catch (error) {
        return ResponseDto.error('Failed to retrieve data', error, 500);
      }
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
        const filters = data.body;
        const genData = data.body.labelRangeSelected;
        const userId = data.params.user.id;
        console.log('data asdf', data, 'genData', genData);
        var filtersValidated = await this.validateService.validate(this.reportValidation.FILTER, filters);
        console.log(filtersValidated);
        const pdfBuffer = await this.reportService.generatePDF(userId,genData, filtersValidated);
        const pdfBase64 = pdfBuffer.toString('base64'); 
        return ResponseDto.success('PDF Generated Successfully!', { pdf: pdfBase64 });
      }
      catch (error) {
        console.error('[generatePDF error]', error); // ini akan kelihatan di log
        return ResponseDto.error('Failed to generate PDF', error, 500);
      }
    }

    // Ledger
    @MessagePattern({ cmd: 'get:trial-balance'})
    @Describe({
        description: 'Get Trial Balance',
        fe: [
          'finance/trial-balance:open'
        ]
    })
    async trialBalance(@Payload() data: any) {
      const params = data.params;
      const filters = data.body;
      const userId = params.user.id;
      console.log('filters',filters);

      // Change Filter Date Format
      if (filters.dateStart != null) {
        filters.dateStart = new Date(filters.dateStart);
      }
      if (filters.dateEnd != null) {
        var endDate = new Date(filters.dateEnd);
        endDate.setHours(23, 59, 59, 0); // Sets time to 23:59:59.000
        filters.dateEnd = endDate;
      }
      
      try {
        const datas =  await this.reportService.getTrialBalance(filters);
        return ResponseDto.success('Data Retrieved!', datas, 200);
      } catch (error) {
        return ResponseDto.error('Failed to retrieve data', error, 500);
      }
    }
    
    @MessagePattern({ cmd: 'get:ledger'})
    @Describe({
        description: 'Get Ledger',
        fe: [
          'finance/general-ledger/detail:open',
          'finance/general-ledger:detail',
        ]
    })
    async ledgerDetail(@Payload() data: any) {
      const params = data.params;
      const filters = data.body;
      const userId = params.user.id;

      // Change Filter Date Format
      if (filters.dateStart != null) {
        filters.dateStart = new Date(filters.dateStart);
      }
      if (filters.dateEnd != null) {
        var endDate = new Date(filters.dateEnd);
        endDate.setHours(23, 59, 59, 0); // Sets time to 23:59:59.000
        filters.dateEnd = endDate;
      }
      if (filters.account_id) {
          const accountIdsString = decodeURIComponent(filters.account_id).trim();    
          if (accountIdsString.startsWith('[') && accountIdsString.endsWith(']')) {
            filters.account_id = accountIdsString
              .slice(1, -1)
              .split(',')
              .map(id => id.trim().replace(/["']/g, ''))
              .filter(id => id !== ""); // Hapus elemen kosong
          }
      }
      // console.log('filters', filters);
    
      const datas =  await this.reportService.getLedger(filters);

      return ResponseDto.success('Data Retrieved!', datas, 200);
    }

    @MessagePattern({ cmd: 'get:sales-cards'})
    @Describe({
        description: 'Get Sales Count and Amount',
        fe: [
          'home:open',
        ]
    })
    async getSalesCards(@Payload() data: any) {
      const filters = data.body;

      console.log('filters prev',filters);
      function isValidDate(d: any) {
        return d instanceof Date && !isNaN(d.getTime());
      }
      
      const start = new Date(filters.start_date);
      if (isValidDate(start)) {
        filters.start_date = start;
      } else {
        filters.start_date = null;
      }
      
      const end = new Date(filters.end_date);
      if (isValidDate(end)) {
        end.setHours(23, 59, 59, 0);
        filters.end_date = end;
      } else {
        filters.end_date = null;
      }

      console.log('filters',filters);
    
      const datas =  await this.reportService.getSalesCards(filters);

      return ResponseDto.success('Data Retrieved!', datas, 200);
    }

    @MessagePattern({ cmd: 'get:sales-chart'})
    @Describe({
        description: 'Get Sales Count and Amount',
        fe: [
          'home:open',
        ]
    })
    async getSalesChart(@Payload() data: any) {
      const filters = data.body;

      console.log('filters prev',filters);
      function isValidDate(d: any) {
        return d instanceof Date && !isNaN(d.getTime());
      }
      
      const start = new Date(filters.start_date);
      if (isValidDate(start)) {
        filters.start_date = start;
      } else {
        filters.start_date = null;
      }
      
      const end = new Date(filters.end_date);
      if (isValidDate(end)) {
        end.setHours(23, 59, 59, 0);
        filters.end_date = end;
      } else {
        filters.end_date = null;
      }

      console.log('filters',filters);
    
      const datas =  await this.reportService.getSalesChart(filters);

      return ResponseDto.success('Data Retrieved!', datas, 200);
    }
}
