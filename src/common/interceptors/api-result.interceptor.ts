import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
// Swagger 메타데이터 키
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { ApiResult } from '../dtos/api-result.dto';


@Injectable()
export class ApiResultInterceptor<T>
  implements NestInterceptor<T, ApiResult<T>>
{
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResult<T>> {
    const response = context.switchToHttp().getResponse();
    const handler = context.getHandler();

    // @ApiOperation({ summary: '...' }) 읽기
    const apiOperationMeta: Record<string, any> | undefined =
      this.reflector.get(DECORATORS.API_OPERATION, handler);

    const summary = apiOperationMeta?.summary;
    const handlerName = handler.name;
    const messageBase = summary || handlerName;

    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'status' in data
        ) {
          return data as ApiResult<T>;
        }

        const status = response.statusCode ?? HttpStatus.OK;
        const message = `${messageBase} 성공`;

        return ApiResult.success(message, data, status);
      }),
    );
  }
}
