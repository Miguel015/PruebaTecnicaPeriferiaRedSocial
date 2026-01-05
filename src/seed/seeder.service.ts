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
      // create sample users if they don't exist
      const exists = await this.usersService.findByUsername('alice').catch(() => null);
      if (!exists) {
        const pwd1 = await bcrypt.hash('password1', 10);
        await this.usersService.create({
          username: 'alice',
          passwordHash: pwd1,
          firstName: 'Alice',
          lastName: 'Example',
          birthDate: new Date('1990-01-01'),
          alias: 'ally'
        });
        this.logger.log('Created user alice');
      }

      const exists2 = await this.usersService.findByUsername('bob').catch(() => null);
      if (!exists2) {
        const pwd2 = await bcrypt.hash('password2', 10);
        await this.usersService.create({
          username: 'bob',
          passwordHash: pwd2,
          firstName: 'Bob',
          lastName: 'Example',
          birthDate: new Date('1985-05-23'),
          alias: 'bobby'
        });
        this.logger.log('Created user bob');
      }
      // Create example posts if none exist
      const raw = await this.postsService.findAll().catch(() => ([] as any))
      const posts = Array.isArray(raw) ? raw : (raw && raw.items) || []
      if (!posts || posts.length === 0) {
        const alice = await this.usersService.findByUsername('alice');
        const bob = await this.usersService.findByUsername('bob');
        if (alice) {
          const p1 = await this.postsService.create(alice, { content: 'Hello from Alice (seed)' } as any);
          this.logger.log(`Created post ${p1.id} by alice`);
          // let bob like alice's post
          if (bob) {
            await this.postsService.like(p1.id, bob).catch(() => null);
            this.logger.log(`Bob liked alice's post ${p1.id}`);
          }
        }
        if (bob) {
          const p2 = await this.postsService.create(bob, { content: 'Bob says hi (seed)' } as any);
          this.logger.log(`Created post ${p2.id} by bob`);
        }
      }
    } catch (err) {
      this.logger.error('Seeder failed', err as any);
    }
  }
}
