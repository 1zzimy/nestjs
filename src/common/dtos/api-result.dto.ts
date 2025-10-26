import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class ApiResult<T> {
  @ApiProperty({ example: true, description: '성공 여부' })
  success: boolean;

  @ApiProperty({ example: 200, description: '응답 코드'})
  status: number;

  @ApiProperty({ example: '요청이 성공적으로 처리되었습니다.', description: '응답 메시지' })
  message: string | string[];

  @ApiProperty({ description: '실제 응답 데이터', required: false })
  data?: T;

  static success<T>(message: string, data?: T, status: number = HttpStatus.OK): ApiResult<T> {
    return { success: true, status, message, data };
  }

  static fail(status: number, message: string | string[] ): ApiResult<null> {
    return { success: false, status, message, data: null };
  }
}
