# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack **Blindtest Musical** application - a real-time multiplayer music quiz game with the following architecture:

- **API**: Node.js/Express + Socket.IO + TypeORM (MariaDB)
- **Web**: Angular 20 PWA with real-time features
- **Database**: MariaDB with comprehensive game entities
- **Real-time**: WebSocket communication for live gameplay

## Development Commands

### Core Development
```bash
# Start full development environment (API + Web)
npm run dev

# Start individual services
npm run dev:api      # API with nodemon hot reload
npm run start:web    # Angular dev server with proxy
```

### Database Operations
```bash
# Run database migrations
npm run migrate:run

# Seed demo data for testing
npm run seed:demo

# Generate new migration
npm run migrate:generate
```

### Build & Production
```bash
# Build both applications
npm run build

# Lint entire monorepo
npm run lint

# Format code
npm run format
```

### Health Checks
```bash
# Validate system components
npm run validate:system -w @blindtest/api

# Check API health endpoint
npm run check:health -w @blindtest/api
```

## Application Architecture

### Backend Structure (`apps/api/src/`)

**Modular API design** with feature-based organization:
- `modules/` - Business logic modules (events, teams, players, rounds, songs, answers, scores, auth, csv, settings)
- `db/entities/` - TypeORM entities (Event, Team, Player, Round, RoundSong, Answer, Score, Organizer, EventStaff)
- `middlewares/` - Security, validation, rate limiting, temporal security
- `services/` - Shared services (logger, etc.)
- `ws/` - WebSocket/Socket.IO real-time communication
- `types/` - TypeScript type definitions

**Key API Features:**
- JWT authentication with role-based access
- Rate limiting and security middleware (helmet, CORS)
- CSV import/export functionality
- Real-time WebSocket events for live gameplay
- Comprehensive logging with Winston

### Frontend Structure (`apps/web/src/`)

**Angular feature-based architecture:**
- `app/features/` - Lazy-loaded feature modules:
  - `admin/` - Event management and configuration
  - `player/` - Player interface for joining games
  - `dj/` - DJ controls for managing rounds
  - `display/` - Public display for game visualization
  - `home/` - Landing page
- `app/core/` - Core services and guards
- `app/shared/` - Shared components and utilities

**Navigation Structure:**
- `/` or `/home` - Landing page
- `/admin` - Event management interface
- `/join/:eventCode` - Player join interface
- `/dj/:eventCode` - DJ control panel
- `/display/:eventCode` - Public display screen

### Real-time Communication

**WebSocket Roles** (defined in socket.ts):
- `PLAYER` - Game participants
- `DJ` - Game master controlling rounds
- `ADMIN` - Event administrator
- `DISPLAY` - Public display screen

**Socket Events:** Events are handled in real-time for live gameplay synchronization across all connected clients.

## Database Schema

**Core Entities:**
- `Organizer` - Event organizers/admins
- `Event` - Game events with unique codes
- `EventStaff` - Staff assignments to events
- `Team` - Player teams within events
- `Player` - Individual participants
- `Round` - Game rounds within events
- `RoundSong` - Songs used in each round
- `Answer` - Player responses to songs
- `Score` - Team scoring system

## Environment Configuration

**API Environment** (`.env` in `apps/api/`):
```env
NODE_ENV=development
API_PORT=3000
API_HOST=0.0.0.0

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=blindtest

JWT_SECRET=dev-secret
CORS_ORIGIN=http://localhost:4200
```

## Development Workflow

1. **Database Setup:** Ensure MariaDB is running and run migrations
2. **Environment:** Copy `.env.example` to `.env` in `apps/api/`
3. **Development:** Use `npm run dev` for full-stack development
4. **Testing:** Use system validation script for health checks

## Key Technologies

**Backend:**
- Express.js with TypeScript
- Socket.IO for real-time communication
- TypeORM for database ORM
- JWT for authentication
- Winston for logging
- Security: Helmet, CORS, rate limiting

**Frontend:**
- Angular 20 with standalone components
- PWA capabilities
- Socket.IO client for real-time features
- Lazy-loaded feature routing

**Database:**
- MariaDB with TypeORM entities
- Migration-based schema management