import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UsersService } from '../../users/application/users.service';

const cookieExtractor = (req: Request): string | null => {
  return req?.cookies?.['access_token'] ?? null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret',
    });
  }

  async validate(payload: { sub: number; email: string }) {
    try {
      const user = await this.usersService.getUserById(payload.sub);
      return { userId: user.id, email: user.email };
    } catch (error) {
      throw new UnauthorizedException('유효하지 않은 사용자입니다.');
    }
  }
}
