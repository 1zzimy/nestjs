import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { swaggerConfig } from './config/swagger.config';
import { ApiResultInterceptor } from './common/interceptors/api-result.interceptor';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import cookieParser from 'cookie-parser';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true, // DTO에 정의된 속성만 허용
    forbidNonWhitelisted: true, // DTO에 없는 값이 오면 예외(400 Bad Request)
    transform: true // 요청에서 들어온 값들을 DTO 클래스 타입으로 자동 변환
  }));

  app.useGlobalInterceptors(app.get(ApiResultInterceptor)); // 전역 인터셉터 등록

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document); // 'docs': 문서를 띄울 경로 prefix

  app.use(cookieParser());

  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
