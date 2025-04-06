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

    @Cron('*/10 * * * *', {
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
        const url = 'https://www.indogold.id/harga-emas-hari-ini';

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

            $('.rectangle-card').each((_, element) => {
                const produk = $(element).find('.subtitle').text().trim();
                const tabel = $(element).find('table');
        
                // Cek apakah produk adalah Emas 99.5%
                if (produk.includes('Emas 99.5%')) {
                tabel.find('tbody tr').each((_, row) => {
                    const pecahan = $(row).find('td').first().text().trim();
                    let hargaBeli = $(row).find('td').eq(1).text().trim();
                    let hargaJual = $(row).find('td').eq(2).text().trim();
        
                    // Cek jika pecahan adalah 1 gram
                    if (pecahan === '1.0 Gram') {
                        hargaBeli = hargaBeli.replace('Rp. ', '').replace(',', '.');
                        hargaJual = hargaJual.replace('Rp. ', '').replace(',', '.');
            
                        harga.sellPrice = hargaBeli;
                        harga.buyPrice = hargaJual;
                    }
                });
                }
            });

            if (!harga.sellPrice || !harga.buyPrice) {
                throw new Error('Failed to extract Harga Jual or Harga Beli.');
            }

            const buyPriceParsed = parseInt(harga.buyPrice.replace(/Rp|\./g, ""), 10);
            const sellPriceParsed = parseInt(harga.sellPrice.replace(/Rp|\./g, ""), 10);
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

    // async scrapeData(): Promise<any> {
    //     const url = 'https://www.indogold.id/harga-emas-hari-ini';
    //     try {
    //       const response = await axios.get(url, {
    //         headers: {
    //           'User-Agent':
    //             'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
    //         },
    //       });
    
    //       if (response.status !== 200) {
    //         throw new Error(Failed to fetch data from ${url});
    //       }
    
    //       const html = response.data;
    //       const $ = cheerio.load(html);
    //       const harga: Record<string, string> = {};
    
    //       // Menyaring harga hanya untuk produk "Emas 99.5%" untuk 1 gram
    //       $('.rectangle-card').each((_, element) => {
    //         const produk = $(element).find('.subtitle').text().trim();
    //         const tabel = $(element).find('table');
    
    //         // Cek apakah produk adalah Emas 99.5%
    //         if (produk.includes('Emas 99.5%')) {
    //           tabel.find('tbody tr').each((_, row) => {
    //             const pecahan = $(row).find('td').first().text().trim();
    //             let hargaBeli = $(row).find('td').eq(1).text().trim();
    //             let hargaJual = $(row).find('td').eq(2).text().trim();
    
    //             // Cek jika pecahan adalah 1 gram
    //             if (pecahan === '1.0 Gram') {
    //               hargaBeli = hargaBeli.replace('Rp. ', '').replace(',', '.');
    //               hargaJual = hargaJual.replace('Rp. ', '').replace(',', '.');
    
    //               harga.hargaBeli = hargaBeli;
    //               harga.hargaJual = hargaJual;
    //             }
    //           });
    //         }
    //       });
    
    //       if (!harga.hargaBeli || !harga.hargaJual) {
    //         throw new Error('Failed to extract prices for 1 gram of Emas 99.5%.');
    //       }
    
    //       console.log(harga);
    //       return harga;
    //     } catch (error) {
    //       console.error('Error scraping data:', error);
    //       throw error;
    //     }
    // }

    async getGoldPrice(filter: any = {}) {
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
