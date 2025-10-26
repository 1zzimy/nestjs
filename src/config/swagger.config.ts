import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('NestJS API Docs')
  .setDescription('NestJS 공부용')
  .setVersion('v1.0')
  .addServer('http://localhost:3000')
  .addTag('User', '회원 관련 API')
  .addTag('Auth', '인증 관련 API')
  .build();