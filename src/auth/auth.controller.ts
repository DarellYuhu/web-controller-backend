import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  signUp(@Body() payload: SignUpDto) {
    return this.authService.signUp(payload);
  }

  @Post('sign-in')
  signIn(@Body() payload: SignInDto) {
    return this.authService.signIn(payload);
  }
}
