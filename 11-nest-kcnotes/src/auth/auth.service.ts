import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async signup(user: SignupDto): Promise<{ token: string }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { username: user.username },
    });

    if (existingUser) {
      throw new BadRequestException(
        `User with username '${existingUser.username}' already exists.`,
      );
    }

    const salt = 10;
    const passwordHash = await bcrypt.hash(user.password, salt);

    const createdUser = await this.prisma.user.create({
      data: {
        ...user,
        password: passwordHash,
      },
    });

    const token = this.jwt.sign({
      id: createdUser.id,
    });

    return { token };
  }

  async signin(user: SignupDto): Promise<{ token: string }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { username: user.username },
    });

    if (!existingUser) {
      throw new BadRequestException(`Invalid credentials.`);
    }

    const correctPassword = await bcrypt.compare(
      user.password,
      existingUser.password,
    );

    if (!correctPassword) {
      throw new BadRequestException(`Invalid credentials.`);
    }

    return {
      token: this.jwt.sign({
        id: existingUser.id,
      }),
    };
  }

  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<{ message: string }> {
    const { password } = updateUserDto;
    const salt = 10;
    const passwordHash = await bcrypt.hash(password, salt);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash },
    });

    return { message: 'Password updated successfully' };
  }
  async deleteUser(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException(`User with id '${userId}' not found.`);
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'User deleted successfully' };
  }
}
