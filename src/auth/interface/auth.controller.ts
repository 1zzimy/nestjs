import { Body, Controller, HttpCode, Logger, Post, Req, Res } from '@nestjs/common';
import { AuthService } from '../application/auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type Response, type Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { UserInfoDto } from '../../users/interface/dto/user-info.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post('login')
    @HttpCode(200)
    @ApiOperation({ summary: '로그인', description: '사용자 로그인' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, description: '로그인 성공', type: UserInfoDto })
    @ApiResponse({ status: 401, description: '이메일 또는 비밀번호가 올바르지 않습니다.' })
    @ApiResponse({ status: 410, description: '탈퇴한 회원입니다.' })
    async login(
        @Body() loginDto: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<UserInfoDto> {
        this.logger.log(`로그인 요청 - email: ${loginDto.email}`);
        const user = await this.authService.validateUser(
            loginDto.email,
            loginDto.pwd,
        );
        this.logger.log(`로그인 성공 - userId: ${user.id}`);
        return this.authService.issueTokensForUser(user, res);
    }

    @Public()
    @Post('refresh')
    @HttpCode(200)
    @ApiOperation({ summary: '토큰 갱신', description: '쿠키에 담긴 리프레시 토큰으로 액세스 토큰을 갱신합니다.' })
    @ApiResponse({ status: 200, description: '토큰 갱신 성공', type: UserInfoDto })
    @ApiResponse({ status: 401, description: '리프레시 토큰 검증 실패' })
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): Promise<UserInfoDto> {
        const refreshToken = req.cookies?.['refresh_token'];
        this.logger.log('토큰 갱신 요청');
        return this.authService.refreshTokens(refreshToken, res);
    }

    @Public()
    @Post('recover')
    @HttpCode(200)
    @ApiOperation({ summary: '계정 복구', description: '탈퇴한 회원을 다시 활성화합니다.' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, description: '계정 복구 성공', type: UserInfoDto })
    @ApiResponse({ status: 401, description: '이메일 또는 비밀번호가 올바르지 않습니다.' })
    @ApiResponse({ status: 404, description: '존재하지 않는 회원입니다.' })
    @ApiResponse({ status: 409, description: '이미 활성화된 회원입니다.' })
    async recover(
        @Body() loginDto: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<UserInfoDto> {
        this.logger.log(`계정 복구 요청 - email: ${loginDto.email}`);
        return this.authService.recoverUserAccount(
            loginDto.email,
            loginDto.pwd,
            res,
        );
    }

    @Post('logout')
    @HttpCode(200)
    @ApiOperation({ summary: '로그아웃', description: '인증 쿠키 삭제' })
    @ApiResponse({ status: 200, description: '로그아웃 성공' })
    @ApiResponse({ status: 401, description: '인증되지 않은 사용자입니다.' })
    async logout(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): Promise<{ message: string }> {
        const user = req.user as { userId: number };
        this.logger.log(`로그아웃 요청 - userId: ${user?.userId}`);
        if (user?.userId) {
            await this.authService.removeRefreshToken(user.userId);
        }
        this.authService.clearAuthCookies(res);
        return { message: '로그아웃되었습니다.' };
    }
}
