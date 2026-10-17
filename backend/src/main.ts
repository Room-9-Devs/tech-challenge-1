import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './infrastructure/http/filters/domain-exception.filter';
import { RepairSeedService } from './infrastructure/database/typeorm/seeds/repair.seed';
import { ProductSeedService } from './infrastructure/database/typeorm/seeds/product.seed';
import { EventTypeSeedService } from './infrastructure/database/seeds/event-type.seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.getHttpAdapter().getInstance().set('query parser', 'extended');

  app.useGlobalFilters(new DomainExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('API da Oficina Mecânica')
    .setDescription(
      'API da oficina mecânica com autenticação, usuários, permissões, tipos de reparo/serviço, produtos e veículos.',
    )
    .setVersion('1.0.0')
    .addTag('Autenticação')
    .addTag('Usuários')
    .addTag('Permissões')
    .addTag('Tipos de Reparo/Serviço')
    .addTag('Produtos')
    .addTag('Estoque')
    .addTag('Veículos')
    .addTag('Ordens de Serviço')
    .addTag('Estatísticas')
    .addTag('Aprovação de Orçamento')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Informe o token JWT de acesso.',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.get(RepairSeedService).run();

  const productSeedService = app.get(ProductSeedService);
  await productSeedService.run();
  await app.get(EventTypeSeedService).run();

  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/docs`);
}

bootstrap();
