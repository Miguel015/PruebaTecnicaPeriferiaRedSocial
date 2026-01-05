import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Note: GET with query params required by spec
  @Get('login')
  async login(@Query('username') username: string, @Query('password') password: string) {
    if (!username || !password) throw new BadRequestException('username and password required');
    const user = await this.authService.validateUser(username, password);
    if (!user) throw new BadRequestException('Invalid credentials');
    return this.authService.login(user);
  }
}
