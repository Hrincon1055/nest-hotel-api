import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') ?? 3000;
  const apiPrefix = configService.get<string>('app.apiPrefix') ?? 'api';
  const apiVersion = configService.get<string>('app.apiVersion') ?? 'v1';
  const corsOrigin = configService.get<string[]>('app.corsOrigin') ?? [
    'http://localhost:3000',
  ];
  app.use(helmet());
  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  const swaggerConfig = new DocumentBuilder()
    .setTitle(
      configService.get<string>('swagger.title') ?? 'Hotel Management API',
    )
    .setDescription(
      configService.get<string>('swagger.description') ??
        'API for hotel management',
    )
    .setVersion(configService.get<string>('swagger.version') ?? '1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'Employee authentication endpoints')
    .addTag('Employees', 'Employee management endpoints')
    .addTag('Customers', 'Customer management endpoints')
    .addTag('Rooms', 'Room management endpoints')
    .addTag('Reservations', 'Reservation management endpoints')
    .addTag('Additional Services', 'Additional services endpoints')
    .addTag('Housekeeping', 'Housekeeping task management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  fs.writeFileSync('./swagger.json', JSON.stringify(document, null, 2));
  logger.log('📄 Swagger JSON exported to ./swagger.json');

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Hotel Management API Docs',
  });
  await app.listen(port);
  logger.log(
    `🚀 Application is running on: http://localhost:${port}/${apiPrefix}/${apiVersion}`,
  );
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  logger.log(`🔧 Environment: ${configService.get<string>('app.nodeEnv')}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
