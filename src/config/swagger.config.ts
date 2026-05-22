import { registerAs } from '@nestjs/config';

export default registerAs('swagger', () => ({
  title: process.env.SWAGGER_TITLE || 'Hotel Management API',
  description:
    process.env.SWAGGER_DESCRIPTION || 'API for hotel management system',
  version: process.env.SWAGGER_VERSION || '1.0',
}));
