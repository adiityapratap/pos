import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PinStrategy } from './strategies/pin.strategy';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Read directly from process.env as fallback (Railway passes env vars directly)
        const secret = configService.get<string>('JWT_SECRET') || process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || process.env.JWT_EXPIRES_IN || '8h';
        
        console.log('JWT Config:', { secretSet: !!secret, expiresIn });
        
        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as any,
          },
        };
      },
    }),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PinStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
