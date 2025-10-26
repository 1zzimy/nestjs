import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UserInfoDto {
  @Expose()
  @ApiProperty({ example: 1, description: '사용자 ID' })
  id: number;

  @Expose()
  @ApiProperty({ example: '홍길동', description: '사용자 이름' })
  name: string;

  @Expose()
  @ApiProperty({ example: 'test@test.com', description: '사용자 이메일' })
  email: string;

  @Expose()
  @ApiProperty({ example: true, description: '활성 상태 여부' })
  isActive: boolean;
}
