import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Logger } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserInfoDto } from './dto/user-info.dto';

@ApiTags('User')
@Controller('users')
export class UsersController {
    private readonly logger = new Logger(UsersService.name);

    constructor(private usersService: UsersService) {}

    @Get()
    @ApiOperation({ summary: '모든 회원 조회', description: 'DB에 저장된 모든 회원을 반환합니다.' })
    @ApiResponse({ status: 200, description: '회원 목록 조회 성공', type: [UserInfoDto] })
    getAllUsers(): Promise<UserInfoDto[]> {
        this.logger.log('모든 회원 조회 요청');
        return this.usersService.getAllUsers();
    }

    @Get('/:id')
    @ApiOperation({ summary: '특정 회원 조회', description: 'ID를 이용해 특정 회원을 조회합니다.' })
    @ApiResponse({ status: 200, description: '회원 조회 성공', type: UserInfoDto })
    @ApiResponse({ status: 404, description: '존재하지 않는 회원입니다.' })
    @ApiResponse({ status: 410, description: '탈퇴한 회원입니다.' })
    getUserById(@Param('id', ParseIntPipe) id: number): Promise<UserInfoDto> {
        this.logger.log(`특정 회원 조회 요청 - id: ${id}`);
        return this.usersService.getUser(id);
    }

    @Post()
    @ApiOperation({ summary: '회원 가입', description: '새로운 회원을 생성합니다.' })
    @ApiBody({ type: CreateUserDto })
    @ApiResponse({ status: 201, description: '회원 가입 성공' })
    createUser(@Body() createUserDto: CreateUserDto): Promise<void> {
        this.logger.log(`회원 가입 요청 - email: ${createUserDto.email}`);
        return this.usersService.createUser(createUserDto);
    }

    @Delete('/:id')
    @ApiOperation({ summary: '회원 탈퇴 (Soft Delete)', description: '회원을 실제로 삭제하지 않고 비활성화합니다.' })
    @ApiResponse({ status: 200, description: '회원 탈퇴 성공' })
    @ApiResponse({ status: 404, description: '존재하지 않는 회원입니다.' })
    @ApiResponse({ status: 410, description: '탈퇴한 회원입니다.' })
    deleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
        this.logger.warn(`회원 탈퇴 요청 - id: ${id}`);
        return this.usersService.removeUser(id);
    }
}
