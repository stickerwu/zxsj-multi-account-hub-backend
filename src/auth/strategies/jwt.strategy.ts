import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

export interface JwtPayload {
  sub: string; // 用户ID
  username: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  private async withRetry<T>(fn: () => Promise<T>, attempts = 2, delayMs = 150): Promise<T> {
    let lastErr: any;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (e: any) {
        const isConnReset = e?.code === 'ECONNRESET' || e?.driverError?.code === 'ECONNRESET' || (typeof e?.message === 'string' && e.message.includes('ECONNRESET'));
        if (!isConnReset || i === attempts - 1) {
          throw e;
        }
        lastErr = e;
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
    throw lastErr;
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.withRetry(() =>
      this.userRepository.findOne({ where: { userId: payload.sub } }),
    );

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return user;
  }
}
