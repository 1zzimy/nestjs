import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'test@test.com', description: '사용자 이메일' })
  @IsEmail({}, { message: '올바른 이메일 형식이어야 합니다.' })
  email: string;

  @ApiProperty({ example: 'P@ssw0rd!', description: '사용자 비밀번호' })
  @IsNotEmpty({ message: '비밀번호는 필수 입력 값입니다.' })
  pwd: string;
}
