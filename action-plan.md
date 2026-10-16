# Spotify Clone - Plano de Ação

## Meta
Clonar e replicar funcionalidades do Spotify usando a REA (Reverse Engineer Anything) skill, implementando o projeto em `personal/spotify-clone`.

## Fase 1: Análise e Planejamento (PENDING)

### 1.1 Exploração do Ecossistema Spotify
- [ ] Analisar UI/UX do app desktop e web
- [ ] Entender arquitetura frontend (React, Redux, como funciona)
- [ ] Estudar backend e APIs (Spring Boot, Node.js, etc.)
- [ ] Investigar banco de dados (PostgreSQL, Elasticsearch)
- [ ] Entender estrutura de microsserviços
- [ ] Analizar mobile apps (React Native, etc.)

### 1.2 Definição de Escopo MVP
- [ ] Priorizar funcionalidades essenciais:
  - Autenticação de usuários
  - Player de música
  - Browse/Discover
  - Minhas playlists
  - Upload de músicas (backend)
- [ ] Decidir arquitetura tech stack final
- [ ] Criar lista de backlog

### 1.3 Setup do Projeto
- [ ] Criar repositório git
- [ ] Configurar `.gitignore` completo
- [ ] Configurar diretórios do projeto
- [ ] Criar README.md com instruções
- [ ] Definir ambiente de desenvolvimento (node, python, etc.)

### 1.4 Configuração do Ambiente
- [ ] Backend: Spring Boot + dependencies
- [ ] Frontend: React + Vite/Turborepo
- [ ] Banco de dados: PostgreSQL + migrations
- [ ] Configurar variáveis de ambiente
- [ ] Configurar Docker (opcional)

## Fase 2: Desenvolvimento Backend (PENDING)

### 2.1 Spring Boot Server
- [ ] Setup inicial do Spring Boot
- [ ] Configurar Spring Security (JWT auth)
- [ ] Criar JWT service/handler
- [ ] Criar login/registro endpoints
- [ ] Configurar Spring Session management

### 2.2 APIs RESTful
- [ ] Users endpoints (CRUD)
- [ ] Authentication endpoints
- [ ] Artist endpoints (get, search)
- [ ] Album endpoints
- [ ] Track endpoints
- [ ] Playlist endpoints
- [ ] Track in artist endpoints
- [ ] Track in album endpoints

### 2.3 Spring Boot WebServer
- [ ] Configurar Spring Boot WebServer (embudo)
- [ ] Servir API em porta específica
- [ ] Servir SPA em rota diferente
- [ ] Configurar CORS
- [ ] Implementar health checks

### 2.4 Banco de Dados
- [ ] Configurar PostgreSQL
- [ ] Criar migrations (Flyway/Liquibase)
- [ ] Models:
  - Artist
  - Track
  - Album
  - TrackInAlbum
  - TrackInArtist
  - Playlist
  - TrackInPlaylist
  - User
- [ ] Relations e constraints
- [ ] Índices de performance

### 2.5 Spring AI Integration (opcional)
- [ ] Configurar OpenAI client
- [ ] Implementar service de AI (se necessário)
- [ ] Endpoint para AI calls
- [ ] Configurar API key no environment

### 2.6 Upload de Músicas
- [ ] Endpoint de upload (POST /api/v1/tracks/upload)
- [ ] Configurar storage (local/S3)
- [ ] Validar formatos e tamanho
- [ ] Lidar com múltiplos arquivos
- [ ] Return path da música

### 2.7 Autenticação OAuth
- [ ] Configurar OpenID Connect
- [ ] Implementar OIDC flow
- [ ] Criar endpoints de OAuth

### 2.8 Email Service
- [ ] Criar email service (SMTP)
- [ ] Endpoint de email (POST /api/v1/email)
- [ ] Configurar templates

### 2.9 API de IA (opcional)
- [ ] Criar API de IA (Spring Boot ou outro)
- [ ] Configurar OpenAI integration
- [ ] Endpoint para IA (POST /api/v1/ia)

### 2.10 Configurações e Settings
- [ ] Endpoint para configurações do usuário
- [ ] CRUD de configurações

### 2.11 Dockerização
- [ ] Criar Dockerfile do backend
- [ ] Configurar docker-compose.yml
- [ ] Configurar volumes para dados
- [ ] Configurar portas

### 2.12 Testing Backend
- [ ] Configurar testes (JUnit, RestAssured)
- [ ] Criar testes de integração API
- [ ] Criar testes de unidade
- [ ] Testar endpoints de auth
- [ ] Testar endpoints de playlists/artists/tracks
- [ ] Testar upload de música
- [ ] Testar endpoints do AI (se implementado)

## Fase 3: Desenvolvimento Frontend (PENDING)

### 3.1 React Project Setup
- [ ] Criar app React com Vite
- [ ] Configurar estrutura de diretórios
- [ ] Setup package.json com dependencies:
  - react, react-dom, react-router-dom
  - react-icons (FaIcon)
  - react-scripts ou Vite
  - zustand (state management)
  - React Hook Form
  - yup (validação)
  - Tailwind CSS ou Styled Components

### 3.2 Layout Components
- [ ] Criar Layout.jsx (App shell)
- [ ] Header com navegação
- [ ] Sidebar com menus
- [ ] Main content area

### 3.3 Home / Dashboard Component
- [ ] Criar Home.jsx
- [ ] Implementar cards de "Ouvir agora"
- [ ] Criar cards de artistas sugeridos
- [ ] Criar cards de playlists
- [ ] Implementar player preview

### 3.4 Player Component
- [ ] Criar Player.jsx
- [ ] Implementar player com controles:
  - Play/Pause
  - Previous/Next
  - Volume control
  - Progress bar
- [ ] Implementar visualização da capa
- [ ] Implementar informações da música atual
- [ ] Integrar com backend API

### 3.5 Browse / Discover Component
- [ ] Criar Browse.jsx
- [ ] Implementar grid de playlists/artistas
- [ ] Criar "Discover weekly" section
- [ ] Implementar search bar com busca
- [ ] Criar cards de "Reposts"

### 3.6 Library Component
- [ ] Criar Library.jsx
- [ ] Criar minhas playlists
- [ ] Criar minhas músicas/artistas
- [ ] Implementar criar playlist
- [ ] Implementar deletar playlist
- [ ] CRUD de playlists

### 3.7 Player Page Component
- [ ] Criar PlayerPage.jsx
- [ ] Implementar player full-page
- [ ] Criar player controls
- [ ] Implementar lista de reprodução
- [ ] Criar visualização completa

### 3.8 Playlist Page Component
- [ ] Criar PlaylistPage.jsx
- [ ] Renderizar lista de tracks
- [ ] Implementar controls
- [ ] Criar funcionalidade de remover track
- [ ] Implementar drag and drop (opcional)

### 3.9 Artist Page Component
- [ ] Criar ArtistPage.jsx
- [ ] Renderizar discografia do artista
- [ ] Criar top tracks section
- [ ] Implementar busca por artista

### 3.10 State Management (Zustand)
- [ ] Criar store de playback
- [ ] Criar store de users/auth
- [ ] Criar store de playlists
- [ ] Criar store de tracks/artists
- [ ] Configurar actions e reducers

### 3.11 Authentication (Login/Register)
- [ ] Criar Login.jsx
- [ ] Criar Register.jsx
- [ ] Implementar formulário com validação
- [ ] Integração com backend auth
- [ ] Handle JWT token
- [ ] Implementar logout

### 3.12 Upload Component
- [ ] Criar Upload.jsx
- [ ] Implementar drag and drop
- [ ] Handle multiple files
- [ ] Integração com backend upload API
- [ ] Show progress/status

### 3.13 OAuth Component (opcional)
- [ ] Criar OAuth popup/flow
- [ ] Integração com backend OAuth
- [ ] Handle authorization code

### 3.14 Email Component (opcional)
- [ ] Criar email form
- [ ] Integração com backend email API

### 3.15 AI Component (opcional)
- [ ] Criar AI interface
- [ ] Integração com backend AI API
- [ ] Handle responses

### 3.16 Settings Component
- [ ] Criar Settings.jsx
- [ ] Implementar CRUD de settings
- [ ] Form com React Hook Form

### 3.17 Routing
- [ ] Configurar routes do React Router
- [ ] Criar lazy loading para routes
- [ ] Implementar protected routes
- [ ] Criar redirect para login se não autenticado

### 3.18 Testing Frontend
- [ ] Configurar testes React (Jest + React Testing Library)
- [ ] Criar testes de componentes
- [ ] Criar testes de integration
- [ ] Testar login/registro flow
- [ ] Testar player functionality
- [ ] Testar playlist CRUD
- [ ] Testar upload flow

### 3.19 Dockerização Frontend
- [ ] Criar Dockerfile do frontend
- [ ] Configurar docker-compose.yml com frontend
- [ ] Configurar porta do frontend
- [ ] Testar build do frontend

## Fase 4: Mobile App (PENDING)

### 4.1 Mobile Strategy
- [ ] Decidir: React Native ou expo
- [ ] Decidir: Reutilizar componentes do web ou refazer
- [ ] Criar repositório mobile (ou monorepo)

### 4.2 Mobile Project Setup
- [ ] Criar app React Native/Expo
- [ ] Configurar estrutura similar ao web
- [ ] Setup de dependências móveis
- [ ] Configurar native modules se necessário

### 4.3 Mobile Components
- [ ] Criar componentes do UI mobile
- [ ] Adaptar componentes web (onde reutilizável)
- [ ] Criar componentes nativos (iOS/Android específicos)
- [ ] Implementar player mobile
- [ ] Implementar playlist view mobile
- [ ] Implementar home mobile

### 4.4 Authentication Mobile
- [ ] Implementar login mobile
- [ ] Implementar registro mobile
- [ ] Integração com backend auth
- [ ] Handle mobile auth flow

### 4.5 Navigation (React Navigation)
- [ ] Configurar React Navigation
- [ ] Criar stack navigator
- [ ] Criar tab navigator
- [ ] Criar bottom tab bar
- [ ] Implementar navigation props

### 4.6 Testing Mobile
- [ ] Testar em emulador (iOS/Android)
- [ ] Testar autenticação mobile
- [ ] Testar player em mobile
- [ ] Testar playlists em mobile

### 4.7 Build & Release (opcional)
- [ ] Configurar easter-egg de build para app
- [ ] Criar processo de build
- [ ] Criar scripts para build de app

## Fase 5: Deploy e Produção (PENDING)

### 5.1 Backend Deployment
- [ ] Configurar servidor backend (AWS, Heroku, etc.)
- [ ] Deploy do Spring Boot app
- [ ] Configurar banco de dados no cloud
- [ ] Configurar domínio e SSL
- [ ] Configurar environment variables
- [ ] Configurar CORS para produção
- [ ] Configurar rate limiting
- [ ] Configurar logging

### 5.2 Frontend Deployment
- [ ] Configurar servidor frontend (Vercel, Netlify, etc.)
- [ ] Deploy do React app
- [ ] Configurar build process
- [ ] Configurar domínio
- [ ] Configurar ambiente de produção

### 5.3 Mobile Deployment
- [ ] Preparar build do mobile app
- [ ] Configurar Apple App Store (se app iOS)
- [ ] Configurar Google Play Store (se app Android)
- [ ] Configurar versão mobile web (PWA)

### 5.4 Testing em Produção
- [ ] Testar todo o flow em produção
- [ ] Testar autenticação
- [ ] Testar player
- [ ] Testar upload
- [ ] Testar playlists
- [ ] Testar integração backend-frontend
- [ ] Testar load/performance

### 5.5 Monitoring
- [ ] Configurar monitoring ( Sentry, etc.)
- [ ] Configurar logging aggregação
- [ ] Configurar alertas
- [ ] Configurar uptime checks

### 5.6 Documentation
- [ ] Atualizar README com deploy instructions
- [ ] Criar API documentation (OpenAPI/Swagger)
- [ ] Criar user documentation
- [ ] Criar deployment guide

### 5.7 CI/CD Setup
- [ ] Configurar GitHub Actions ou similar
- [ ] Criar pipeline de CI (testes, linting)
- [ ] Criar pipeline de CD (deploy)
- [ ] Configurar secrets
- [ ] Automatizar testes no PR
- [ ] Automatizar deploy no merge

## Fase 6: Manutenção e Melhorias (PENDING)

### 6.1 Refatoração
- [ ] Refatorar código se necessário
- [ ] Otimizar queries do banco
- [ ] Otimizar bundle do frontend
- [ ] Otimizar performance do player

### 6.2 Features Futuras
- [ ] Social features (compartilhar, amigos)
- [ ] Radio/LoFi player
- [ ] Collaborative playlists
- [ ] Live streaming
- [ ] Podcasts
- [ ] Recommendations improvements

### 6.3 Monitoring Melhorias
- [ ] Métricas de performance
- [ ] Tracking de eventos de usuário
- [ ] Analytics dashboard

### 6.4 Security
- [ ] Auditoria de segurança
- [ ] Patch management
- [ ] Monitorar vulnerabilidades

## Stack Tecnológica Recomendada

### Backend
- **Framework**: Spring Boot (Java)
- **Spring AI**: Para integração com OpenAI (opcional)
- **Security**: Spring Security com JWT
- **Database**: PostgreSQL
- **ORM**: JPA/Hibernate
- **Migrations**: Flyway ou Liquibase
- **API**: Spring REST
- **Web Server**: Spring Boot WebServer (embudo)

### Frontend
- **Framework**: React
- **Build Tool**: Vite ou Turborepo
- **State Management**: Zustand
- **Routing**: React Router
- **Forms**: React Hook Form
- **Validation**: Yup
- **Icons**: react-icons (FaIcon)
- **Styling**: Tailwind CSS ou Styled Components
- **UI Components**: Shadcn/ui (se possível)

### Mobile
- **Framework**: React Native ou Expo
- **Navigation**: React Navigation (Stack, Tab, Bottom Tabs)
- **Reutilização**: Componentes do web (adaptados)

### DevOps
- **Container**: Docker + Docker Compose (dev)
- **CI/CD**: GitHub Actions
- **Database**: PostgreSQL (ou supabase para simplificação)
- **Cache**: Redis (opcional)

## Entregáveis

1. Repositório com estrutura completa do projeto
2. Backend funcional com todas as APIs (ou MVP)
3. Frontend com UI completa do Spotify (clonada)
4. App mobile funcional (opcional)
5. Documentação completa (README, API docs)
6. Scripts de deploy e CI/CD
7. Docker configuration (dev, staging, prod)
8. Testes automatizados (backend e frontend)

## Timeline Estimada

- **Fase 1** (Análise): 3-5 dias
- **Fase 2** (Backend): 7-10 dias
- **Fase 3** (Frontend): 10-14 dias
- **Fase 4** (Mobile): 5-7 dias (opcional)
- **Fase 5** (Deploy): 3-5 dias
- **Fase 6** (Manutenção): Contínuo

**Total estimado**: 28-44 dias (sem contar mobile)

## Riscos e Desafios

1. **Complexidade**: A replicação do Spotify é complexa, focar no MVP primeiro
2. **API Limitações**: Lidar com limitações da API de dados do Spotify
3. **Performance**: Otimizar player e upload de arquivos
4. **Legal**: Usar dados do Spotify para fins educacionais (não comerciais)
5. **Docker**: Configurar Docker bem feito para monorepo

## Observações Importantes

- Este é um projeto **educacional**, não para uso comercial
- Dados do Spotify são apenas para **demo/prototype**
- Implementação de upload e funcionalidades originais é o foco
- Mobile pode ser desenhado ou reutilizado do web (Expo)
- Spring AI é **opcional** e pode ser implementado depois
- Supabase pode ser usado para simplificar DB + Auth em vez de começar do zero
