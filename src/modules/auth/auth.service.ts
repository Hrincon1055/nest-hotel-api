import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { JwtPayload, TokenPair } from '../../common/interfaces';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto, RefreshTokenDto } from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<TokenPair & { employee: any }> {
    const { email, password } = loginDto;
    const employee = await this.prisma.employee.findUnique({
      where: { email, deletedAt: null },
    });
    if (!employee) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (employee.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }
    const isPasswordValid = await bcrypt.compare(password, employee.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const tokens = await this.generateTokens(
      employee.id,
      employee.email,
      employee.role,
    );

    await this.saveRefreshToken(employee.id, tokens.refreshToken);
    this.logger.log(`Employee ${employee.email} logged in successfully`);
    const { password: _, ...employeeWithoutPassword } = employee;
    return {
      ...tokens,
      employee: employeeWithoutPassword,
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<TokenPair> {
    const { refreshToken } = refreshTokenDto;
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { employee: true },
    });
    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (storedToken.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }
    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }
    if (storedToken.employee.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }
    try {
      await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });
    const tokens = await this.generateTokens(
      storedToken.employee.id,
      storedToken.employee.email,
      storedToken.employee.role,
    );
    await this.saveRefreshToken(storedToken.employee.id, tokens.refreshToken);
    this.logger.log(
      `Tokens refreshed for employee ${storedToken.employee.email}`,
    );
    return tokens;
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: {
          employeeId: userId,
          token: refreshToken,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: {
          employeeId: userId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }
    this.logger.log(`Employee ${userId} logged out`);
  }

  async validateUser(userId: string): Promise<any> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });
    if (!employee || employee.status !== 'ACTIVE') {
      return null;
    }
    return employee;
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn:
          this.configService.get<string>('jwt.expiresIn') ?? ('15m' as any),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn:
          this.configService.get<string>('jwt.refreshExpiresIn') ??
          ('7d' as any),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, token: string): Promise<void> {
    const expiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d';
    const expiresAt = this.calculateExpirationDate(expiresIn);
    await this.prisma.refreshToken.create({
      data: {
        token,
        employeeId: userId,
        expiresAt,
      },
    });
  }

  private calculateExpirationDate(expiresIn: string): Date {
    const now = new Date();
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    const [, value, unit] = match;
    const numValue = parseInt(value, 10);
    switch (unit) {
      case 's':
        return new Date(now.getTime() + numValue * 1000);
      case 'm':
        return new Date(now.getTime() + numValue * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + numValue * 60 * 60 * 1000);
      case 'd':
        return new Date(now.getTime() + numValue * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }
}
