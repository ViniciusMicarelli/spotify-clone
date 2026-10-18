# API local

Node.js/Express, persistência local em SQLite (Node.js 26+) e autenticação JWT. Veja o [README principal](../README.md) para execução e limites.

```sh
npm ci
npm run dev
npm test
```

Entrada única: `api-gateway/index.js`, porta 3000 por padrão. Não é necessário iniciar microsserviços separados.

- `GET /health`
- `GET/HEAD /api/v1/audio/demo-{1,2,3}.wav` — PCM WAV local, com suporte a Range (206)
- `POST /api/v1/auth/signup` — username, email, password (mínimo 8 caracteres), name opcional
- `POST /api/v1/auth/signin` — username, password
- `GET /api/v1/auth/me` — Bearer token de acesso
- `POST /api/v1/auth/refresh` — cookie de refresh, rotaciona e retorna novo acesso
- `POST /api/v1/auth/signout` — revoga a família do cookie atual e limpa o cookie (idempotente)
- `GET /api/v1/users` — próprio perfil; `GET/PUT/DELETE /api/v1/users/:id` — apenas a própria conta
- `/api/v1/tracks`, `/api/v1/albums`, `/api/v1/artists` — leitura pública; mutações somente para administradores
- `GET/POST /api/v1/playlists` — listar playlists visíveis / criar playlist
- `GET/PUT/DELETE /api/v1/playlists/:id` — detalhe / editar / excluir
- `GET /api/v1/playlists/:id/tracks?limit=20&offset=0` — faixas na ordem da playlist, com dados de artistas e paginação
- `POST /api/v1/playlists/:id/tracks` — `{ "trackIds": ["1", "2"] }`
- `DELETE /api/v1/playlists/:id/tracks/:trackId` — remover faixa
- `PUT /api/v1/playlists/:id/tracks/order` — `{ "trackIds": ["2", "1"] }`, permutação exata das faixas atuais; somente proprietário
- `GET /api/v1/me/liked-tracks` — favoritos da conta autenticada
- `PUT /api/v1/me/liked-tracks/:trackId` — curtir faixa existente (idempotente)
- `DELETE /api/v1/me/liked-tracks/:trackId` — descurtir (idempotente)

Mutações de playlists exigem o token do proprietário. Playlists privadas são visíveis apenas a ele; as públicas podem ser lidas sem token. GET de playlists aceita `userId`, `search`, `limit` (1–100) e `offset`. Faixas repetidas são deduplicadas, faixas inexistentes são rejeitadas e a duração é recalculada. Perfis usam o cadastro da autenticação e não expõem senhas. POST de usuários é feito por `/auth/signup`.

Favoritos são privados e retornam `{ "trackIds": [...], "data": [...] }`, preservando a ordem em que foram curtidos. Os IDs de usuário enviados pelo cliente não selecionam outra conta. As antigas rotas de follow/liked em `/playlists` não são aliases das novas rotas de favoritos; seguir artistas usa as rotas próprias descritas abaixo. O catálogo agora usa rotas próprias com validação e relações normalizadas.

`JWT_SECRET` é obrigatório em produção. Em desenvolvimento, uma chave é gerada e salva no diretório de dados. OAuth continua pendente.

`DATA_DIR` define o diretório de persistência (padrão `backend/.data/`). O arquivo `spotify.sqlite` usa WAL e busy timeout de 5 segundos. Registros mantêm o formato JSON dentro de uma tabela com chave composta por coleção/ID. Índices únicos de usuário e email protegem o cadastro.

A primeira inicialização importa users/settings/tracks/albums/artists/playlists/favorites dos JSONs existentes em uma única transação. A marca de migração é gravada somente no sucesso. Arquivos inválidos ou duplicidades interrompem a inicialização; os originais ficam intactos. Uma coleção vazia importada não recebe seeds na próxima inicialização. Encerre a API antiga antes de migrar; os JSONs não refletem alterações posteriores no SQLite.

Operações read-modify-write de playlists/favoritos usam transações. Alterar perfil também atualiza os donos das playlists na mesma transação; excluir uma conta remove suas playlists e favoritos juntos. O helper de transações exige callbacks síncronos e suporta savepoints. O catálogo usa tabelas relacionais próprias; imagens/metadados adicionais e as coleções de contas/playlists/favoritos continuam documentais.

O Compose existente é infraestrutura opcional para trabalho futuro; a API atual não o utiliza.

Os arquivos de demonstração são gerados por `scripts/generate-demo-audio.py`. A inicialização migra apenas as URLs originais SoundHelix das três faixas sem alterar URLs personalizadas, e atualiza as durações derivadas das playlists.

## Sessões

JWT de acesso contém `sid` e tem validade padrão de 900 segundos (`ACCESS_TOKEN_TTL_SECONDS`). A sessão é verificada no banco em cada chamada protegida, permitindo revogação imediata. JWTs da versão anterior sem sessão não são mais aceitos.

O cookie `spotify_refresh` usa HttpOnly, SameSite=Strict e Path=/api/v1/auth; Secure em produção. Cada renovação troca o token aleatório e marca seu hash anterior como usado. Reaproveitamento revoga a família inteira. O prazo máximo é fixo em 30 dias, sem estender em cada renovação. Login cria uma família; outros logins independentes permanecem válidos. Exclusão de conta remove sessões e hashes na mesma transação dos demais dados. Famílias expiradas são limpas ao criar uma nova sessão.

Rotas de autenticação usam Cache-Control: no-store e validam Origin. Em desenvolvimento aceitam loopback; em produção aceitam a própria origem e `FRONTEND_ORIGIN` (lista separada por vírgula). CORS reflete a origem e permite credenciais; as rotas de cookie aplicam a validação de origem antes de qualquer alteração. A implantação deve usar HTTPS e frontend/API no mesmo site para o cookie Strict.

A fixture `node backend/tests/fixtures/session-server.js` serve o build em 127.0.0.1:5175 com SQLite temporário e acesso de dois segundos, atrasando o login para entregar acesso expirado. Ela permite verificar recuperação simultânea de 401 sem alterar dados reais. Encerre o processo ao terminar.

## Catálogo relacional

Na inicialização, uma migração com marcador `catalog_version=1` cria artistas, álbuns, faixas, gêneros e relações artista/álbum e artista/faixa. A migração é atômica e preserva as coleções originais de `records` como snapshot; depois dela, essas cópias não são o catálogo ativo. Referências inválidas interrompem a inicialização e revertem a migração; os dados de origem devem ser corrigidos antes de repetir. Faça backup consistente do banco antes de atualizar. Na sessão de implementação foi usada uma cópia SQLite via VACUUM INTO, preservada em `.data/backups/`.

Leituras mantêm o formato da API anterior, com artistas por ID e álbum expandido nas faixas. Faixas também retornam `artistDetails` (ID/nome). `totalTracks` e os nomes de álbuns nas faixas são calculados a partir das relações atuais.

Mutações exigem administrador e usam UUIDs:

- Artistas: `name` obrigatório; opcionais `images`, `genres`, `followers` (inteiro não negativo), `biography` e `country`.
- Álbuns: `name` obrigatório; opcionais `images` e `artists` (IDs únicos existentes).
- Faixas: `title`, `duration` em milissegundos positivos, `url` HTTP(S) ou `/api/v1/audio/...`, `albumId` existente e `artists` (lista de IDs). Também aceita `album: { id }` por compatibilidade.
- PUT aceita atualização parcial. O vínculo de faixa/álbum é alterado na faixa; o antigo campo `tracks` de escrita de álbum é rejeitado para evitar duas fontes de verdade.
- GET de listas aceita `limit` de 1 a 100, `offset` inteiro não negativo e `search`. Faixas aceitam `artistId` e `albumId`; álbuns, `artistId`; artistas, `genre`.
- Busca de faixas considera título, nome dos artistas e nome do álbum. `totalTracks` muda automaticamente ao criar, mover ou remover faixas.
- Excluir álbum com faixas ou artista com vínculos retorna 409. Primeiro mova/remova as faixas e vínculos. Excluir faixa limpa playlists/favoritos e recalcula durações na mesma transação; falha em qualquer etapa faz rollback completo.

Não há tela de administração ou cadastro de administrador pela interface. Os testes usam uma conta administrativa em banco temporário.

A leitura paginada de faixas valida limit (1–100) e offset inteiro seguro não negativo. Retorna `{ data, pagination: { total, limit, offset } }`, respeitando a mesma visibilidade do detalhe: conteúdo privado retorna 404 para outros usuários e visitantes. Não depende de carregar as primeiras 100 faixas do catálogo. O teste de API usa 103 faixas e verifica a página posterior à posição 100.

A fixture `node backend/tests/fixtures/pagination-server.js` serve o build com SQLite temporário, 121 faixas e uma playlist privada da conta demo, em 127.0.0.1:5175. Não altera o banco normal. Encerre o processo ao terminar.

Listagens de artistas, álbuns e faixas aplicam busca, filtros, contagem e LIMIT/OFFSET no SQLite, em um snapshot de leitura. A ordem permanece a de inserção. Busca usa substring literal com conversão Unicode para minúsculas: `%` e `_` não são curingas. Relações usam EXISTS para evitar duplicação; somente os IDs da página recebem metadados completos. A busca por substring ainda pode percorrer registros no banco; não há FTS.


Artistas seguidos (todas as rotas exigem autenticação):

- `GET /api/v1/me/followed-artists?limit=20&offset=0` retorna `{ data, pagination }`, na ordem em que foram seguidos; limites 1–100.
- `GET /api/v1/me/followed-artists/:artistId` retorna `{ following, followers }`.
- `PUT /api/v1/me/followed-artists/:artistId` segue; `DELETE` deixa de seguir. Ambos são idempotentes e retornam o estado atualizado; artista inexistente retorna 404.

A conta vem exclusivamente do token. A tabela SQLite `artist_follows` tem chave única conta/artista e FKs com exclusão em cascata para os artistas e registros de usuário. Listas têm paginação SQL e snapshot de leitura. `followers` no catálogo e no estado de follow soma o valor base importado aos vínculos locais; a escrita administrativa desse campo define somente o valor base. Editar outros metadados não incorpora a contagem derivada ao valor base. O total é público; a lista de artistas seguidos de cada conta é privada.


Histórico de escuta (autenticado):

- `GET /api/v1/me/history?limit=20&offset=0`: `{ data, pagination }`, mais recentes primeiro. Cada faixa inclui `playbackId` e `playedAt` (horário do servidor), além dos metadados atuais. Limites 1–100.
- `PUT /api/v1/me/history/:playbackId`: corpo `{ "trackId": "1" }`, UUID v4 por tentativa de reprodução. Idempotente por conta/UUID; reutilizar UUID com outra faixa retorna 409. Faixa inexistente retorna 404; dados inválidos retornam 400.
- `DELETE /api/v1/me/history`: limpa apenas o histórico da conta autenticada, de forma idempotente.

A tabela `listening_history` usa FKs com exclusão em cascata para faixas/contas, índice por conta/sequência e paginação SQL em snapshot de leitura. Repetições reais da mesma faixa podem aparecer como registros distintos. O player envia após três segundos efetivamente tocados; a API recebe eventos declarados pelo cliente e não comprova escuta no servidor. Não há retenção automática, sincronização em tempo real ou envio offline. Uma nova reprodução em andamento pode gerar registro depois de uma limpeza.


Metadados de artistas: `biography` aceita texto de até 5.000 caracteres, preservando quebras de linha; `country` aceita texto livre de até 100 caracteres (não é validação de código ISO). Ambos removem espaços nas pontas, são opcionais e podem ser apagados com string vazia; `null` é inválido. Permanecem no JSON metadata do SQLite e dispensam migração destrutiva. O gênero é a categoria: até 20 entradas de até 80 caracteres, aparadas e deduplicadas.

Fotos de artistas: até 10 objetos `{ url, width?, height? }`. URL tem até 2.048 caracteres, aceita HTTP/HTTPS sem credenciais ou `/api/v1/images/<arquivo>.(svg|png|jpg|jpeg|webp)` sem subdiretórios. Dimensões opcionais são inteiros entre 1 e 10.000. Outros campos/protocolos são rejeitados. `images: []` remove fotos. `/api/v1/images` serve os arquivos locais em `backend/public/images`; não é rota de upload. Validação e gravação são transacionais; permissões administrativas não mudaram.
