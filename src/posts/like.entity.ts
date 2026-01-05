import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique, Index } from 'typeorm';

@Entity({ name: 'likes' })
@Unique(['postId', 'userId'])
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'postId' })
  @Index()
  postId!: string;

  @Column({ type: 'uuid', name: 'userId' })
  @Index()
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
