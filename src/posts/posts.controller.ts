import { Controller, Get, Post as HttpPost, Body, Param, UseGuards, Req, HttpCode, UseInterceptors, UploadedFiles, Query, Delete } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'List posts' })
  async list(@Req() req: any, @Query('page') page?: string, @Query('size') size?: string) {
    const p = Number(page ?? 0)
    const s = Number(size ?? 5)
    return this.postsService.findAll(req.user, p, s);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get post by id' })
  async get(@Param('id') id: string) {
    return this.postsService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpPost()
  @UseInterceptors(FilesInterceptor('images', 10, {
    storage: diskStorage({
      destination: './uploads',
      filename: (_req, file, cb) => cb(null, Date.now() + extname(file.originalname))
    })
  }))
  @ApiOperation({ summary: 'Create a post' })
  async create(@Req() req: any, @Body() dto: CreatePostDto, @UploadedFiles() files?: Express.Multer.File[]) {
    return this.postsService.create(req.user, dto, files);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('all')
  @ApiOperation({ summary: 'Delete all posts and likes (dev only)' })
  async deleteAll() {
    return this.postsService.deleteAll()
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpPost(':id/like')
  @HttpCode(200)
  @ApiOperation({ summary: 'Like or unlike a post (toggle)' })
  async like(@Param('id') id: string, @Req() req: any) {
    return this.postsService.like(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('cleanup-orphans')
  @ApiOperation({ summary: 'Delete posts whose author no longer exists (dev)' })
  async cleanupOrphans() {
    return this.postsService.cleanupOrphans();
  }
}
