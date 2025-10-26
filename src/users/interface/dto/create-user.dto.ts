import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, Length, Matches } from "class-validator";

export class CreateUserDto {
    @ApiProperty({ example: '홍길동', description: '사용자 이름' })
    @IsNotEmpty({ message: '이름은 필수 입력 값입니다.' })
    @Length(2, 20, { message: '이름은 최소 2자 이상, 20자 이하로 입력해주세요.' })
    name: string;

    @ApiProperty({ example: 'test@test.com', description: '사용자 이메일' })
    @IsNotEmpty({ message: '이메일은 필수 입력 값입니다.' })
    @IsEmail({}, { message: '올바른 이메일 형식이어야 합니다.' })
    email: string;

    @ApiProperty({ example: 'P@ssw0rd!', description: '사용자 비밀번호' })
    @IsNotEmpty({ message: '비밀번호는 필수 입력 값입니다.' })
    @Length(8, 20, { message: '비밀번호는 8자 이상 20자 이하로 입력해주세요.' })
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]+$/, {
        message: '비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.',})
    pwd: string;
}