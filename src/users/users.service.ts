import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>
  ) {}

  async findByUsername(username: string) {
    return this.usersRepo.findOne({ where: { username } });
  }

  async findById(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(user: Partial<User>) {
    const entity = this.usersRepo.create(user as User);
    return this.usersRepo.save(entity);
  }

  async update(id: string, data: Partial<User>) {
    const user = await this.findById(id);
    const merged = { ...user, ...(data as any) } as User
    return this.usersRepo.save(merged);
  }

  async safeProfile(user: User) {
    const { passwordHash, ...rest } = user as any;
    return rest as Partial<User>;
  }
}
