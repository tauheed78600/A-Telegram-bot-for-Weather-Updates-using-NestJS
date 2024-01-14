import { Get, Injectable, UseGuards } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelegramEntity } from './entity/telegram.entity';
import * as request from 'request'; 
import * as cron from 'node-cron';

@Injectable()
export class TelegramService {
  private bot: TelegramBot;

  private botSettings: BotSettings = {
    apiKey: ''
  }

  getBotSettings(): BotSettings{
    return this.botSettings;
  }

  updateBotSettings(newSettings: Partial<BotSettings>): BotSettings {
    this.botSettings = { ...this.botSettings, ...newSettings };

    return this.botSettings;
  }

  constructor(
    @InjectRepository(TelegramEntity)
    private readonly userRepository: Repository<TelegramEntity>,
  ) {
    const token = '6932682573:AAETeds5ScKZnff04a3KadBEJpPcmZez8Cc';
    this.bot = new TelegramBot(token, { polling: true });

    this.setupListeners();
    this.scheduleWeatherUpdates();
  }

  async blockUser(chatId: number): Promise<void> {
    const user = await this.userRepository.findOne({where:{chatId}})
    if (!user){
        console.log("no user found");
        throw new Error("User not found");
    }
    (await user).blocked = true;
    console.log("user found");
    await this.userRepository.save(user);
  }

  async unblockUser(chatId: number): Promise<boolean> {
    try {
      const userToUpdate = await this.userRepository.findOne({ where: { chatId } });

      if (!userToUpdate) {
        // Handle case where user with given chatId is not found
        return false;
      }

      userToUpdate.blocked = false; // Set blocked to false or 0

      await this.userRepository.save(userToUpdate);
      return true; // Return true if successfully updated
    } catch (error) {
      // Handle errors here
      console.error('Error updating user:', error);
      return false; // Return false if update fails
    }
  }

  async deleteUser(chatId: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { chatId } });
    if (!user) {
      throw new Error("No such user found");
    }
    await this.userRepository.remove(user); 
  }

  async fetchUserList(){
    try {
      const users = await this.userRepository.find({
        select: ['chatId', 'city', 'updateFrequency'],
        where: { blocked: false }, 
      })
      return users;
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }

  async getBlockedUsersList(){
    try{
      const users = await this.userRepository.find({ where: { blocked: true } })
      return users;
    }
    catch(error){
      throw new Error(`Error fetching users: ${error.message}`);
    }
    }

  private scheduleWeatherUpdates() {
    cron.schedule('0 9 * * *', async () => {
      const subscriptions = await this.userRepository.find();
      for (const subscription of subscriptions) {
        const city = subscription.city;
        const chatId = subscription.chatId;

        const weatherData = await this.fetchWeatherData(city);
        await this.sendWeatherUpdate(chatId, weatherData);
        console.log("tree");
      }
    });
  }

  private async fetchWeatherData(city: string): Promise<any> {
    const query =
      'http://api.openweathermap.org/data/2.5/weather?q=' +
      city +
      '&appid=' +
      '7fda641ce01ab40449030ca8397effb6'; 

    return new Promise((resolve, reject) => {
      request(query, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          const res = JSON.parse(body);
          const temp = Math.round(parseInt(res.main.temp_min) - 273.15);
          const pressure = Math.round(parseInt(res.main.pressure) - 1013.15);
          const rise = new Date(parseInt(res.sys.sunrise) * 1000);
          const set = new Date(parseInt(res.sys.sunset) * 1000);

          const weatherDetails = `**** ${res.name} ****\nTemperature: ${temp}°C\nHumidity: ${
            res.main.humidity
          }%\nWeather: ${res.weather[0].description}\nPressure: ${pressure} atm\nSunrise: ${rise.toLocaleTimeString()} \nSunset: ${set.toLocaleTimeString()}\nCountry: ${res.sys.country}`;

          resolve(weatherDetails);
        } else {
          reject(error);
        }
      });
    });
  }

  private async sendWeatherUpdate(chatId: number, weatherData: any): Promise<void> {
    await this.bot.sendMessage(chatId, `Weather Update:\n${weatherData}`);
  }

  private setupListeners(): void {
    this.bot.onText(/\/subscribe (.+)/, async (msg, match) => {
      const city = match[1];
      const chatId = msg.chat.id;

      const existingSubscription = await this.userRepository.findOne({ where: { city, chatId } });

      if (existingSubscription) {
        await this.bot.sendMessage(chatId, `You are already subscribed to updates for ${city}.`);
      } else {
        const newSubscription = this.userRepository.create({city, chatId});
        await this.userRepository.save(newSubscription);
        await this.bot.sendMessage(chatId, `Subscribed for weather updates in ${city}!`);
      }
    });

    this.bot.onText(/\/unsubscribe (.+)/, async (msg, match) => {
        const city = match[1];
        const chatId = msg.chat.id;
  
        const subscription = await this.userRepository.findOne({ where: { city, chatId } });
  
        if (subscription) {
          await this.userRepository.remove(subscription);
          console.log("User Removed Successfully")
          await this.bot.sendMessage(chatId, `Unsubscribed from weather updates for ${city}.`);
        } else {
          await this.bot.sendMessage(chatId, `You are not subscribed to updates for ${city}.`);
        }
      });
    }
  }



