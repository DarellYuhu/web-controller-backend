import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignUpDto } from './dto/sign-up.dto';
import * as bcrypt from 'bcrypt';
import { SignInDto } from './dto/sign-in.dto';
import { addWeeks, getUnixTime } from 'date-fns';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async signIn(payload: SignInDto) {
    const user = await this.prisma.user
      .findUniqueOrThrow({
        where: { username: payload.username },
      })
      .catch(() => {
        throw new UnauthorizedException('Invalid credential');
      });
    const isValid = bcrypt.compareSync(payload.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credential');
    }
    const exp = getUnixTime(addWeeks(new Date(), 1));
    const claims = {
      sub: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      iat: getUnixTime(new Date()),
      exp,
    };
    const token = this.jwt.sign(claims);
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    };
  }

  signUp(payload: SignUpDto) {
    const hash = bcrypt.hashSync(payload.password, 10);

    return this.prisma.user.create({
      data: { ...payload, password: hash },
      omit: { password: true },
    });
  }
}
