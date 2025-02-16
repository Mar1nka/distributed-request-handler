import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: [configService.get('FRONTEND_URL')],
    methods: 'GET,POST',
  });

  await app.listen(configService.get('APP_PORT') ?? 3000);
}

bootstrap();
