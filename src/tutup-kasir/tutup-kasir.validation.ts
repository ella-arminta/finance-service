import { Injectable } from '@nestjs/common';
import { ZodType, z } from 'zod';

@Injectable()
export class TutupKasirValidation {
  constructor() { }
  readonly CREATE = z.object({
    account_id: z.string().uuid({ message: "Account ID must be filled" }),
    date: z.preprocess((val) => {
      if (typeof val === "string" || typeof val === "number") {
        return new Date(val);
      }
      return val;
    }, z.date()),
    code: z.string(),
    created_at: z.date(),
    created_by: z.string().uuid(),
    updated_by: z.string().uuid(),
    updated_at: z.date(),
    saldo_awal: z.preprocess((val) => {
      if (typeof val === "string") return parseFloat(val);
      return val;
    }, z.number()),
    penjualan_cash: z.preprocess((val) => {
      if (typeof val === "string") return parseFloat(val);
      return val;
    }, z.number()),
    penjualan_transfer: z.preprocess((val) => {
      if (typeof val === "string") return parseFloat(val);
      return val;
    }, z.number()),
    total_penjualan: z.preprocess((val) => {
      if (typeof val === "string") return parseFloat(val);
      return val;
    }, z.number()),
    pembelian: z.preprocess((val) => {
      if (typeof val === "string") return parseFloat(val);
      return val;
    }, z.number()),
    pengeluaran: z.preprocess((val) => {
      if (typeof val === "string") return parseFloat(val);
      return val;
    }, z.number()),
    gadai: z.preprocess((val) => {
      if (typeof val === "string") return parseFloat(val);
      return val;
    }, z.number()),
    ambil_gadai: z.preprocess((val) => {
      if (typeof val === "string") return parseFloat(val);
      return val;
    }, z.number()),
    setor_pusat: z.preprocess((val) => {
      if (typeof val === "string") return parseFloat(val);
      return val;
    }, z.number()),
    account_pusat_id: z.string().uuid({ message: "Account Pusat ID must be filled" }),
    saldo_akhir: z.preprocess((val) => {
      if (typeof val === "string") return parseFloat(val);
      return val;
    }, z.number()),
    tanggal_buka: z.date(),
  });

  readonly FILTER: ZodType = z.object({
    store_id: z.string().uuid().optional(),
    start_date: z.preprocess((val) => {
      if (typeof val === 'string') {
        const parsed = new Date(val);
        if (!isNaN(parsed.getTime())) {
          // Ensure the date is in 'YYYY-MM-DD' format
          return parsed.toISOString().split('T')[0];
        }
      }
      return val;
    }, z.string().optional()),
    end_date: z.preprocess((val) => {
      if (typeof val === 'string') {
        const parsed = new Date(val);
        if (!isNaN(parsed.getTime())) {
          // Ensure the date is in 'YYYY-MM-DD' format
          return parsed.toISOString().split('T')[0];
        }
      }
      return val;
    }, z.string().optional()),
  });

  readonly UPDATE = z.object({
    account_id: z.string().uuid({ message: "Account ID must be filled" }).optional(),
    date: z.preprocess((val) => {
      if (typeof val === "string" || typeof val === "number") {
        return new Date(val);
      }
      return val;
    }, z.date()).optional(),
    code: z.string().optional(),
    created_at: z.date().optional(),
    created_by: z.string().uuid().optional(),
    updated_by: z.string().uuid().optional(),
    updated_at: z.date().optional(),
    saldo_awal: z.preprocess((val) => {
      if (typeof val === "string") return parseFloat(val);
      return val;
    }, z.number()).optional(),
    penjualan_cash: z.preprocess((val) => {
      if (typeof val === "string") return parseFloat(val);
      return val;
    }, z.number()).optional(),
    penjualan_transfer: z.preprocess((val) => {
      if (typeof val === "string") return parseFloat(val);
      return val;
    }, z.number()).optional(),
    total_penjualan: z.preprocess((val) => {
      if (typeof val === "string") return parseFloat(val);
      return val;
    }, z.number()).optional(),
    pembelian: z.preprocess((val) => {
      if (typeof val === "string") return parseFloat(val);
      return val;
    }, z.number()).optional(),
    pengeluaran: z.preprocess((val) => {
      if (typeof val === "string") return parseFloat(val);
      return val;
    }, z.number()).optional(),
    gadai: z.preprocess((val) => {
      if (typeof val === "string") return parseFloat(val);
      return val;
    }, z.number()).optional(),
    ambil_gadai: z.preprocess((val) => {
      if (typeof val === "string") return parseFloat(val);
      return val;
    }, z.number()).optional(),
    setor_pusat: z.preprocess((val) => {
      if (typeof val === "string") return parseFloat(val);
      return val;
    }, z.number()).optional(),
    account_pusat_id: z.string().uuid({ message: "Account Pusat ID must be filled" }),
    saldo_akhir: z.preprocess((val) => {
      if (typeof val === "string") return parseFloat(val);
      return val;
    }, z.number()).optional(),
    tanggal_buka: z.date().optional(),
  });
}
