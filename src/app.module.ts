import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeORMConfig } from './config/typeorm.config';
import { ApiResultInterceptor } from './common/interceptors/api-result.interceptor';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RedisModule } from './common/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeORMConfig),
    RedisModule,
    UsersModule,
    AuthModule,
  ],
  providers: [ApiResultInterceptor,{
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },{
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    }],
})
export class AppModule {}
