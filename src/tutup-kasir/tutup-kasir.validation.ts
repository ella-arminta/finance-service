import { Injectable } from '@nestjs/common';
import { ZodType, z } from 'zod';

@Injectable()
export class TutupKasirValidation {
  constructor() {}
  readonly CREATE = z.object({
    account_id: z.string().uuid(),
    code: z.string(),
    created_at: z.date(),
    created_by: z.string().uuid(),
    updated_by: z.string().uuid(),
    updated_at: z.date(),
    saldo_awal: z.number().int(),
    penjualan_cash: z.number().int(),
    penjualan_transfer: z.number().int(),
    total_penjualan: z.number().int(),
    pembelian: z.number().int(),
    pengeluaran: z.number().int(),
    gadai: z.number().int(),
    ambil_gadai: z.number().int(),
    setor_pusat: z.number().int(),
    account_pusat: z.string().uuid(),
    saldo_akhir: z.number().int(),
    tanggal_buka: z.date(),
  });
}
