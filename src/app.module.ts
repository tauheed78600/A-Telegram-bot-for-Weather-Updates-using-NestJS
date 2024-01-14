import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramModule } from './telegram/telegram.module';
import { TelegramEntity } from './telegram/entity/telegram.entity';


@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'mysql',
    host: '127.0.0.1',
    port: 3306,
    username: 'root',
    password: 'password',
    database: 'nestjs',
    entities: [TelegramEntity],
    synchronize: true,
  }),
    TelegramModule,
],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

