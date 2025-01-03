import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AccountsModule } from '../src/accounts/accounts.module';
import { AccountsService } from '../src/accounts/accounts.service';
import { ValidationService } from '../src/common/validation.service';
import { DatabaseService } from '../src/database/database.service';
import { DatabaseModule } from '../src/database/database.module';

describe('AccountController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AccountsModule, DatabaseModule],
      providers: [AccountsService, ValidationService, DatabaseService],
    })
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/accounts')
      .expect(200);
    //   .expect('Hello World!');
  });

  it('/ (POST)', () => {
    return request(app.getHttpServer())
      .post('/accounts')
      .send({
        code: 123,
        deactive: false,
        name: 'test',
        type: 1,
      })
      .expect(201)
      .then((response) => {
        expect(response.body).toEqual({
          error: [],
          message: 'success',
          statusCode : 200,
          data: {
            account_id: expect.any(Number),
            branch_id: response.body.data.branch_id,
            code: expect.any(Number),
            deactive: expect.any(Boolean),
            name: expect.any(String),
            type: expect.any(Number),
            created_at: expect.any(String),
            updated_at: expect.any(String),
          }
        });
      }
    );
  });
});
