import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramEntity } from './entity/telegram.entity';
import { PassportModule } from '@nestjs/passport';

@Module({
  controllers: [TelegramController],
  providers: [TelegramService, ],
  imports: [TypeOrmModule.forFeature([TelegramEntity]),
            PassportModule.register({defaultStrategy: 'google'})],
})
export class TelegramModule {}
