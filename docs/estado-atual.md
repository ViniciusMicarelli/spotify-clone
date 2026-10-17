# Estado verificado — 17/10/2026

## Resultado desta etapa

- API inicia em um processo Express, sem Redis/PostgreSQL.
- Frontend gera build de produção com Vite.
- 18 testes do backend (14 de API/sessões e quatro de armazenamento) e oito testes da fila passam: catálogo/busca, cadastro/login/JWT, criação autenticada de playlist, perfis/permissões/duração , reordenação, favoritos por conta e persistência em processo separado.
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

Próxima etapa sugerida: normalização do catálogo e revisão dos componentes antigos. OAuth, refresh tokens e revisão dos componentes antigos continuam pendentes. Rotas antigas de follow/liked não foram portadas para o novo router.
