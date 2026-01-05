import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { SeederService } from './seed/seeder.service';
import { User } from './users/user.entity';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads'
    }),
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbHost = config.get('DB_HOST')
        const isDev = config.get('NODE_ENV') === 'development'
        // If running in development and DB_HOST is the docker service name 'postgres',
        // provide a fallback to a local sqlite DB so the backend can start without Docker.
        if (isDev && dbHost === 'postgres') {
          return {
            type: 'sqlite',
            database: 'dev.sqlite',
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true,
            logging: false
          }
        }
        return {
          type: 'postgres',
          host: dbHost,
          port: Number(config.get('DB_PORT') || 5432),
          username: config.get('DB_USER'),
          password: config.get('DB_PASS'),
          database: config.get('DB_NAME'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: isDev,
          logging: false
        }
      }
    }),
    UsersModule,
    AuthModule,
    PostsModule
  ],
  providers: [SeederService]
})
export class AppModule {}
