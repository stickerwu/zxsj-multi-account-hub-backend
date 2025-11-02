import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'credential', // 使用 credential 字段而不是默认的 username
      passwordField: 'password',
    });
  }

  async validate(credential: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(credential, password);
    if (!user) {
      throw new UnauthorizedException('登录凭证或密码错误');
    }
    return user;
  }
}
