import { Body, Controller, Post, Get, Put, Param, Delete } from '@nestjs/common';
import { TelegramService } from './telegram.service';



@Controller('/telegram')
export class TelegramController 
{
  constructor(private readonly telegramService: TelegramService){}
    
  @Get('/bot-settings')
  async getBotSettings(): Promise<any> {
    return this.telegramService.getBotSettings();
  }
  
  @Put('update-bot-settings')
  async updateBotSettings(@Body() settings: any): Promise<any> {
    return this.telegramService.updateBotSettings(settings);
  }

  @Put("/block/:chatId")
  async blockUser(@Param("chatId") chatId: number){
    console.log("Inside block user");
    return this.telegramService.blockUser(chatId);
  }
  
  @Put("/unBlock/:chatId")
  async unBlockUser(@Param("chatId") chatId: number){
    console.log("Inside block user");
    return this.telegramService.unblockUser(chatId);
  }

@Delete("/delete/:chatId")
async deleteUser(@Param("chatId") chatId: number){
  console.log("Inside delete user");
  return this.telegramService.deleteUser(chatId);
}

@Get("/users")
async fetchUsers(){
  try {
    console.log("Inside fetch users")
    const users = await this.telegramService.fetchUserList();
    console.log(users)
    return users;
  } catch (error) {
    return { error: error.message };
    }
  }

  @Get("/blockedUsers")
  async getBlockedUsers(){
    try {
      console.log("Inside blockedUsers")
      const users = await this.telegramService.getBlockedUsersList();
      console.log(users)
      return users;
    } catch (error) {
      return { error: error.message };
      }
    }


}

