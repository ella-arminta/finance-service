import { Controller } from '@nestjs/common';
import { TransAccountSettingsService } from './trans-account-settings.service';
import { ValidationService } from 'src/common/validation.service';
import { TransAccountSettingsValidation } from './trans-account-settings.validation';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Describe } from 'src/decorator/describe.decorator';
import { ResponseDto } from 'src/common/response.dto';

@Controller()
export class TransAccountSettingsController {
  constructor(
    private readonly transAccountSettingsService: TransAccountSettingsService,
    private validationService: ValidationService,
    private readonly tacValidation: TransAccountSettingsValidation,
  ) {}

  @MessagePattern({ cmd: 'post:trans-account-setting' })
  @Describe({
    description: 'Create a new trans account setting',
    fe: ['master/page-account-setting:add', 'master/page-account-setting:open'],
  })
  async create(@Payload() data: any) {
    var newdata = data.body;
    newdata.store_id = newdata.auth.store_id;
    var validatedData = await this.validationService.validate(
      this.tacValidation.CREATE,
      newdata,
    );
    var newData = await this.transAccountSettingsService.create(
      validatedData,
      data.params.user.id,
    );

    if (!newData) {
      return ResponseDto.error(
        'Failed to create account',
        [
          {
            message: 'Failed to create account',
            field: 'account',
            code: 'failed',
          },
        ],
        400,
      );
    }

    return ResponseDto.success('Account created successfully', newData);
  }

  @MessagePattern({ cmd: 'get:trans-account-setting' })
  @Describe({
    description: 'find trans account setting',
    fe: ['master/page-account-setting:open'],
  })
  async findAll(@Payload() data: any) {
    var filters = data.body;
    filters.store_id = filters.auth.store_id;
    var filtersValidated = await this.validationService.validate(
      this.tacValidation.FILTERS,
      filters,
    );
    var result =
      await this.transAccountSettingsService.findAll(filtersValidated);

    return ResponseDto.success('Account found!', result);
  }

  @MessagePattern({ cmd: 'get:trans-account-setting-action/*' })
  @Describe({
    description: 'find trans account setting by action',
    fe: [
      'master/page-account-setting:open',
      'transaction/purchase:add',
      'transaction/purchase:edit',
      'transaction/trade:add',
      'transaction/trade:edit',
    ],
  })
  async findOne(@Payload() data: any) {
    const params = data.params;
    var filters = data.body;
    filters.store_id = filters.auth.store_id;
    if (params.id) {
      filters.action = params.id;
    }
    var filtersValidated = await this.validationService.validate(
      this.tacValidation.FILTERS,
      filters,
    );
    var result = await this.transAccountSettingsService.find(filtersValidated);

    return ResponseDto.success('Account found!', result);
  }

  @MessagePattern({ cmd: 'put:trans-account-setting/*' })
  @Describe({
    description: 'Update trans account setting',
    fe: [
      'master/page-account-setting:open',
      'master/page-account-setting:edit',
    ],
  })
  async update(@Payload() data: any) {
    var params = data.params;
    var newdata = data.body;
    var validatedData = await this.validationService.validate(
      this.tacValidation.UPDATE,
      newdata,
    );
    var newData = await this.transAccountSettingsService.update(
      params.id,
      validatedData,
      params.user.id,
    );

    if (!newData) {
      return ResponseDto.error(
        'Failed to update account',
        [
          {
            message: 'Failed to update account',
            field: 'account',
            code: 'failed',
          },
        ],
        400,
      );
    }

    return ResponseDto.success('Account updated successfully', newData);
  }
}
