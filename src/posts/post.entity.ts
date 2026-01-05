import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'posts' })
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'uuid', name: 'authorId' })
  authorId!: string;

  @Column({ type: 'text', nullable: true })
  images?: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
