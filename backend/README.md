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
- `GET /api/v1/auth/me` — Bearer token
- `GET /api/v1/users` — próprio perfil; `GET/PUT/DELETE /api/v1/users/:id` — apenas a própria conta
- `/api/v1/tracks`, `/api/v1/albums`, `/api/v1/artists` — leitura pública; mutações somente para administradores
- `GET/POST /api/v1/playlists` — listar playlists visíveis / criar playlist
- `GET/PUT/DELETE /api/v1/playlists/:id` — detalhe / editar / excluir
- `POST /api/v1/playlists/:id/tracks` — `{ "trackIds": ["1", "2"] }`
- `DELETE /api/v1/playlists/:id/tracks/:trackId` — remover faixa
- `PUT /api/v1/playlists/:id/tracks/order` — `{ "trackIds": ["2", "1"] }`, permutação exata das faixas atuais; somente proprietário
- `GET /api/v1/me/liked-tracks` — favoritos da conta autenticada
- `PUT /api/v1/me/liked-tracks/:trackId` — curtir faixa existente (idempotente)
- `DELETE /api/v1/me/liked-tracks/:trackId` — descurtir (idempotente)

Mutações de playlists exigem o token do proprietário. Playlists privadas são visíveis apenas a ele; as públicas podem ser lidas sem token. GET de playlists aceita `userId`, `search`, `limit` (1–100) e `offset`. Faixas repetidas são deduplicadas, faixas inexistentes são rejeitadas e a duração é recalculada. Perfis usam o cadastro da autenticação e não expõem senhas. POST de usuários é feito por `/auth/signup`.

Favoritos são privados e retornam `{ "trackIds": [...], "data": [...] }`, preservando a ordem em que foram curtidos. Os IDs de usuário enviados pelo cliente não selecionam outra conta. As antigas rotas de follow/liked em `/playlists` não são aliases das novas rotas de favoritos; follow continua pendente. Validação abrangente dos descritores legados de catálogo continua pendente.

`JWT_SECRET` é obrigatório em produção. Em desenvolvimento, uma chave é gerada e salva no diretório de dados. Não há refresh token ou OAuth implementado.

`DATA_DIR` define o diretório de persistência (padrão `backend/.data/`). O arquivo `spotify.sqlite` usa WAL e busy timeout de 5 segundos. Registros mantêm o formato JSON dentro de uma tabela com chave composta por coleção/ID. Índices únicos de usuário e email protegem o cadastro.

A primeira inicialização importa users/settings/tracks/albums/artists/playlists/favorites dos JSONs existentes em uma única transação. A marca de migração é gravada somente no sucesso. Arquivos inválidos ou duplicidades interrompem a inicialização; os originais ficam intactos. Uma coleção vazia importada não recebe seeds na próxima inicialização. Encerre a API antiga antes de migrar; os JSONs não refletem alterações posteriores no SQLite.

Operações read-modify-write de playlists/favoritos usam transações. Alterar perfil também atualiza os donos das playlists na mesma transação; excluir uma conta remove suas playlists e favoritos juntos. O helper de transações exige callbacks síncronos e suporta savepoints. O catálogo legado ainda não está normalizado em tabelas relacionais.

O Compose existente é infraestrutura opcional para trabalho futuro; a API atual não o utiliza.

Os arquivos de demonstração são gerados por `scripts/generate-demo-audio.py`. A inicialização migra apenas as URLs originais SoundHelix das três faixas sem alterar URLs personalizadas, e atualiza as durações derivadas das playlists.
