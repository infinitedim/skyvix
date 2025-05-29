import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHello(): string {
    return "Skyvix Backend API is running! 🚀";
  }
}