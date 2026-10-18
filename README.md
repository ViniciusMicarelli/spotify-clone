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

Os 39 testes do backend usam diretórios temporários e portas aleatórias. Validam catálogo, autenticação, perfis, isolamento entre contas, playlists, reordenação, favoritos por conta e persistência em um novo processo e entrega de áudio com requisições parciais, migração, rollback e concorrência. 21 testes do frontend verificam fila, shuffle, repetição, remoção de faixas, paginação, tempo efetivamente ouvido, reordenação e construção das URLs de busca.

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

A busca permite escolher Músicas, Artistas ou Álbuns. Faixas aceitam título, artista e álbum; artistas e álbuns são buscados pelo próprio nome. O parâmetro `type=artists` ou `type=albums` guarda a escolha na URL; sem `type` a busca continua mostrando músicas. Trocar o tipo ou enviar outro termo reinicia a primeira página e preserva o tamanho escolhido (10/20/50). O campo acompanha o termo da URL, inclusive ao voltar no navegador. Cards abrem os detalhes, e consultas que falham têm botão de nova tentativa.

`frontend/web/tests/browser/search.mjs` valida a busca no Chromium com 25 artistas/álbuns temporários, sem alterar dados locais. Usa as mesmas variáveis `PLAYWRIGHT_MODULE` e `BROWSER_EXECUTABLE` do teste de arraste e também deve ser executado da raiz após o build. A fixture só acrescenta esses registros quando `SEARCH_FIXTURE=1`.

Artistas exibem biografia, país, gêneros e retrato nos detalhes; a foto também aparece na busca e na biblioteca. Dados ausentes têm indicação explícita, e imagens que falham usam um símbolo de música. Metadados são editados pela API administrativa: `biography` (até 5.000 caracteres), `country` (texto de até 100), `genres` e `images`. Artistas existentes não recebem biografias ou países inventados. Não há upload de fotos nem editor administrativo na interface.

O teste `frontend/web/tests/browser/artist-details.mjs` usa as mesmas variáveis de Chromium/Playwright dos demais roteiros. Cria uma fixture com `ARTIST_FIXTURE=1`, verifica detalhes, recarga, foto na busca, imagens ausentes/quebradas e viewport móvel. O retrato local de demonstração é um SVG genérico feito no projeto; não representa uma pessoa real.

Álbuns mostram capa, ano, gêneros, quantidade de faixas e duração total nos detalhes; os cards de busca incluem capa, ano e duração. Ano é opcional, sem valores inventados para registros antigos. A API aceita `year` inteiro entre 1 e 9.999 (ou `null` para remover) e `genres`, com as mesmas regras de imagens/gêneros dos artistas. Quantidade e duração são calculadas no SQLite a partir de todas as faixas, acompanhando edições, transferências e exclusões. `duration` não aceita escrita administrativa. O roteiro `frontend/web/tests/browser/album-details.mjs` valida a interface com `ALBUM_FIXTURE=1`, usando as mesmas variáveis de execução dos outros testes de navegador.

Os detalhes das faixas mostram informações medidas dos três WAVs locais: PCM, bitrate de 256 kbps, taxa de 16.000 Hz, mono, 16 bits e duração do arquivo. Esses dados vêm do cabeçalho RIFF e não alteram a duração cadastrada. URLs externas, arquivos ausentes ou formatos não reconhecidos mostram dados indisponíveis. A API analisa somente os três arquivos de demonstração ao iniciar; reinicie-a depois de trocar esses arquivos. Não há análise remota, transcodificação ou seleção de qualidade. O roteiro `frontend/web/tests/browser/track-technical.mjs` valida os detalhes, reprodução/pausa e os estados sem metadados, usando a fixture isolada `AUDIO_FIXTURE=1`.

O player mostra a forma de onda das demonstrações locais, gerada pelas amostras PCM (96 picos) e colorida conforme a reprodução. Clique ou use Home/End/setas para navegar; um contorno sinaliza o foco por teclado. A busca usa a duração real do áudio e não soma saltos ao histórico. A prévia é consultada somente após selecionar uma faixa; ausência ou falha mantém a barra de progresso disponível. Não há análise de forma de onda para URLs externas. O roteiro `frontend/web/tests/browser/waveform.mjs` valida mouse, teclado, pausa, viewport móvel e falha da API sem interromper o áudio.

Na busca de artistas, o seletor Gênero do artista combina um gênero exato com o termo pesquisado. As opções vêm de todo o catálogo de artistas; a escolha fica em `genre` na URL, é preservada em novas buscas e recargas e reinicia a primeira página ao mudar/limpar. Trocar para músicas ou álbuns remove o filtro. Um gênero removido do catálogo continua visível e pode ser limpo; falhas ao carregar opções têm nova tentativa sem bloquear os resultados. As opções são atualizadas ao reabrir a busca ou recarregá-las, sem atualização em tempo real. O roteiro `frontend/web/tests/browser/artist-genres.mjs` valida esse fluxo na fixture isolada de busca.

A busca de álbuns tem filtro por artista. Busque um nome na seção Artista do álbum, escolha um resultado e clique em Aplicar artista. A seleção de artistas tem páginas próprias de 20 itens, independentes dos álbuns, e não limita a escolha aos primeiros resultados. `artistId` fica na URL e é preservado ao pesquisar outro título; aplicar/limpar reinicia a página dos álbuns e mantém seu tamanho. Sair da busca de álbuns remove o filtro. Colaborações aparecem para qualquer artista associado, sem duplicação. Um artista indisponível pode ser limpo e falhas da seleção têm nova tentativa. `frontend/web/tests/browser/album-artists.mjs` valida o fluxo com dados temporários.

Álbuns também podem ser filtrados por ano exato: informe 1–9999 e clique em Aplicar ano. O parâmetro `year` combina com artista e título, persiste na URL e é preservado em novas buscas. Aplicar/limpar reinicia a página dos álbuns sem remover artista ou tamanho; sair da busca de álbuns remove ano/artista. Um link com ano inválido mostra o erro da API e permite Limpar ano. Álbuns sem ano informado ficam fora de filtros por ano. O roteiro `frontend/web/tests/browser/album-years.mjs` valida a combinação com a fixture temporária ALBUM_YEAR_FIXTURE.

Em álbuns, Ordenar álbuns oferece Padrão, Nome A–Z/Z–A e Ano mais recentes/mais antigos. A escolha fica em `sort` na URL, preserva artista/ano/termo/tamanho e reinicia a primeira página ao mudar. Anos não informados ficam no final nos dois modos de ano; empates têm ordem estável. Novas buscas e filtros mantêm a ordenação, e mudar de tipo a remove. URLs com ordenação inválida permitem voltar a Padrão. O roteiro `frontend/web/tests/browser/album-sort.mjs` valida os modos e sua combinação com filtros na fixture isolada.
