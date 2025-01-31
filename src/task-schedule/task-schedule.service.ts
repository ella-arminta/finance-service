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

    @Cron('50 11 * * *', {
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
        const url = 'https://anekalogam.co.id/id';

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
            // Cari harga jual
            const sellPrice = $('h2.ngc-title')
                .filter((_, el) => $(el).text().trim() === 'Harga Jual')
                .next('.content')
                .find('span.tprice')
                .text()
                .trim();

            // Cari harga beli
            const buyPrice = $('h2.ngc-title')
                .filter((_, el) => $(el).text().trim() === 'Harga Beli')
                .next('.content')
                .find('span.tprice')
                .first()
                .text()
                .trim();

            if (!sellPrice || !buyPrice) {
                throw new Error('Failed to extract Harga Jual or Harga Beli.');
            }

            const buyPriceParsed = parseInt(buyPrice.replace(/Rp|\./g, ""), 10);
            const sellPriceParsed = parseInt(sellPrice.replace(/Rp|\./g, ""), 10);
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
        return this.db.goldPrice.findMany({
            where: {
                created_at: {
                    gte: filter.start_date ? new Date(filter.start_date) : undefined,
                    lte: filter.end_date ? new Date(filter.end_date) : undefined,
                },
            },    
            orderBy: {
                created_at: 'desc',
            },
        });
    }
}
