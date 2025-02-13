import { Controller } from '@nestjs/common';
import { JournalsService } from './journals.service';
import { MessagePattern } from '@nestjs/microservices';
import { Describe } from 'src/decorator/describe.decorator';
import { ResponseDto } from 'src/common/response.dto';

@Controller()
export class JournalsController {
  constructor(
    private readonly journalsService: JournalsService
  ) {}

  @MessagePattern({ cmd: 'get:journal' })
  @Describe({
    description: 'Get Journals',
    fe: [
      'finance/journal:open'
    ]
  })
  async get() {
    const data = await this.journalsService.getReport();
    return ResponseDto.success('Data Found!', data, 200);
  }

  @MessagePattern({ cmd: 'get:ledger' })
  @Describe({
    description: 'Get Ledger',
    fe: [
      'finance/general-ledger:open'
    ]
  })
  async getLedger() {
    // { data: 'infoacc', title: 'Info Acc' },
    // { data: 'date', title: 'Date' },
    // { data: 'code', title: 'Trans Code' },
    // { data: 'description', title: 'Description' },
    // { data: 'Debit', title: 'Debit', sum:true },
    // { data: 'Kredit', title: 'Kredit', sum:true },
    // { data: 'Balance', title: 'Balance', sum:true },
    const data = [
      {
        'infoacc': '11002',
        'date': '2021-09-01',
        'code': 'UML/01/2407/00015',
        'description': 'Saldo Awal',
        'Debit': 0,
        'Kredit': 1,
        'Balance': 0
      },
      {
        'infoacc': '11002',
        'date': '2021-09-15',
        'code': 'UML/01/2407/00015',
        'description': '|tambahan modal	',
        'Debit': 0,
        'Kredit': 200000,
        'Balance': -200000
      },
    ];
    return ResponseDto.success('Data Found!', data, 200);
  }
}
