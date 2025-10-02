import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { swaggerConfig } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true, // DTO에 정의된 속성만 허용
    forbidNonWhitelisted: true, // DTO에 없는 값이 오면 예외(400 Bad Request)
    transform: true // 요청에서 들어온 값들을 DTO 클래스 타입으로 자동 변환
  }));
  
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document); // 'docs': 문서를 띄울 경로 prefix

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
