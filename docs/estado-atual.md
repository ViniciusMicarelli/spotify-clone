# Estado verificado — 18/10/2026

## Resultado desta etapa

- API inicia em um processo Express, sem Redis/PostgreSQL.
- Frontend gera build de produção com Vite.
- 35 testes do backend e 17 testes do frontend passam: catálogo/busca, cadastro/login/JWT, criação autenticada de playlist, perfis/permissões/duração , reordenação, favoritos por conta e persistência em processo separado.
- REA executou login demo, carregamento do catálogo, criação de playlist e busca por Digital no Chromium. Todos os passos do cenário final foram concluídos, com zero eventos de erro de página.

Evidência REA: `ev_c003a7ed8b665e6b85f1785ab417932af1862e5eb790a0f5e663cbdbdd1fab88` (`capture_browser_scenario`, execução controlada, Chromium 156.0.8078.4). URL local usada: `http://127.0.0.1:5174`. O navegador temporário foi encerrado pela REA.

As duas primeiras tentativas de cenário pararam por seletores inadequados do teste: atributo type ausente no botão de submit e seletor de faixa com três correspondências. O cenário final corrigiu esses seletores.

## Limites e retomada

O player agora usa três amostras PCM locais originais de 8, 10 e 12 segundos, geradas por `scripts/generate-demo-audio.py`. O teste de mídia valida o cabeçalho, a duração declarada e o suporte a Range. A reprodução e os controles foram observados no Chromium headless; isso não valida a saída física dos alto-falantes nem outros navegadores. As durações das evidências históricas abaixo precedem a migração do catálogo para essas amostras.

Contas, catálogo, playlists e chave de desenvolvimento agora são persistidos em SQLite com WAL e transações. A importação dos JSONs acontece uma única vez e preserva os arquivos originais. Perfis usam as contas da autenticação. Playlists privadas só são lidas pelo proprietário; as mutações também são restritas ao proprietário. Mutações de catálogo exigem administrador.

## Validação adicional com REA

- `ev_1bf4171c79fb5222a0cc3efc80be942a7befdfc7e5b8b144a480cacb9083f46b`: criação, adição de faixa, remoção, adição de outra faixa, renomeação e mudança para privada concluídas. O último passo de reabertura expirou; este cenário é parcial.
- `ev_6a203fd3d8f4642f3afd6a16e2966c5c9932409fa88bee6418bfd8b620ef6c7d`: em novo navegador temporário, login, biblioteca e reabertura da playlist concluídos. Captura confirma playlist privada com Digital Dreams e duração 3:21; zero erros de página. O cenário aguardou o card específico e clicou no título.

As evidências são observações controladas de `http://127.0.0.1:5174` em Chromium 156.0.8078.4. A REA encerrou os navegadores temporários. Elas não comprovam reprodução de áudio, colaboração nem segurança abrangente.

## Reordenação e favoritos

A interface permite subir/descer faixas. O endpoint de reordenação exige uma permutação exata, restrita ao proprietário. Favoritos usam armazenamento privado por conta e operações idempotentes; o estado é compartilhado entre catálogo, detalhes, player e Músicas curtidas. Testes de integração confirmam isolamento, validação e persistência de ordem/curtidas em outro processo.

Evidências REA adicionais:

- `ev_f0f4a142c23750379e46c2309554d8210cd3bd8f8f70b875086f2194570fdc88`: cenário completo com login, abertura de playlist salva, movimento da segunda faixa para o início e confirmação visual. Captura de rede registra PUT de reordenação com resposta 200; nenhum erro de página.
- `ev_31cec7b77caab0ba26b61fe25ddcf57f4d94f8f1949af0e8c90435ab1e66ac9f`: cenário completo com login, curtida no catálogo, navegação para Músicas curtidas e descurtida, confirmando remoção da linha. Nenhum erro de página.
- Cenários longos `ev_a4850486838fbf0c80bd481952eb190e0d36bbf875689c43bd8ab5a59c5fa04b` e `ev_f2af15a5036310b01c368526eb118f21aec9ce077b27361c6f4fa8066d5cdbe6` foram parciais, com timeouts em navegação/ação. Não estabelecem sucesso completo. As verificações focadas acima aguardaram explicitamente a página e os controles habilitados.

## Reprodução e fila

- `ev_5ea6a5f8f1a8bd2fa872b58c4273e4b3bbab1a3d9df2ee6cbfd7f9f33ac0728a`: cenário completo com play/pause, avanço do relógio, seek, ajustes do volume, próxima/anterior, término via seek para avançar automaticamente, encerramento da última faixa e reinício por seleção. As respostas de áudio retornaram 206; nenhum erro de página.
- `ev_69f51931b6d9a2eb7d32d66235dc87232990ad7590fa181936cce48ab2e043c2`: cenário completo observando o término natural da primeira amostra e a passagem para a segunda. A reprodução continuou ao navegar para a biblioteca. Nenhum erro de página.
- `ev_220cfff177f7331ffd157b9bc2ac794b3916dcf45ca141928ff874b9f5eaab14`: build de produção servido por fixture isolada em `http://127.0.0.1:5175`; uma URL de áudio responde 404. O erro e a nova tentativa foram observados, seguidos de reprodução da próxima faixa e remoção da mensagem de erro. Nenhum erro de página. Fixture: `backend/tests/fixtures/player-error-server.js`; não carrega dados persistidos.

Os cenários foram executados pela REA com navegadores temporários próprios, encerrados após as capturas. A fila é uma cópia da seleção: edições posteriores na playlist não mudam silenciosamente a ordem em reprodução. Shuffle/repeat foram implementados na etapa seguinte; sincronização entre dispositivos continua pendente.

Para repetir a fixture, gere o build e execute `node backend/tests/fixtures/player-error-server.js`; encerre o processo após a verificação. O aplicativo normal segue em `http://127.0.0.1:5174` nesta sessão.

## Shuffle, repetição e edição da fila

Embaralhar mantém a faixa atual e o trecho anterior, reorganizando só o restante. Desligar restaura a ordem original da seleção, sem restaurar faixas removidas. As ordens aleatórias são calculadas fora do reducer, evitando efeitos aleatórios durante a renderização. Repetição de faixa se aplica ao evento de término; o botão Próxima continua avançando. Repetição de fila permite circular nos dois extremos. Uma nova volta mantém a ordem embaralhada atual.

Remover faixas anteriores ou posteriores não reinicia o áudio atual. Remover a faixa atual seleciona sua sucessora, ou a anterior se era a última. Remover a única faixa e limpar a fila encerram a reprodução. Essas operações não gravam alterações na playlist. Fila e modos não persistem após recarregar a página.

Evidências REA em `http://127.0.0.1:5174`:

- `ev_11d1725478acad38b43acef19e311a74a1d85a4c7afce438bc1996ae96c9fd4c`: cenário completo de repetição de fila da última para a primeira, reinício da mesma faixa, avanço manual em repeat-one e término com repetição desligada. Os términos foram induzidos com seek até o fim. Zero erros de página.
- `ev_aaefea46711ade4a47abb452f79d8e58b37a57bec1ce09a37d50d91098037f32`: cenário completo de ativação/desativação do aleatório preservando pausa e seleção, restauração da ordem, remoção da faixa atual com avanço à sucessora, remoção de faixa anterior e limpeza com áudio parado. Zero erros de página.

## SQLite e perfil

O armazenamento passa a usar `node:sqlite` (Node.js 26+) e mantém uma fachada compatível com Map, lendo diretamente do banco. O esquema atual armazena JSON por coleção/ID; não é uma normalização completa do catálogo. Migração de todas as coleções, índices únicos de usuário/email, operações de playlist/favoritos e atualizações relacionadas do perfil usam transações síncronas. Savepoints permitem rollback interno. A exclusão de conta remove também suas playlists e favoritos.

Quatro testes isolados validam: importação única com preservação dos JSONs, rollback de migração inválida e nova tentativa, rollback entre coleções/savepoints e incremento concorrente por dois processos sem perda de atualizações. A API adiciona cobertura para propagação de nome/foto nas playlists e limpeza de dados da conta.

Os dados reais desta sessão foram migrados após encerrar a API antiga. As sete coleções foram comparadas por chave e conteúdo com os JSONs originais: todas idênticas antes da verificação do perfil.

Evidência REA `ev_1c029c7a0ee76ac28c5341c1abdca11566a6bc60dbe3fcbce2bb70561ffe1525`: login demo, abertura de Meu perfil, alteração do nome, atualização do cabeçalho, recarga confirmando persistência e restauração do nome original. Cenário completo, sem erros de página, em `http://127.0.0.1:5174`.

## Renovação e revogação de sessão

Tokens de acesso duram 15 minutos por padrão e ficam em memória. Um cookie HttpOnly/SameSite=Strict guarda o refresh token aleatório; a cada uso há rotação com prazo absoluto de 30 dias desde o login. SQLite mantém hashes e famílias de sessão. Reuso revoga a família, e logout invalida também o acesso já emitido. O frontend compartilha a renovação entre chamadas concorrentes, repete a requisição uma vez e serializa operações de sessão; usa Web Locks quando disponíveis para coordenar abas da mesma origem.

Cinco testes adicionais cobrem atributos do cookie, ausência de refresh em JSON e de token bruto no armazenamento, acesso expirado, rotação, replay com isolamento entre logins, logout, refresh inválido/expirado e rejeição de Origin não autorizado.

REA: `ev_1b4f86a8274e4b9d565500155b983c4ccbd8a5f18afb4a2ad074f47341051fc6`. Fixture isolada com build de produção, SQLite temporário e token de dois segundos entregue após expirar. Captura mostra `/auth/me` e `/me/liked-tracks` com 401, uma única chamada de refresh 200 e repetição bem-sucedida das leituras. Também confirma restauração após recarregar, logout e recarga permanecendo visitante. Cenário completo, sem erros de página.

As primeiras tentativas `ev_5ec1eaae6de273ced6e8c68777c54c65361b4a16bcf101ac203b1e5e2f9cf809` e `ev_80b9704777d0297c2c9236bcd3717f2ad168ae53b2ae9791930cc00e5e4937a0` foram parciais por timeout ao navegar após a espera de expiração. Não comprovam o fluxo. O cenário final usa atraso controlado na resposta de login para tornar o acesso expirado e observar diretamente as requisições concorrentes.

Sessões antigas sem `sid` exigem novo login. OAuth permanece pendente. Cookies Strict exigem frontend/API no mesmo site; produção requer HTTPS e configuração da origem autorizada.

## Normalização do catálogo

Artistas, gêneros, álbuns, faixas e relações agora usam tabelas próprias, chaves estrangeiras e índices. Imagens e metadados adicionais permanecem em JSON. A migração com `catalog_version=1` é transacional, preserva as coleções antigas como snapshot e não é repetida em reinicializações. Faixas retornam nomes atuais de álbum e artistas, e álbuns calculam totalTracks a partir das relações.

Quatro testes adicionais cobrem: CRUD e movimentação de faixas com contagens derivadas; referências, URLs e paginação inválidas; exclusão de faixa com limpeza de playlists/favoritos e rollback induzido; migração única com snapshot preservado e rollback de referências inválidas. A restrição real de FK também é exercitada por SQL direto no teste isolado.

Antes da migração local foi criado backup consistente em `.data/backups/before-catalog-1792334133226.sqlite` (não versionado). Após a inicialização: 3 artistas, 3 álbuns e 3 faixas; PRAGMA integrity_check = ok, zero violações de FK.

REA `ev_f40c4a7b645cc1d0ba770cd6ea3d0c533e4c5e5ac4f141d3576efb6efa6231e6`: catálogo, busca por Artist 1, abertura do artista, navegação para o álbum e reprodução da faixa com progresso. Cenário completo no aplicativo local em 127.0.0.1:5174, sem erros de página.

Os descritores antigos foram substituídos por routers validados. Álbum com faixas ou artista ainda referenciado retorna 409 na exclusão. A exclusão de faixa atualiza playlists, favoritos e durações na mesma transação. Contas, sessões, playlists e favoritos permanecem documentais; não há painel de administração.

## Listas, limpeza e paginação

Removidos dez arquivos sem uso no grafo de imports: entrada web paralela, layouts, players e estilos antigos. Dependências não utilizadas foram removidas (91 pacotes transitivos deixaram a instalação). Catálogo, playlists e favoritos usam TrackList; Pagination/usePage compartilham cálculo e navegação. A criação de playlist passou para uma página própria.

Página e tamanho (10/20/50) ficam na URL; a interface corrige páginas acima do total. A fila usa as faixas da página atual, com aviso quando há mais de uma página. Favoritos ainda são carregados integralmente pelo contexto, com paginação local. A API de catálogo ainda filtra em memória. A seleção de músicas para adicionar à playlist usa busca e páginas independentes de 20 itens.

O endpoint GET /playlists/:id/tracks lê os IDs da playlist na ordem salva, aplica limit/offset e retorna metadados completos. Ele elimina a dependência das primeiras 100 faixas do catálogo. Teste com 103 faixas confirma ordem e proteção de conteúdo privado. Três testes do frontend validam offsets, exclusão do único item da última página e parâmetros inseguros.

REA, fixture isolada de produção com 121 faixas em 127.0.0.1:5175:

- `ev_8320586187536ba6ae121320be16662885c76789f3181c2131c5f65e868f0934`: cenário completo de tamanho da página, próxima página, restauração após recarregar, nova busca e correção de page=999. Zero erros de página.
- `ev_75cd2999693b5133c8e63c4edbf1988c153a546aa529601370554eb6c8aa24b9`: remoção na última página levou à anterior, e a faixa foi encontrada e adicionada novamente; o cenário ficou parcial por timeout no passo posterior de reordenação.
- `ev_e4afd2347a45359777afc839cdda566960d50a26b052dd27c345c2ab1f34f9b3`: cenário separado completo de reordenação da faixa 121 para a página anterior, com PUT 200 e confirmação da nova posição.
- `ev_9e7f92cb2f1895c95b8bd686274943ca6215bfa994ea9c6c2e1ffd7fe825bbf1`: tentativa longa parcial por timeout após adicionar a faixa; não comprova o fluxo completo.
- `ev_7f37392b0ed746a290aa88890d097b6e1970ecee7cf9df9f016a5f04b5913703`: cenário completo com busca, seleção, espera do botão habilitado, adição e reordenação entre páginas; a posição na página anterior foi confirmada. Zero erros de página. Usou ativação por teclado nos controles.

Os navegadores temporários foram encerrados pela REA. O processo da fixture também foi encerrado ao final.

Etapa seguinte concluída abaixo: filtros e paginação diretamente no SQL. OAuth e colaboração permanecem pendentes; follow foi implementado na etapa registrada abaixo.


## Filtros e paginação SQL — 18/10/2026

Listagens do catálogo agora executam filtros, contagem e LIMIT/OFFSET no SQLite, hidratando somente a página retornada. SAVEPOINT mantém contagem, IDs e metadados no mesmo snapshot de leitura. Parâmetros são vinculados; relações usam EXISTS e preservam a ordem de inserção sem duplicar faixas. A função determinística catalog_lower mantém a conversão Unicode do JavaScript, e instr mantém `%` e `_` literais. Não há FTS: substring ainda pode percorrer registros no banco; a hidratação da página continua usando consultas por item.

Validação: 24 testes backend + 11 frontend e build aprovados. O novo teste compara o contrato anterior com SQL para as três entidades, incluindo acentos, caracteres especiais, texto semelhante a SQL, ordem dos artistas, filtros combinados, totais e offsets além do fim.

REA `ev_5e37d3d07e32d0c788364210b5938cb3e3d869c5e4221222706f3ae09fef49a5`: cenário completo na fixture isolada com 121 faixas; página 2/tamanho 10 mostra Demo extra 008 e a busca por Demo extra 118 reinicia na primeira página com um resultado. Ambas as consultas retornaram 200; zero erros de página. O 401 de refresh é esperado para visitante sem cookie. Navegador e fixture encerrados ao final.

Etapa seguinte concluída abaixo: seguir/deixar de seguir artistas com persistência e isolamento por conta. OAuth, colaboração e arrastar/soltar continuam pendentes.


## Artistas seguidos — 18/10/2026

A página de artista permite seguir/deixar de seguir, mostra o total de seguidores e oferece nova tentativa em caso de erro. Visitantes recebem um link para entrar. A biblioteca mantém as playlists e adiciona uma seção paginada de artistas seguidos (10/20/50), com paginação independente em memória. A lista privada usa apenas a conta autenticada e é descartada na troca de sessão.

A tabela artist_follows tem unicidade por conta/artista e FKs para o catálogo e para records de usuários, com exclusões em cascata. PUT/DELETE são idempotentes; GET da lista usa snapshot e LIMIT/OFFSET no SQL. A contagem pública soma seguidores base importados aos vínculos locais sem alterar o valor base ao editar o nome do artista. Não há atualização em tempo real entre abas.

Validação: 26 testes backend e 11 frontend, todos aprovados, além do build. Dois testes de integração cobrem autenticação, isolamento, idempotência, totais públicos, paginação, persistência em outro processo, edição sem inflar contadores e limpeza após excluir artista/conta.

REA `ev_3ef9e0fc90b711d8f5ddedd49eb23dbb2d257c0e0de1a6abaf2e4e6613d0f382`: cenário completo na fixture isolada com build de produção: login demo → seguir Artist 1 → artista aparece na biblioteca → recarregar mantém vínculo → deixar de seguir → biblioteca vazia. GET/PUT/DELETE retornaram 200, sem erros de página. Navegador e fixture temporários encerrados ao final.

Etapa seguinte concluída abaixo: histórico privado de escuta com persistência por conta. OAuth, colaboração e arrastar/soltar continuam pendentes.


## Histórico privado de escuta — 18/10/2026

O player acumula intervalos reais de áudio tocando, sem contar pausas, stalls ou seeks, e envia um UUID v4 por tentativa após três segundos. Retomadas não duplicam o evento; nova seleção, avanço ou repeat criam outra tentativa. O evento fica ligado à conta/geração de sessão no início da tentativa: login ou troca de conta durante uma reprodução não transfere o registro. Falhas mostram nova tentativa, limitada à faixa/conta atuais; não há fila offline.

A rota privada `/history` é acessível pela biblioteca e menu. Mostra data, metadados atuais, paginação 10/20/50 na URL e botão de limpeza. Repetições aparecem separadas, mas a fila criada ao ouvir pelo histórico contém faixas únicas da página. A lista aberta só se atualiza quando carregada novamente; não há atualização em tempo real. O servidor recebe eventos declarados pelo cliente, sem comprovação de escuta. Não há retenção automática; uma reprodução em andamento pode gerar novo registro após limpar.

SQLite usa `listening_history`, unicidade conta/UUID, sequência decrescente, horário do servidor, FKs com cascata para conta/faixa, e snapshot para leitura paginada. PUT idempotente, validação e isolamento por conta foram testados, além de persistência em outro processo e limpeza após exclusão. Resultado: 28 testes backend + 13 frontend e build aprovados.

REA em fixture isolada de produção:

- `ev_e1763ad59da505f3b51efccdbe452d68b5bed47d995a67b0185c3e43f4558219` e `ev_5894db6fbb8db0d98a8fd6ccc84d7150ac45a5eeb03f97354872bb3f278d28aa`: gravação PUT 200 observada; cenários parciais por timeout ao aguardar pausa. Não comprovam retomada sem duplicação no navegador (essa regra tem teste unitário).
- `ev_e1ebb1480615621def56811783633283e3d93489fe60a00dadb2064837956b7b`: cenário curto completo confirma reprodução e pausa como visitante.
- `ev_62c8b608f6d9cd0695ef6dcf9c95e2a1830111eef4a20826f67f056ab5bacbda`: progresso real e PUT 200; parcial por timeout aguardando navegação pelo clique após reprodução.
- `ev_2f38accf5356f94186782363a6edd44eea393d071305a6fa74c85d2e1e413e5a`: cenário completo em novo navegador confirma link na biblioteca, registro único persistido, restauração após recarregar e limpeza DELETE 200. Zero erros de página.
- `ev_131a75e2577e31ad1e577112a6f99c4b3e28fc3f28f8979ce0a9c5ee6ca3e36f`: cenário completo confirma progresso acima de quatro segundos, PUT 200 e uma única faixa no histórico após navegar diretamente. Zero erros de página.

Navegadores temporários e fixture encerrados ao final. Etapa seguinte concluída abaixo: arrastar e soltar para reordenar faixas de playlists. OAuth e colaboração permanecem pendentes.


## Arrastar e soltar em playlists — 18/10/2026

O proprietário tem uma alça HTML draggable em cada faixa. Soltar sobre outra faixa move à posição original do destino; o contorno verde sinaliza o destino. O cálculo usa todos os IDs da playlist, preservando faixas fora da página. Arrastes externos, sobre a própria faixa ou de outra página/sessão não enviam ordem; cancelamento limpa o destaque. Só há atualização após resposta bem-sucedida, e uma trava síncrona evita mutações simultâneas. O gesto não muda a fila de reprodução existente.

Subir/Descer continuam acessíveis por teclado e atravessam páginas. O arraste opera somente dentro da página atual, sem navegação automática. Dispositivos sem arraste HTML usam os botões; toque não foi validado. A API existente mantém permissões e validação de permutação, sem mudanças no contrato.

Validação: 28 testes backend + 15 frontend e build aprovados. Dois testes de reordenação cobrem direção, entradas inválidas, preservação da origem e das faixas fora da página. `frontend/web/tests/browser/playlist-drag.mjs` passou no Chromium com uma fixture de produção e 121 faixas: movimentos reais do mouse para cima/baixo, recarga, mesmo destino, cancelamento com Escape, erro 500 sem alteração, botão por teclado entre páginas e ausência de controles para visitante. Zero erros de página. As primeiras tentativas do roteiro falharam por posicionamento do gesto junto ao player fixo; centralizar as linhas antes do mouse resolveu. O teste de falha também passou após usar o mesmo posicionamento.

REA `ev_09353c028ab05763f313596b061aa16583671de960cbd251fccc4acbe5d9bd01`: cenário completo confirmou alça e instruções, uso de Subir por teclado na posição 121, PUT 200, nova ordem e persistência após recarregar. Zero erros de página. O gesto nativo foi validado pelo roteiro Playwright separado, não pela REA, cujas ações anunciadas não incluem drag. Navegadores e fixtures temporários encerrados ao final.

Etapa seguinte concluída abaixo: busca por artistas e álbuns na interface. OAuth e colaboração permanecem pendentes.


## Busca por músicas, artistas e álbuns — 18/10/2026

A tela de busca tem links Músicas/Artistas/Álbuns e indica o tipo ativo. A URL guarda termo, tipo (`type=artists|albums`), tamanho e página. Sem tipo, ou com valor inválido, usa músicas; os caminhos antigos continuam válidos. Trocar tipo ou enviar um termo reinicia a primeira página, preservando tamanho. O campo do cabeçalho acompanha a URL e conserva o tipo ao pesquisar dentro da busca. Fora dela, uma busca nova começa por músicas.

Faixas continuam buscando por título/artista/álbum; artistas e álbuns usam seus nomes. Os cards exibem seguidores/gêneros ou número de faixas e abrem detalhes. A leitura usa os endpoints SQL existentes, sem mudar contratos. Componentes são remontados por tipo/termo e consultas anteriores são canceladas para evitar resultados antigos. Um erro de catálogo oferece nova tentativa. Não há sugestões automáticas, busca global simultânea nem filtros avançados nesta etapa.

Validação: 28 testes backend + 17 frontend e build aprovados. Dois testes unitários cobrem tipos permitidos, compatibilidade de URLs, termos codificados e reinício de página sem alterar os parâmetros originais. `frontend/web/tests/browser/search.mjs` passou no Chromium com API real/SQLite temporário e 25 artistas/álbuns: paginação e recarga, troca de tipo, novo termo, detalhes, acentos, barra e `%_?` literais, erro 500 seguido de nova tentativa e tipo inválido retornando à busca de músicas. Zero erros de página. O modo `SEARCH_FIXTURE=1` é exclusivo da fixture e não altera o catálogo real.

REA `ev_951bad6f2d13c33707371c0f52a67cd1d417c9aefb126cfd44db51b525283366`: cenário completo confirmou página 2 de artistas, troca para álbuns reiniciando na primeira página, busca de Digital Dreams mantendo álbuns, abertura do álbum e busca/abertura de Artist 1. Respostas de artistas/álbuns retornaram 200, sem erros de página. Navegador e fixture temporários encerrados ao final.

Etapa seguinte concluída abaixo: metadados de artistas com biografia, país e foto. OAuth e colaboração permanecem pendentes; a busca avançada do plano maior ainda está parcial.


## Metadados de artistas — 18/10/2026

A API administrativa aceita biography/country opcionais (5.000/100 caracteres), com trim, limpeza por string vazia e rejeição de null/tipos inválidos. Gêneros são aparados/deduplicados, limitados a 20 entradas de 80 caracteres. Fotos aceitam até dez objetos URL/dimensões, HTTP(S) sem credenciais ou arquivos diretos em `/api/v1/images`, com limites documentados no backend. Escritas inválidas não alteram nenhum outro campo. Biografia/país usam metadata JSON já existente; não há reconstrução da base nem alteração dos snapshots legados.

Os detalhes mostram retrato, biografia como texto literal com quebras de linha, país, gêneros e seguidores. Busca e artistas seguidos também mostram foto. Ausência/falha da foto usa símbolo com nome acessível; dados não informados têm texto explícito. URLs locais respeitam a origem da API configurada. O SVG local de demonstração é um avatar genérico criado no projeto, sem pessoa real. Não há upload ou editor administrativo na interface; a edição continua via API. País é texto livre, sem catálogo ISO. Os registros reais existentes não foram enriquecidos com dados inventados.

Validação: 29 testes backend + 17 frontend e build aprovados. Novo teste de integração cobre limites/tipos, rollback, normalização, fotos locais/remotas, persistência em outro processo, leitura pública e escrita negada a visitante/usuário comum. O roteiro `frontend/web/tests/browser/artist-details.mjs` passou no Chromium com fixture ARTIST_FIXTURE=1: retrato decodificado, texto HTML literal, recarga, foto na busca, fotos ausentes/quebradas e viewport de 390px sem transbordamento. Zero erros de página; o 404 da foto quebrada é deliberado.

REA `ev_d833555cbef220f0daccfdad89265338cbdb579eea7f9b3f11ad05613c1b4d79`: cenário completo confirma foto na busca, abertura do artista, biografia/país/gêneros, restauração após recarregar e alternativa após foto 404. Foto local retornou 200/304; nenhum erro de página. Navegador e fixture temporários encerrados ao final.

Etapa seguinte concluída abaixo: metadados de álbuns. OAuth e colaboração permanecem pendentes.


## Metadados de álbuns — 18/10/2026

A API administrativa aceita year opcional (inteiro 1–9999, null remove), genres e images com a validação já usada para artistas. Campos adicionais ficam no metadata JSON, preservando o catálogo legado sem inventar anos ou gêneros. Duration e totalTracks são derivados de SUM/COUNT no SQLite, abrangendo todas as faixas do álbum e excluídos do metadata persistido em novas gravações. Não aceitam escrita; duração muda após editar/mover/excluir faixas. Álbum vazio retorna 0:00.

Busca e detalhes mostram capa, ano e duração; detalhes incluem gêneros. CatalogImage compartilha resolução de URL, imagem acessível e alternativa de falha entre fotos de artistas e capas, mantendo ArtistImage como adaptador. O SVG de capa de demonstração é um desenho geométrico local. A interface não tem editor administrativo/upload; gênero de álbum ainda não é filtro de busca.

Validação: 30 testes backend + 17 frontend e build aprovados. Novo teste cobre limites, rollback, normalização, persistência em novo processo, duração zero, soma, edição, transferência e exclusão de faixas. Roteiros Chromium album-details e artist-details aprovados: capa na busca/detalhes, ano/gêneros/duração, recarga, viewport de 390px e alternativa para capa quebrada, além da regressão de retratos de artistas. Zero erros de página; o 404 da imagem quebrada é deliberado.

REA `ev_646ed2ad5ad5d565bfed5b1ad88a1dfdba0671b0dccfb3e9730cf833da046fa7`: cenário completo confirmou capa na busca, abertura de Digital Dreams, ano 2024, gêneros, duração 0:10, restauração após recarregar e alternativa na capa quebrada de Summer Vibes. Zero erros de página. Navegador e fixture temporários encerrados ao final.

Etapa seguinte concluída abaixo: metadados técnicos das faixas de demonstração. OAuth e colaboração permanecem pendentes.


## Metadados técnicos dos WAVs locais — 18/10/2026

`technical` é derivado dos cabeçalhos dos três arquivos demo, não de valores fixos no catálogo. O parser valida RIFF/WAVE PCM, limites de chunks/padding, formato, taxas e alinhamento. Retorna container, codec, sampleRate, channels, bitsPerSample, bitrate, durationMs e fileSizeBytes. A leitura é limitada a nomes conhecidos, arquivos regulares de até 16 MiB, sem resolver URLs em caminhos nem acessar rede. É um snapshot por processo: mudanças nos arquivos exigem reiniciar a API. Ausências, formatos não suportados e URLs externas resultam em null. Não há decoder genérico, transcodificação ou seleção de qualidade.

A seção Informações do áudio nos detalhes mostra formato, bitrate, Hz, canais, profundidade e duração medida; distingue a duração cadastrada. Dados derivados não são graváveis ou persistidos no metadata JSON. Registros legados e snapshots permanecem preservados. O checklist maior de qualidade continua parcial por cobrir apenas as demonstrações PCM locais.

Validação: 33 testes backend + 17 frontend e build aprovados. Dois testes do parser cobrem os arquivos reais, URLs fora da lista, cópias dos resultados, chunks ímpares, truncamento, limites, formato e taxas inválidos. Integração valida campo somente de leitura, duração medida diferente da cadastrada e troca de URL para remoto/ausente. `track-technical.mjs` passou no Chromium: valores, recarga, reprodução/pausa, viewport móvel e indisponibilidade em remoto/ausente; zero erros de página.

REA `ev_020072d06a16586ec43105e3c45ef0827ce0c98c37c022c260afaa974ef2a30e`: cenário completo confirmou WAV/PCM, 256 kbps, 16.000 Hz, mono, reprodução real, restauração após recarregar e estado sem dados de URL externa. Zero erros de página. Navegador e fixture temporários encerrados ao final.

Etapa seguinte concluída abaixo: visualizador de forma de onda para demos locais. OAuth e colaboração permanecem pendentes.


## Forma de onda com navegação — 18/10/2026

O player consulta `/tracks/:id/waveform` apenas ao selecionar a faixa. Endpoint público retorna 96 picos PCM e duração medida, null quando não disponível e 404 para faixa inexistente. Picos são máximos absolutos por intervalo considerando todos os canais, normalizados entre zero e um; calculados uma vez por processo para os mesmos três arquivos permitidos. Não ampliam respostas de listagem, não ficam no SQLite e não analisam URLs externas.

SVG mostra a amplitude e colore a parte já tocada. Um range acessível sobre a forma de onda oferece clique e Home/End/setas com contorno de foco. A função de busca compartilhada com a barra usa duração real e interrompe o intervalo do contador de escuta antes do salto. A pausa é preservada ao buscar. Erro/ausência da prévia mantém controles de reprodução e barra disponíveis; troca de faixa cancela a consulta anterior. O espaço abaixo do conteúdo foi ajustado para a altura adicional do player.

Validação: 35 testes backend + 17 frontend e build aprovados. Novos testes cobrem picos reais, silêncio, canal estéreo, PCM 8/16/24/32 bits, limites, cópia dos resultados, endpoint público/null/404 e ausência dos picos na resposta padrão. `waveform.mjs` passou no Chromium: 96 barras, clique com áudio pausado, Home/End/setas, viewport móvel e falha 500 da prévia com áudio ainda tocando. Zero erros de página.

REA `ev_d5e095bb990fdd76caa0c34ed1c63b6cc8512188f79a238c3e5bec35a52948f9`: cenário completo confirmou reprodução, prévia com GET 200, End na posição 8s, Home em 0s e seta em 0,1s, sincronizados com a barra. Zero erros de página. Navegador e fixture temporários encerrados ao final.

Próxima etapa sugerida: filtro por gênero na busca de artistas, reaproveitando o filtro SQL existente. OAuth e colaboração permanecem pendentes.
