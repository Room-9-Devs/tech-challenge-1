import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './infrastructure/http/filters/domain-exception.filter';
import { ServiceTypeSeedService } from './infrastructure/database/typeorm/seeds/service-type.seed';
import { ItemSeedService } from './infrastructure/database/typeorm/seeds/item.seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new DomainExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('API da Oficina Mecânica')
    .setDescription('API da oficina mecânica com autenticação, usuários, permissões e tipos de serviço.')
    .setVersion('1.0.0')
    .addTag('Autenticação')
    .addTag('Usuários')
    .addTag('Permissões')
    .addTag('Tipos de serviço')
    .addTag('Items')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'Authorization', description: 'Informe o token JWT de acesso.', in: 'header' }, 'access-token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  await app.get(ServiceTypeSeedService).run();

  const itemSeedService = app.get(ItemSeedService);
  await itemSeedService.run();

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/docs`);
}

bootstrap();
