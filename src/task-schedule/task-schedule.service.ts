import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cron } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class TaskScheduleService {
    constructor(
        private readonly httpService: HttpService,
        private readonly db: DatabaseService,
    ) { }

    @Cron('0 11 * * *', {
        timeZone: 'Asia/Jakarta',
    })
    async handleCron() {
        try {
            const data = await this.scrapeDataGold();

        } catch (error) {
            console.log(`Cron job error: ${error.message}`);
        }
    }

    async scrapeDataGold(): Promise<any> {
        console.log('scraping gold value...');
        // const url = 'https://www.indogold.id/harga-emas-hari-ini';
        const url = 'https://www.anekalogam.co.id/id';

        try {
            const response = await firstValueFrom(
                this.httpService.get(url, {
                    headers: {
                        'User-Agent':
                            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
                    },
                }),
            );

            if (response.status !== 200) {
                throw new Error(`Failed to fetch data from ${url}`);
            }

            const html = response.data;
            const $ = cheerio.load(html);
            const harga: Record<string, string> = {};

            // Mencari tabel harga emas LM
            $('table.lm-table tbody tr').each((_, row) => {
                const gramText = $(row).find('td').first().text().trim().toLowerCase();

                if (gramText.includes('1gram')) {
                    const hargaJual = $(row)
                        .find('td')
                        .eq(1)
                        .text()
                        .replace(/[^\d]/g, '');
                    const hargaBeli = $(row)
                        .find('td')
                        .eq(2)
                        .text()
                        .replace(/[^\d]/g, '');

                    harga.hargaJual = parseInt(hargaBeli).toLocaleString('id-ID');
                    harga.hargaBeli = parseInt(hargaJual).toLocaleString('id-ID');
                }
            });

            if (!harga.hargaBeli || !harga.hargaJual) {
                throw new Error('Gagal mengambil harga untuk 1 gram Emas LM.');
            }

            const buyPriceParsed = parseInt(harga.hargaBeli.replace(/Rp|\./g, ""), 10);
            const sellPriceParsed = parseInt(harga.hargaJual.replace(/Rp|\./g, ""), 10);
            // Simpan ke database
            const newdata = await this.db.goldPrice.create({
                data: {
                    sellPrice: sellPriceParsed,
                    buyPrice: buyPriceParsed
                },
            });

            return newdata;
        } catch (error) {
            throw new Error(`Error fetching data: ${error.message}`);
        }
    }

    async getGoldPrice(filter: any = {}) {
        if (filter.end_date) {
            const endDate = new Date(filter.end_date);
            endDate.setHours(23, 59, 59, 999); // Set waktu ke 23:59:59.999
            filter.end_date = endDate; // Assign kembali ke filter.end_date
        }
        
        return this.db.goldPrice.findMany({
            where: {
                created_at: {
                    gte: filter.start_date ? new Date(filter.start_date) : undefined,
                    lte: filter.end_date ? new Date(filter.end_date) : undefined,
                },
            },    
            orderBy: {
                created_at: 'asc',
            },
        });
    }

    async getCurrentGoldPrice() {
        return this.db.goldPrice.findFirst({
            orderBy: {
                created_at: 'desc',
            },
        });
    }
}
