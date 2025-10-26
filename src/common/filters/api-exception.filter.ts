import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResult } from '../dtos/api-result.dto';

@Catch()
@Injectable()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let message: string | string[];

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        (exceptionResponse as any).message
      ) {
        message = (exceptionResponse as any).message;
      } else {
        message = exception.message;
      }
      
      this.logger.error(
        `HttpException 처리 - status: ${status}, message: ${message}`,
      );
      response.status(status).json(ApiResult.fail(status, message));
    } else {
      // 예상치 못한 오류 처리
      if (exception instanceof Error) {
        this.logger.error(
          `Unexpected Error - ${exception.message}`,
          exception.stack,
        );
      } else {
        this.logger.error(`Unknown exception: ${JSON.stringify(exception)}`);
      }

      response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          ApiResult.fail(
            HttpStatus.INTERNAL_SERVER_ERROR,
            '서버 내부 오류가 발생했습니다.',
          ),
        );
    }

    this.logger.error(
      `예외 처리 완료 - name: ${(exception as any).constructor?.name}`,
    );
  }
}
