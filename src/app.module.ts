import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeORMConfig } from './config/typeorm.config';
import { ApiResultInterceptor } from './common/interceptors/api-result.interceptor';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeORMConfig),
    UsersModule
  ],
  providers: [ApiResultInterceptor,{
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },],
})
export class AppModule {}
