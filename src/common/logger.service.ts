import { Global, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Global()
@Injectable()
export class LoggerService {
  private logFilePath: string;

  constructor() {
    this.logFilePath = path.join(__dirname, '../../../logs/error.log');
  }

  logErrorToFile(message: string, error: any) {
    const timestamp = new Date().toISOString();
    const errorMessage = `[${timestamp}] ${message}\n${error.stack || error}\n\n`;

    // Pastikan folder logs tersedia
    const logDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Tambahkan error ke file log
    fs.appendFileSync(this.logFilePath, errorMessage, 'utf8');
  }
}
