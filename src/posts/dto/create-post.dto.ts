import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content!: string;
}
