import { Controller, Get, Req, UseGuards, Patch, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile (without passwordHash)' })
  @Get('me')
  async me(@Req() req: any) {
    const user = await this.usersService.findById(req.user.id);
    return this.usersService.safeProfile(user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('me')
  async updateMe(@Req() req: any, @Body() body: any) {
    const updated = await this.usersService.update(req.user.id, body);
    return this.usersService.safeProfile(updated);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('me/avatar')
  @UseInterceptors(FileInterceptor('avatar', {
    storage: diskStorage({
      destination: './uploads',
      filename: (_req, file, cb) => {
        const name = Date.now() + extname(file.originalname)
        cb(null, name)
      }
    })
  }))
  async uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) return { url: null }
    const url = `/uploads/${file.filename}`
    const updated = await this.usersService.update(req.user.id, { avatarUrl: url })
    return this.usersService.safeProfile(updated)
  }
}
