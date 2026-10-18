# Plano de Ação: Clone do Spotify - Streaming de Música

## Estado verificado em 18/10/2026

- Implementação atual: React/Vite + Zustand e Node.js/Express em um processo.
- Cadastro, login JWT e `/auth/me` implementados, com testes de integração.
- Catálogo, contas, playlists, favoritos e chave JWT de desenvolvimento são persistidos em SQLite (`backend/.data/spotify.sqlite`), com WAL e transações. Importação única dos JSONs preserva os originais. Backend requer Node.js 26+.
- Frontend conecta catálogo, busca por título, biblioteca, detalhes e criação de playlist à API. Build de produção aprovado.
- REA validou no Chromium: login demo, catálogo, criação de playlist e busca; nenhum erro de página registrado. Evidência e limites em `docs/estado-atual.md`.
- Player usa HTMLAudioElement com três áudios instrumentais locais gerados para demonstração (8, 10 e 12 segundos). REA confirmou reprodução com progresso, pausa/retomada, busca, volume, próxima/anterior, fim natural, encerramento da fila e recuperação de erro.
- Perfis e autenticação usam o mesmo armazenamento. Perfis e mutações de playlists são restritos ao proprietário; playlists privadas ficam ocultas de outras contas. Catálogo exige administrador para mutações.
- Interface permite editar/excluir playlists, mudar visibilidade e adicionar/remover faixas. 38 testes do backend e 20 testes do frontend (fila/paginação/escuta/reordenação/busca) aprovados, incluindo persistência em novo processo.
- REA confirmou edição de playlist e reabertura em nova sessão; evidências em `docs/estado-atual.md`.
- Reordenação por botões subir/descer implementada; a API valida que a lista contém exatamente as faixas atuais. Favoritos privados por conta disponíveis no catálogo, detalhes, player e página Músicas curtidas.
- Testes confirmam que ordem e curtidas persistem em novo processo. REA confirmou reordenação e o fluxo curtir → Músicas curtidas → descurtir em cenários separados.
- Shuffle/repeat e remoção/limpeza da fila implementados. Aleatório preserva a música atual; repetição de faixa vale para término automático, e repetição de fila permite circular nos extremos. REA confirmou os fluxos sem erros de página.
- Access token de 15 minutos em memória, refresh rotativo em cookie HttpOnly e sessões revogáveis implementados. REA confirmou renovação compartilhada de dois 401, restauração após recarregar e logout persistente.
- Catálogo normalizado em tabelas relacionais com FKs, migração transacional e snapshots preservados. CRUD valida metadados/relações; busca aceita nomes de artista e álbum. Exclusão de faixa limpa playlists/curtidas atomicamente; álbum/artista referenciado retorna 409.
- Componentes antigos fora do fluxo removidos, listas consolidadas e paginação adicionada à interface. Playlists têm leitura paginada das próprias faixas; busca para adicionar músicas não depende das primeiras 100 faixas.
- Filtros, contagem e paginação do catálogo executam no SQL, com busca Unicode literal e leitura consistente da página.
- Seguir/deixar de seguir artistas implementado por conta, com biblioteca paginada, persistência e contagem de seguidores. REA confirmou seguir, recarregar a biblioteca e deixar de seguir.
- Histórico privado de escuta implementado após três segundos efetivamente reproduzidos, com paginação, limpeza e persistência por conta. REA confirmou registro, restauração e limpeza.
- Arrastar e soltar na página atual da playlist implementado para o proprietário; botões Subir/Descer preservados para teclado e mudança entre páginas. Teste de navegador confirmou arraste, persistência, falha e permissões.
- Busca permite alternar músicas, artistas e álbuns, com tipo/termo/paginação na URL e links para detalhes. Chromium e REA confirmaram paginação e navegação.
- Artistas têm biografia, país, gêneros e retrato nos detalhes; fotos aparecem na busca e biblioteca. API valida limites e URLs, com escrita restrita a administradores e alternativa para imagens indisponíveis.
- Álbuns têm ano, gêneros e capa nos detalhes/busca, com duração e quantidade calculadas pelas faixas. API valida metadados; Chromium e REA confirmaram exibição, recarga e alternativa de capa quebrada.
- Faixas de demonstração exibem codec, bitrate, canais, taxa de amostragem, profundidade e duração medidos dos WAVs locais; campos somente de leitura, sem consultas a URLs externas. Chromium e REA confirmaram detalhes e reprodução.
- Forma de onda de 96 picos PCM disponível no player para demos locais, com progresso e navegação por mouse/teclado. Falhas mantêm a barra de progresso; Chromium e REA confirmaram navegação.
- Busca de artistas tem filtro de gênero do catálogo completo, combinado com termo e paginação na URL. Limpeza, troca de tipo e recuperação de erros validadas no Chromium e pela REA.
- Busca de álbuns permite filtrar por artista com seleção pesquisável/paginada, termo e artistId na URL. Colaborações, recarga, limpeza e recuperação de falhas validadas.
- Busca de álbuns combina ano exato, artista, termo e paginação na URL; validação, recarga, limpeza e recuperação de links inválidos confirmadas por testes/Chromium/REA.
- OAuth e colaboração continuam pendentes.
- Página Meu perfil implementada: edição de nome/foto, atualização no cabeçalho e nos donos das playlists, persistência após recarregar. REA confirmou o fluxo.
- Migração, rollback, savepoints e concorrência entre processos validados em testes isolados. Dados locais migrados com igualdade das sete coleções antes da edição do perfil.
- Os checklists abaixo representam o escopo completo: um esboço ou implementação parcial não conclui um item.
- `action-plan.md` é uma proposta histórica (Spring Boot), não a arquitetura implementada.
- A consulta inicial da REA não tinha alvo aberto nem evidências anteriores; o cenário local posterior está registrado em `docs/estado-atual.md`. Não há comprovação da arquitetura interna do Spotify descrita abaixo.

## 1. Análise do Spotify Original

### Tecnologias Identificadas
- **Backend**: Java, Python (APIs de recomendação usando TensorFlow), Node.js
- **Frontend**: React (Web Player), Flutter (Mobile), Swift (iOS), Kotlin (Android)
- **Bancos de Dados**: Cassandra (dados de usuários), DynamoDB (cache), Neo4j (gráficos de recomendação)
- **Infraestrutura**: AWS (EC2, S3, CloudFront, Lambda, Kinesis, Step Functions)
- **Streaming**: WebSockets (WebSockets protocol), HLS/DASH streaming

### Arquitetura do Spotify
- API RESTful (API Web)
- API GraphQL (mobile)
- Microserviços para funcionalidades específicas
- CDN global para distribuição de conteúdo

### APIs Principais
- REST API: Autenticação, playlists, busca, detalhes
- Web API: Player, controle de reprodução
- WebSockets: Sessões compartilhadas, notificações em tempo real
- API do Desenvolvedor: Integrações externas

## 2. Pilha Tecnológica Recomendada

### Frontend
- **Web**: React.js + TypeScript + Redux Toolkit
- **Mobile**: React Native ou Flutter
- **Estilização**: TailwindCSS ou Styled Components
- **Player em tempo real**: PeerJS ou WebRTC

### Backend
- **Microserviços**: Node.js + Express ou NestJS
- **Stream Processing**: FFmpeg para transcodificação
- **Real-time**: Socket.io ou Socket.io-redis
- **Recomendações**: Python + FastAPI + scikit-learn/tensorflow
- **API Gateway**: Kong ou AWS API Gateway

### Banco de Dados
- **Principais**: PostgreSQL (dados relacionais), Redis (cache)
- **Big Data**: MongoDB ou Elasticsearch (catálogo, buscas)
- **Armazenamento**: AWS S3 ou MinIO (archived audio files)
- **Cache**: Redis cluster

### Infraestrutura
- **Containerização**: Docker + Kubernetes
- **Streaming**: Nginx + FAUST ou HLS streaming
- **DevOps**: GitHub Actions, Terraform

## 3. Diagrama de Arquitetura

```mermaid
graph TD
    Client[Clientes (Web/Mobile)] -->|HTTP/WS| APIGateway[API Gateway]

    subgraph["Backend - Microserviços"]
        Auth[Auth Service]
        User[User Service]
        Track[Track Service]
        Artist[Artist Service]
        Album[Album Service]
        Playlist[Playlist Service]
        Session[Session Service]
        Recommendation[Recommendation Service]
        Search[Search Service]
        Storage[Storage Service]
        Streaming[Streaming Service]
    end

    APIGateway --> Auth
    APIGateway --> User
    APIGateway --> Track
    APIGateway --> Artist
    APIGateway --> Album
    APIGateway --> Playlist
    APIGateway --> Recommendation
    APIGateway --> Search

    User -.|Redis Cache| Redis[(Redis Cluster)]
    User -.|MongoDB| MongoDB[(MongoDB)]
    Recommendation -.|Python ML| Recommendation

    Session -.|WebSockets| SocketServer[Socket Server]
    Streaming -.|Media Server| MediaCluster[Media Cluster]
    Storage -.|S3 Bucket| S3[(AWS S3)]

    MediaCluster -.|CDN| CDN[Content Delivery Network]
    SocketServer -.|Redis Pub/Sub| Redis
    Recommendation -.|Python ML| Recommendation
```

## 4. Estrutura de Diretórios

```
spotify-clone/
├── frontend/
│   ├── web/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── player/
│   │   │   │   ├── sidebar/
│   │   │   │   ├── topbar/
│   │   │   │   ├── libraries/
│   │   │   │   └── search/
│   │   │   ├── hooks/
│   │   │   ├── stores/
│   │   │   ├── utils/
│   │   │   └── types/
│   │   └── public/
│   ├── mobile/
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── services/
│   └── shared/
│
├── backend/
│   ├── services/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── tracks/
│   │   ├── artists/
│   │   ├── albums/
│   │   ├── playlists/
│   │   ├── sessions/
│   │   ├── recommendations/
│   │   ├── search/
│   │   └── storage/
│   ├── api-gateway/
│   ├── streaming/
│   │   ├── processors/
│   │   └── transcoders/
│   └── middleware/
│
├── infrastructure/
│   ├── docker/
│   ├── kubernetes/
│   └── terraform/
│
├── ml/
│   ├── data/
│   ├── models/
│   ├── training/
│   └── inference/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/
│   ├── api/
│   ├── architecture/
│   └── guides/
│
└── scripts/
```

## 5. Principais Funcionalidades a Implementar

### Prioridade 1 - Autenticação de Usuários (Semana 1-2)
- [ ] Sistema de registro/login (email, social auth)
- [x] JWT tokens + Refresh tokens
- [ ] Autenticação via OAuth (Google, Apple, Facebook)
- [x] Middleware de autenticação
- [ ] Roteiro de roteamento baseado em auth

### Prioridade 2 - CRUD de Entidades (Semana 3-6)
- **Usuários**
  - [ ] CRUD completo
  - [ ] Perfil de usuário
  - [ ] Dados de autenticação

- **Artistas**
  - [x] CRUD de artistas
  - [x] Metadados (foto, biografia, país, categorias)
  - [x] Relação com faixas e álbuns

- **Álbuns**
  - [x] CRUD de álbuns
  - [x] Relação com faixas
  - [x] Metadados (capa, ano, duração, gêneros)

- **Faixas**
  - [x] CRUD de faixas
  - [ ] Metadados (título, duração, artista, álbum)
  - [x] URLs de streaming
  - [ ] Dados de qualidade (bitrate, codec)

### Prioridade 3 - Player de Música (Semana 7-10)
- [x] Controles básicos (play, pause, next, prev)
- [x] Controles avançados (skip, repeat, shuffle)
- [x] Volume control
- [x] Visualizador de waveforms
- [x] Progresso da faixa
- [x] Drag & drop para faixas
- [ ] Sincronização entre dispositivos

### Prioridade 4 - Playlists (Semana 11-14)
- [x] CRUD de playlists
- [x] Adicionar/remover faixas de playlist
- [x] Organizar faixas em playlists
- [ ] Playlist colaborativas
- [x] Favoritos e "likes"
- [x] Histórico de escuta
- [x] "Liked Songs" playlist

### Prioridade 5 - Recomendações (Semana 15-20)
- [ ] Sistema de tags e gêneros
- [ ] Colaborative filtering
- [ ] Content-based filtering
- [ ] Playlist do dia (Daily Mix)
- [ ] "Discover Weekly" (simulado)
- [ ] "Release Radar"
- [ ] "On Repeat" (faixas repetidas)

### Prioridade 6 - Sessões Compartilhadas (Semana 21-26)
- [ ] Iniciar sessão compartilhada
- [ ] Controle remoto (play/pause/volume)
- [ ] Visualizador de participantes
- [ ] Sala virtual
- [ ] Carência (delay) para evitar cliques
- [ ] Chat da sessão (opcional)

### Prioridade 7 - Funcionalidades Avançadas (Semanas 27-32)
- [ ] Busca avançada
- [ ] Biblioteca pessoal
- [ ] Download offline (com DRM simplificado)
- [ ] Qualidade variável
- [ ] Modos de audição (focus, sleep)
- [ ] Widget do player

## 6. Tecnologias Específicas por Funcionalidade

### Autenticação
- **JWT** (jsonwebtoken)
- **Passport.js** (OAuth providers)
- **bcrypt** (password hashing)
- **Auth0** ou **Firebase Auth** (como alternativa OAuth)

### CRUD (Backend)
- **ORM**: Prisma ou TypeORM
- **Database**: PostgreSQL (primary), MongoDB (catalog)
- **Cache**: Redis
- **Validação**: Joi ou Zod

### Player de Música
- **Streaming**: Node.js + HLS.js ou SoundCloud API patterns
- **FFmpeg** (transcodificação no backend)
- **Web Audio API** (para visualizadores)
- **PeerJS** (WebRTC simplificado para sessions)
- **Socket.io** (sincronização em tempo real)

### Playlists
- **Backend**: PostgreSQL (relational data)
- **Frontend**: React components
- **Drag & Drop**: react-beautiful-dnd ou dnd-kit
- **State management**: Redux Toolkit

### Recomendações
- **ML Framework**: Python + scikit-learn + tensorflow
- **API**: FastAPI ou Flask
- **Data Processing**: Pandas, NumPy
- **Model Serving**: TorchServe ou TensorFlow Serving

### Sessões Compartilhadas
- **Protocolo**: WebRTC (real) ou PeerJS (fallback)
- **Estado**: Redis pub/sub para sincronização
- **Backend**: Node.js (Socket.io)

### Infraestrutura
- **Docker**: Containerização de serviços
- **Kubernetes**: Orquestração (local: minikube/dev)
- **Object Storage**: MinIO (dev) ou S3 (prod)
- **CDN**: CloudFront ou Vercel
- **CI/CD**: GitHub Actions

## 7. Considerações sobre Direitos Autorais e Limitações

### Direitos Autorais
- **API de Streaming**: Usar APIs oficiais (Spotify for Developers, SoundCloud, Deezer)
- **API Limits**: Respeitar quotas e limits de requisições
- **DRM**: Necessário para streaming legal (ExoPlayer, FairPlay)
- **Termos de Serviço**: Verificar termos da API utilizada

### Limitações Técnicas
- **Armazenamento**: Música em alta qualidade consome ~5-10GB por hora
- **Banda Larga**: Streaming consome 40-100Mbps
- **Latência**: WebRTC tem limitações de latência (~300ms)
- **Browser Compatibility**: Suporte a codecs varia entre browsers

### Abordagens Viáveis para Clone

#### Abordagem 1: API Wrapper (Mais Viável)
- Usar API oficial do Spotify
- Recriar UI/UX
- **Limitação**: Requer credencial Premium
- **Legal**: Termos de uso Spotify

#### Abordagem 2: Integração Múltipla
- Integrar com múltiplas APIs (Spotify, SoundCloud, YouTube)
- Unificar em única interface
- **Legal**: Verificar termos de cada API
- **Viabilidade**: Mais fácil de iniciar

#### Abordagem 3: Música Livre de Direitos (Melhor para Aprender)
- Usar APIs de música royalty-free (Free Music Archive, Jamendo)
- APIs de podcasts (RSS feeds)
- Música gerada por IA
- **Legal**: Permissões claras
- **Viabilidade**: Menos problemas legais

### Abordagens Recomendadas

### Para Projeto Acadêmico
```
- API de exemplo (Free Music Archive API)
- Simulação de streaming (sem arquivo real, apenas URLs)
- Foco em arquitetura e UX
```

### Para Projeto Comercial (Protótipo)
```
- Usar SoundCloud API (permite streaming de faixas curtas)
- Integração com Google Music (via API pública limitada)
- API de Deezer (ver termos comerciais)
```

### Para Aplicação Completa (Legal)
```
- Usar serviços de música royalty-free
- Permite distribuição comercial
- Documentar permissões no site
- Oferecer opção de assinatura para conteúdo premium
```

### Alternativas Legais para Testar
- **Free Music Archive** (http://freemusicarchive.org/)
- **Jamendo API** (https://www.jamendo.com/api/)
- **Bandcamp API** (https://bandcamp.com/dev)
- **Internet Archive** (archive.org/api)
- **Pixabay Music** (API gratuita)

## Timeline Sugerida

### Fase 1: MVP Básico (Semanas 1-8)
- Auth + Users
- CRUD: Artists, Albums, Tracks
- Player básico (play, pause, next, prev)

### Fase 2: Funcionalidades Principais (Semanas 9-16)
- Playlists
- Search
- API Gateway

### Fase 3: Recursos Avançados (Semanas 17-24)
- Recommendations (simulado)
- Sessions compartilhadas (opcional)

### Fase 4: Polimento (Semanas 25-32)
- UI/UX improvements
- Performance optimizations
- Bug fixes
- Testing

## Dicas de Implementação

1. **Comece simples**: Implementar apenas o essencial primeiro
2. **Mock primeiro**: Criar mockups para validação
3. **Data mocking**: Gerar dados falsos para testar
4. **API-first**: Definir schema de API antes de implementar
5. **Mobile-first**: Pensar em experiência mobile desde o início
6. **Testes**: Escrever testes desde o início
7. **Logging**: Implementar logging desde cedo
8. **Security**: Não esquecer de segurança na autenticação

## Recursos Adicionais para Estudar

- **Spotify Web API Docs**: https://developer.spotify.com/documentation/web-api
- **Music21**: Python music library
- **LibRAAC**: Biblioteca de áudio para streaming
- **AudioContext**: Web Audio API docs

---

*Plano atualizado para 2026 - Considere atualizar tecnologias conforme releases*
