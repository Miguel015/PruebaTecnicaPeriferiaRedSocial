import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { unlinkSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './post.entity';
import { Like } from './like.entity';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepo: Repository<Post>,
    @InjectRepository(Like)
    private readonly likesRepo: Repository<Like>
  ) {}
  async create(author: any, dto: CreatePostDto, files?: Express.Multer.File[]) {
    const images = files && files.length > 0 ? files.map(f => `/uploads/${f.filename}`) : null
    const post = this.postsRepo.create({ content: dto.content, authorId: author.id, images: images ? JSON.stringify(images) : null });
    const saved = await this.postsRepo.save(post);
    return { ...saved, images: images };
  }

  async findAll(user?: any, page = 0, size = 5) {
    const [posts, total] = await this.postsRepo.createQueryBuilder('p')
      .orderBy('p.createdAt', 'DESC')
      .skip(page * size)
      .take(size)
      .getManyAndCount();

    const results = await Promise.all(posts.map(async (p) => {
      const totalLikes = await this.likesRepo.count({ where: { postId: p.id } });
      let liked = false
      if (user) {
        const exists = await this.likesRepo.findOne({ where: { postId: p.id, userId: user.id } });
        liked = !!exists
      }
      let imgs: string[] | null = null
      try { imgs = p.images ? JSON.parse(p.images as any) : null } catch { imgs = null }
      return { ...p, totalLikes, liked, images: imgs };
    }));
    return { items: results, total };
  }

  async findById(id: string) {
    const post = await this.postsRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    const totalLikes = await this.likesRepo.count({ where: { postId: id } });
    let imgs: string[] | null = null
    try { imgs = post.images ? JSON.parse(post.images as any) : null } catch { imgs = null }
    return { ...post, totalLikes, images: imgs };
  }

  async like(postId: string, user: any) {
    const post = await this.postsRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.likesRepo.findOne({ where: { postId, userId: user.id } });
    if (existing) {
      await this.likesRepo.remove(existing);
      const total = await this.likesRepo.count({ where: { postId } });
      return { liked: false, totalLikes: total };
    }

    const like = this.likesRepo.create({ postId, userId: user.id });
    try {
      await this.likesRepo.save(like);
    } catch (err) {
      throw new ConflictException('Could not like post');
    }
    const total = await this.likesRepo.count({ where: { postId } });
    return { liked: true, totalLikes: total };
  }

  async countLikes(postId: string) {
    return this.likesRepo.count({ where: { postId } });
  }

  // delete all posts and likes (useful for dev/testing)
  async deleteAll() {
    // remove files in uploads folder if present
    try {
      const uploadsDir = join(process.cwd(), 'uploads')
      const entries = readdirSync(uploadsDir)
      for (const e of entries) {
        const p = join(uploadsDir, e)
        try {
          // only unlink files
          if (statSync(p).isFile()) unlinkSync(p)
        } catch {}
      }
    } catch {}

    // clear likes then posts
    try { await this.likesRepo.clear() } catch {}
    try { await this.postsRepo.clear() } catch {}
    return { deleted: true }
  }
}
