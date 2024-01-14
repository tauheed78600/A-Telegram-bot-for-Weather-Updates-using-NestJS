import { Column, Entity, IntegerType, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class TelegramEntity{

    @PrimaryGeneratedColumn()
    chatId: number;

    @Column() // Nullable in case the user hasn't chosen a city yet
    city: string;

    @Column({ default: 'daily' }) // Default to daily updates; can be 'daily' or 'weekly'
    updateFrequency: 'daily' | 'weekly';

    @Column({default: false})
    blocked: true | false;

}