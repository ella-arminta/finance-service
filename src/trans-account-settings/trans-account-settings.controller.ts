import { Controller } from '@nestjs/common';
import { TransAccountSettingsService } from './trans-account-settings.service';

@Controller()
export class TransAccountSettingsController {
  constructor(private readonly transAccountSettingsService: TransAccountSettingsService) {}
}
