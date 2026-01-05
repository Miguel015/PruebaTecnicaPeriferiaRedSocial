import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PostsService } from '../posts/posts.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);
  constructor(private usersService: UsersService, private postsService: PostsService) {}

  async seed() {
    try {
      // Seed multiple sample users and a post per user.
      const seeds = [
        { username: 'alice', password: 'password1', firstName: 'Alice', lastName: 'Example', alias: 'ally', birthDate: new Date('1990-01-01') },
        { username: 'bob', password: 'password2', firstName: 'Bob', lastName: 'Example', alias: 'bobby', birthDate: new Date('1985-05-23') },
        { username: 'carla', password: 'pass123', firstName: 'Carla', lastName: 'Seed', alias: 'carla', birthDate: new Date('1992-07-10') },
        { username: 'dan', password: 'pass456', firstName: 'Dan', lastName: 'Seed', alias: 'dan', birthDate: new Date('1988-11-02') }
      ];

      // Create users if missing
      for (const s of seeds) {
        const exists = await this.usersService.findByUsername(s.username).catch(() => null);
        if (!exists) {
          const hash = await bcrypt.hash(s.password, 10);
          await this.usersService.create({
            username: s.username,
            passwordHash: hash,
            firstName: s.firstName,
            lastName: s.lastName,
            birthDate: s.birthDate,
            alias: s.alias,
            // provide a predictable avatar so frontend shows per-user image immediately
            avatarUrl: `https://i.pravatar.cc/150?u=${s.username}`
          } as any);
          this.logger.log(`Created user ${s.username}`);
        }
      }

      // Ensure each seed user has at least one post (do not remove existing posts)
      const raw = await this.postsService.findAll(undefined, 0, 1000).catch(() => ([] as any));
      const allPosts = Array.isArray(raw) ? raw : (raw && raw.items) || [];
      const postsByAuthor: Record<string, any> = {};
      for (const p of allPosts) {
        if (p && p.authorId && !postsByAuthor[p.authorId]) postsByAuthor[p.authorId] = p;
      }

      const createdPosts: Record<string, any> = {};
      for (const s of seeds) {
        const u = await this.usersService.findByUsername(s.username).catch(() => null);
        if (!u) continue;
        // if user already has a post, record it; otherwise create one
        if (postsByAuthor[u.id]) {
          createdPosts[s.username] = postsByAuthor[u.id];
          this.logger.log(`User ${s.username} already has a post (${postsByAuthor[u.id].id})`);
        } else {
          const p = await this.postsService.create(u, { content: `${s.firstName} says hello (seed)` } as any).catch(() => null);
          if (p && p.id) {
            createdPosts[s.username] = p;
            this.logger.log(`Created post ${p.id} by ${s.username}`);
          }
        }
      }

      // Add some interactions (likes) between users if target posts exist
      const alice = await this.usersService.findByUsername('alice').catch(() => null);
      const bob = await this.usersService.findByUsername('bob').catch(() => null);
      const carla = await this.usersService.findByUsername('carla').catch(() => null);
      const dan = await this.usersService.findByUsername('dan').catch(() => null);

      if (alice && bob && createdPosts['alice']) {
        await this.postsService.like(createdPosts['alice'].id, bob).catch(() => null);
        this.logger.log(`bob liked alice's post ${createdPosts['alice'].id}`);
      }
      if (bob && carla && createdPosts['bob']) {
        await this.postsService.like(createdPosts['bob'].id, carla).catch(() => null);
        this.logger.log(`carla liked bob's post ${createdPosts['bob'].id}`);
      }
      if (alice && dan && createdPosts['alice']) {
        await this.postsService.like(createdPosts['alice'].id, dan).catch(() => null);
        this.logger.log(`dan liked alice's post ${createdPosts['alice'].id}`);
      }
      if (bob && dan && createdPosts['bob']) {
        await this.postsService.like(createdPosts['bob'].id, dan).catch(() => null);
        this.logger.log(`dan liked bob's post ${createdPosts['bob'].id}`);
      }
    } catch (err) {
      this.logger.error('Seeder failed', err as any);
    }
  }
}
