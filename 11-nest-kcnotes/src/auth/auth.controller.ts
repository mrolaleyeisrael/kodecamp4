import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  Req,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SignupDto } from './dto/signup-user.dto';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { JwtAuthGuard } from './auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(201)
  async signup(@Body() user: SignupDto): Promise<{ token: string }> {
    return await this.authService.signup(user);
  }

  @Post('signin')
  async signin(@Body() user: SignupDto): Promise<{ token: string }> {
    return await this.authService.signin(user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request) {
    const user = (req as any).user;
    return { user };
  }

  @Put('update')
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<{ message: string }> {
    const user = (req as any).user;
    return await this.authService.updateUser(user.id, updateUserDto);
  }

  @Delete('delete')
  @UseGuards(JwtAuthGuard)
  async deleteUser(@Req() req: Request): Promise<{ message: string }> {
    const userId = (req as any).user.id;
    return await this.authService.deleteUser(userId);
  }

  @Get('signout')
  @UseGuards(JwtAuthGuard)
  async signout() {
    return {
      token: null,
    };
  }
}
