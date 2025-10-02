import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('NestJS API Docs')
  .setDescription('NestJS 공부용')
  .setVersion('v1.0')
  .addTag('User', '회원 관련 API')
  .build();