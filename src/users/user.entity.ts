import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  username!: string;

  @Column({ name: 'passwordHash' })
  passwordHash!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ type: 'date', nullable: true })
  birthDate!: string | Date;

  @Column({ nullable: true })
  alias!: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl?: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
