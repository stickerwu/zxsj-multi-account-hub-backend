import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      // 使用 credential 字段作为登录标识，支持用户名/邮箱/手机号
      usernameField: 'credential',
      passwordField: 'password',
    });
  }

  // 将 credential 与 password 传递到验证逻辑
  // credential 可以是用户名、邮箱或手机号，后续由 AuthService 统一处理
  async validate(credential: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(credential, password);
    if (!user) {
      throw new UnauthorizedException('登录凭证或密码错误');
    }
    return user;
  }
}
