# Spotify Clone

Protótipo local com React/Vite, Zustand e API Node.js/Express. O estado atual e o backlog estão em [PLANO.md](PLANO.md). `action-plan.md` é uma proposta histórica de arquitetura.

## Executar

Requer Node.js 26+ e npm. O backend usa o SQLite nativo de `node:sqlite`.

Em um terminal:

```sh
cd backend
npm ci
npm run dev
```

Em outro:

```sh
cd frontend/web
npm ci
npm run dev
```

Abra http://localhost:5173. O Vite encaminha `/api` para http://localhost:3000.

Conta de demonstração: `demo_user` / `password123`. Também é possível cadastrar uma conta pela interface.

## Validar

```sh
npm test --prefix backend
npm test --prefix frontend/web
npm run build --prefix frontend/web
```

Os 28 testes do backend usam diretórios temporários e portas aleatórias. Validam catálogo, autenticação, perfis, isolamento entre contas, playlists, reordenação, favoritos por conta e persistência em um novo processo e entrega de áudio com requisições parciais, migração, rollback e concorrência. 15 testes do frontend verificam a fila, shuffle, repetição, remoção de faixas e cálculo seguro das páginas e contagem de tempo efetivamente ouvido e reordenação sem perder faixas fora da página.

## Configuração e limites

- Backend: `PORT` (padrão 3000), `JWT_SECRET` (obrigatório em produção; chave local persistida em desenvolvimento), `ACCESS_TOKEN_TTL_SECONDS` (padrão 900) e `FRONTEND_ORIGIN` (origens autorizadas, separadas por vírgula).
- Frontend: `VITE_API_URL`, caso necessário, deve incluir `/api/v1`, por exemplo `http://localhost:3000/api/v1`.
- Dados e contas são salvos em SQLite (`backend/.data/spotify.sqlite`, ignorado pelo Git). `DATA_DIR` permite outro diretório. O banco usa WAL e transações; Redis e PostgreSQL não são necessários.
- Na primeira inicialização, os JSONs existentes são importados juntos, uma única vez. Arquivos inválidos interrompem a migração com rollback. Encerre a versão antiga da API antes de migrar. Os JSONs permanecem intactos como snapshot anterior e deixam de receber alterações.
- Artistas, álbuns, faixas, gêneros e relações do catálogo usam tabelas próprias e chaves estrangeiras. Imagens e metadados adicionais continuam em JSON; contas, sessões, playlists e favoritos mantêm o armazenamento documental transacional.
- A migração do catálogo é única e mantém os registros antigos como snapshot. Álbum com faixas e artista referenciado não podem ser excluídos (409). Excluir uma faixa a remove das playlists e curtidas na mesma transação, atualizando as durações. Renomear um álbum se reflete nas faixas; a busca aceita título, artista e álbum.
- O player usa três áudios instrumentais originais de demonstração, com 8, 10 e 12 segundos, servidos pela própria API. Os arquivos estão em `backend/public/audio/`; `python3 scripts/generate-demo-audio.py` os regenera.
- A fila preserva a ordem selecionada, continua ao navegar, avança ao término e, com repetição desligada, para na última faixa. Selecionar a mesma faixa reinicia o áudio. “Anterior” reinicia a faixa após 3 segundos; antes disso, volta à anterior. Play/pause, busca na faixa e volume foram validados no navegador.
- Playlists podem ser renomeadas, tornadas privadas, excluídas e ter faixas adicionadas/removidas e reordenadas pelo proprietário. A biblioteca autenticada mostra as playlists e uma lista paginada de artistas seguidos pela própria conta. Na página de um artista é possível seguir/deixar de seguir; os vínculos persistem entre sessões.
- A página **Meu perfil** permite editar nome e URL da foto, mantendo usuário e email como leitura. O nome é atualizado no cabeçalho e nas playlists da conta.
- Perfis usam as mesmas contas da autenticação. Cada usuário acessa e edita apenas seu perfil; mudanças no catálogo exigem papel de administrador (sem provisionamento de administrador pela interface).
- Curtidas são privadas por conta e aparecem em **Músicas curtidas**. Botões no catálogo, nos detalhes e no player compartilham o mesmo estado; os dados persistem após reiniciar.
- Aleatório embaralha apenas as faixas seguintes, preservando a atual e as anteriores; desligá-lo restaura a ordem original da seleção. Uma volta de repetição da fila usa a ordem já embaralhada.
- Repetição alterna entre desligada, fila e faixa. “Próxima” avança manualmente mesmo em repetição de faixa; em repetição de fila, os controles permitem voltar ao início/fim.
- É possível retirar faixas ou limpar a fila sem mudar a playlist salva. Remover a faixa atual reproduz a próxima; se era a última, reproduz a anterior restante. Limpar a fila para o áudio. Fila e modos duram apenas na sessão atual.
- Acesso JWT dura 15 minutos por padrão e permanece apenas na memória do navegador. O refresh token fica em cookie HttpOnly/SameSite=Strict, é rotacionado e expira em até 30 dias desde o login; em produção usa Secure e requer HTTPS. O SQLite armazena hashes dos refresh tokens.
- Requisições com acesso expirado compartilham uma renovação e são repetidas uma única vez. Recarregar restaura a sessão pelo cookie. Logout revoga a sessão no servidor, e reutilizar um refresh antigo revoga toda a família daquele login.
- A atualização remove o antigo token do localStorage; sessões da versão anterior exigem novo login. Use frontend/API no mesmo site (em desenvolvimento, mantenha o mesmo hostname); para produção com origens distintas, configure `FRONTEND_ORIGIN`.
- OAuth, arrastar e soltar e colaboração continuam pendentes. O protótipo destina-se a uso local.
- Catálogo, busca, biblioteca, detalhes de artista/álbum e faixas de playlists têm paginação de 10, 20 ou 50 itens, com página/quantidade na URL. URLs fora do intervalo são corrigidas após carregar os totais. Uma nova busca começa na primeira página. Artistas seguidos têm paginação independente na biblioteca, reiniciada ao reabrir a tela.
- A fila iniciada por uma lista paginada usa somente as faixas da página atual. Playlists preservam a ordem global e permitem reordenar entre páginas. Adicionar música usa busca paginada, sem o limite anterior de 100 faixas.
- Favoritos são paginados na interface; o contexto ainda carrega a coleção completa para compartilhar as curtidas entre telas. A API de catálogo aplica filtros, contagem e LIMIT/OFFSET no SQLite e carrega metadados apenas da página. A busca literal por substring pode percorrer o catálogo no banco.
- Listas usam `TrackList` compartilhado e paginação reutilizável. Os dez arquivos antigos fora do fluxo foram removidos, junto com dependências sem uso. O único ponto de entrada web é `frontend/web/src/main.jsx`.

O histórico de escuta fica em `/history`, acessível pela biblioteca e pelo menu. O player registra uma reprodução após três segundos de áudio tocando, sem somar pausas, travamentos ou saltos na barra. Retomar a mesma tentativa não duplica o registro; uma nova seleção, repetição automática ou avanço da fila inicia outra tentativa. A lista privada mostra registros mais recentes primeiro, com data, paginação e opção de limpar. Visitantes não registram histórico; falhas de gravação mostram uma opção de tentar novamente enquanto a faixa continua selecionada. Não há fila offline nem atualização em tempo real da lista aberta.

O proprietário pode arrastar pela alça ⠿ na playlist e soltar sobre outra faixa da página para movê-la à posição do destino. A ordem só muda após confirmação da API. Subir/Descer continuam disponíveis por teclado e permitem atravessar páginas; dispositivos sem suporte ao arraste HTML usam esses botões. Arraste não troca páginas nem reorganiza a fila que já está tocando.

O teste de navegador `frontend/web/tests/browser/playlist-drag.mjs` usa o build e uma fixture SQLite temporária com 121 faixas. Execute da raiz com Node.js, `PLAYWRIGHT_MODULE` apontando para o `index.mjs` de uma instalação de playwright-core e `BROWSER_EXECUTABLE` para um Chromium local: `node frontend/web/tests/browser/playlist-drag.mjs`. O teste inicia/encerra sua própria API e navegador; não usa os dados locais da aplicação.
