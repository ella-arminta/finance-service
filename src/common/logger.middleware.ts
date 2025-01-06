import { Injectable, NestMiddleware } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const start = Date.now();
    const logFilePath = path.join(__dirname, '../logs/log-duration.txt'); // Tentukan lokasi file log

    // Pastikan direktori logs ada
    if (!fs.existsSync(path.dirname(logFilePath))) {
      fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
    }

    res.on('finish', () => {
      const duration = Date.now() - start;
      const logMessage = `Request to ${req.method} ${req.url} - Status: ${res.statusCode} - Duration: ${duration}ms\n`;

      // Append log ke file
      fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) {
          console.error('Error writing log:', err);
        }
      });
    });

    next();
  }
}
