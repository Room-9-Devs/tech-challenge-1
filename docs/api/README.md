# API

Documentação e ferramentas para usar a API REST do **Sistema de Gestão da Oficina Mecânica**.

## Swagger / OpenAPI

Com a aplicação no ar (ver [execução no README principal](../../README.md#execução-com-docker-compose)), a documentação interativa da API fica em:

```
http://localhost:3000/docs
```

Para chamar as rotas protegidas pelo Swagger, faça login em `POST /auth/login`, copie o `accessToken` da resposta e informe-o no botão **Authorize**.

## Coleção do Postman

[oficina-mecanica.postman_collection.json](oficina-mecanica.postman_collection.json) cobre todas as rotas da API, com o fluxo feliz e os erros esperados (400, 401, 403, 404 e 409) de cada uma, em 212 requests.

1. No Postman, use **Import** e selecione o arquivo da coleção.
2. Confira a variável `baseUrl` da coleção (padrão `http://localhost:3000`).
3. Rode **Autenticação > Login (admin)**: o token é salvo na variável `accessToken` e usado pelas rotas protegidas. Os logins de staff e client salvam `staffToken` e `clientToken`, usados nos testes de permissão.
4. Os requests de criação geram dados únicos a cada execução e salvam os IDs criados em variáveis, usadas pelos requests seguintes. Rode as pastas na ordem da coleção, ou a coleção inteira pelo **Collection Runner**. A coleção pode ser executada várias vezes seguidas na mesma base. Login e renovação de token são limitados a 20 tentativas por minuto por IP, e cada execução faz 12 dessas chamadas: aguarde um minuto entre execuções ou aumente `AUTH_THROTTLE_LIMIT` no `backend/.env`.

Observações sobre algumas pastas:

- **Ordens de Serviço:** é independente das outras pastas. Os requests **Preparar** criam o cliente (com login próprio, em `osClientToken`), o veículo, o serviço e a peça usados nas OS. O fluxo principal cobre abertura, itens, envio do orçamento com reserva de estoque, consulta e aprovação pelo próprio cliente, baixa do estoque, pagamento, execução, entrega e histórico de eventos. A subpasta **Recusa do orçamento** cobre a recusa com liberação da reserva.
- **Aprovação em HTML** (dentro de Ordens de Serviço): usa a variável `approvalToken`, que deve ser preenchida manualmente com o token do link recebido por e-mail. Sem token, os requests esperam 404.
- **Estatísticas:** indicadores das OS por período (`GET /stats`), exclusivos do admin.
- **Resiliência da auditoria:** confirma que uma falha num handler de auditoria não derruba o servidor. Altera temporariamente o tipo de evento `vehicle.updated` e o restaura no final.
- **Encerramento:** altera a senha (e a restaura) e faz logout. Fica por último.

## Usuários de demonstração

Criados pelo seed (`npm run seed`, dentro de `backend/`), todos com a senha `password123`:

| Usuário | Perfil | Papel |
|---|---|---|
| `jose.silveira` | Colaborador | `admin` |
| `quiteria.dantas` | Colaborador | `staff` |
| `jeremias.lopes` | Colaborador | `staff` |
| `agnaldo.guimaraes` | Cliente | `client` |

As regras de acesso de cada papel estão no [C4 — Nível 3](../c4/03-component.md#autenticação-e-autorização).
