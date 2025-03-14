import { Controller } from '@nestjs/common';
import { ActionAccountSettingService } from './action-account-setting.service';

@Controller()
export class ActionAccountSettingController {
  constructor(private readonly actionAccountSettingService: ActionAccountSettingService) {}
}
