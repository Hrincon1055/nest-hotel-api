import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { GlobalExceptionFilter } from './common/filters';
import { RolesGuard } from './common/guards';
import {
  LoggingInterceptor,
  TransformInterceptor,
} from './common/interceptors';
import { appConfig, databaseConfig, jwtConfig, swaggerConfig } from './config';
import { DatabaseModule } from './database';
import { AuthModule } from './modules/auth';
import { JwtAuthGuard } from './modules/auth/guards';
import { CustomersModule } from './modules/customers';
import { EmployeesModule } from './modules/employees';
import { HousekeepingModule } from './modules/housekeeping';
import { ReservationsModule } from './modules/reservations';
import { RoomsModule } from './modules/rooms';
import { ServicesModule } from './modules/services';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, swaggerConfig],
      envFilePath: ['.env', '.env.local'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
        limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
      },
    ]),
    DatabaseModule,
    AuthModule,
    EmployeesModule,
    CustomersModule,
    RoomsModule,
    ReservationsModule,
    ServicesModule,
    HousekeepingModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
