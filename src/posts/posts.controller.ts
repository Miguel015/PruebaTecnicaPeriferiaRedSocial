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
  @ApiResponse({ status: 200, description: 'List of posts with pagination' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async list(@Req() req: any, @Query('page') page?: string, @Query('size') size?: string) {
    const p = Number(page ?? 0)
    const s = Number(size ?? 5)
    return this.postsService.findAll(req.user, p, s);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get post by id' })
  @ApiResponse({ status: 200, description: 'Post detail' })
  @ApiResponse({ status: 404, description: 'Post not found' })
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
  @ApiResponse({ status: 201, description: 'Post created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
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
  @ApiResponse({ status: 200, description: 'Returns liked state and totalLikes' })
  @ApiResponse({ status: 404, description: 'Post not found' })
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
