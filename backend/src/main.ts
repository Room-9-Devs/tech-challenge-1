import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './infrastructure/http/filters/domain-exception.filter';
import { RepairSeedService } from './infrastructure/database/typeorm/seeds/repair.seed';
import { ProductSeedService } from './infrastructure/database/typeorm/seeds/product.seed';
import { EventTypeSeedService } from './infrastructure/database/seeds/event-type.seed';

process.on('unhandledRejection', (reason) => {
  new Logger('Process').error(
    `Unhandled rejection: ${reason instanceof Error ? reason.stack : String(reason)}`,
  );
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.getHttpAdapter().getInstance().set('query parser', 'extended');

  app.useGlobalFilters(new DomainExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('API da Oficina Mecânica')
    .setDescription(
      'API da oficina mecânica: autenticação JWT, usuários (clientes e funcionários), permissões, ' +
        'veículos, tipos de reparo/serviço, produtos e estoque, ordens de serviço com orçamento e ' +
        'aprovação por e-mail, estatísticas de tempo de execução e histórico de eventos.',
    )
    .setVersion('1.0.0')
    .addTag('Autenticação', 'Login, renovação de token, logout e troca de senha')
    .addTag('Usuários', 'Cadastro e consulta de clientes e funcionários')
    .addTag('Permissões', 'Roles disponíveis e troca de role de um usuário')
    .addTag('Tipos de Reparo/Serviço', 'Catálogo de serviços oferecidos pela oficina')
    .addTag('Produtos', 'Catálogo de peças e insumos')
    .addTag('Estoque', 'Saldo por produto e movimentações de entrada, saída e ajuste')
    .addTag('Veículos', 'Veículos dos clientes e consulta de preços na tabela FIPE')
    .addTag('Ordens de Serviço', 'Abertura, itens do orçamento, status e confirmação de pagamento')
    .addTag('Estatísticas', 'Indicadores das ordens de serviço por período, incluindo tempos médios de execução')
    .addTag('Aprovação de Orçamento', 'Páginas abertas pelo link enviado ao cliente por e-mail')
    .addTag('Eventos', 'Histórico de auditoria por entidade')
    .addTag('Tipos de Evento', 'Catálogo dos tipos de evento registrados no histórico')
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
