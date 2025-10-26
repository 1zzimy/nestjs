import {
  Injectable,
  Logger,
  UnauthorizedException,
  GoneException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from '../../users/application/users.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../../common/redis/redis.service';
import { Response } from 'express';
import { User } from '../../users/domain/user.entity';
import { plainToInstance } from 'class-transformer';
import { UserInfoDto } from '../../users/interface/dto/user-info.dto';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';
const ACCESS_TOKEN_TTL_SECONDS = 60 * 15; // 15분
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7일

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshSecret =
    process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret';

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findActiveUserByEmailWithPassword(
      email,
    );

    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    if (!user.pwd || user.pwd !== password) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    return user;
  }

  async generateTokens(user: { id: number; email: string }) {
    const payload = { sub: user.id, email: user.email };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: REFRESH_TOKEN_TTL_SECONDS,
      secret: this.refreshSecret,
    });

    return { accessToken, refreshToken };
  }

  async storeRefreshToken(userId: number, refreshToken: string): Promise<void> {
    await this.redisService.set(
      this.getRefreshKey(userId),
      refreshToken,
      REFRESH_TOKEN_TTL_SECONDS,
    );
  }

  async removeRefreshToken(userId: number): Promise<void> {
    await this.redisService.del(this.getRefreshKey(userId));
  }

  attachAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const commonOptions = {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: false,
    };

    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...commonOptions,
      maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
    });
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...commonOptions,
      maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
    });
  }

  clearAuthCookies(res: Response): void {
    const options = { httpOnly: true, sameSite: 'lax' as const, secure: false };
    res.clearCookie(ACCESS_TOKEN_COOKIE, options);
    res.clearCookie(REFRESH_TOKEN_COOKIE, options);
  }

  async issueTokensForUser(
    user: { id: number; email: string; name: string; isActive: boolean },
    res: Response,
  ): Promise<UserInfoDto> {
    const tokens = await this.generateTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    this.attachAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return plainToInstance(UserInfoDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async recoverUserAccount(
    email: string,
    password: string,
    res: Response,
  ): Promise<UserInfoDto> {
    const user = await this.usersService.findInactiveUserByEmail(email);

    if (!user) {
      throw new NotFoundException('존재하지 않는 회원입니다.');
    }

    if (user.isActive) {
      throw new ConflictException('이미 활성화된 회원입니다.');
    }

    if (!user.pwd || user.pwd !== password) {
      this.logger.warn(`비밀번호 불일치로 복구 실패 - email: ${email}`);
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    await this.usersService.activateUser(user.id);
    const activated = { ...user, isActive: true };
    this.logger.log(`회원 복구 완료 - id: ${user.id}, email: ${email}`);
    return this.issueTokensForUser(activated, res);
  }

  async refreshTokens(refreshToken: string, res: Response): Promise<UserInfoDto> {
    if (!refreshToken) {
      throw new UnauthorizedException('리프레시 토큰이 존재하지 않습니다.');
    }

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.refreshSecret,
      });

      const userId = Number(payload.sub);

      const storedToken = await this.redisService.get(
        this.getRefreshKey(userId),
      );

      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
      }

      const user = await this.usersService.getUserById(userId);
      const tokens = await this.generateTokens(user);
      await this.storeRefreshToken(user.id, tokens.refreshToken);
      this.attachAuthCookies(res, tokens.accessToken, tokens.refreshToken);

      return plainToInstance(UserInfoDto, user, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException ||
        error instanceof GoneException
      ) {
        throw error;
      }
      this.logger.error(`리프레시 토큰 갱신 실패: ${error.message}`);
      throw new UnauthorizedException('리프레시 토큰 검증에 실패했습니다.');
    }
  }

  private getRefreshKey(userId: number): string {
    return `refresh:${userId}`;
  }
}
