# Skyvix

Modern full-stack web application built with NextJS, NestJS, and PostgreSQL.

## Tech Stack

- **Frontend**: NextJS 14 + shadcn/ui + TailwindCSS
- **Backend**: NestJS + TypeORM + PostgreSQL
- **Package Manager**: Bun
- **Payment**: Xendit
- **Architecture**: Monorepo with Turborepo

## Quick Start

### Prerequisites

- Bun >= 1.0.0
- Node.js >= 18.0.0
- Docker (optional)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd skyvix
```

2.Install dependencies:

```bash
bun install
```

3.Setup environment variables:

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env
```

4.Start PostgreSQL (using Docker):

```bash
docker run --name skyvix-postgres -e POSTGRES_DB=skyvix -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15-alpine
```

5.Start development servers:

```bash
bun dev
```

This will start:

- Frontend: <http://localhost:3000>
- Backend: <http://localhost:3001>

## Scripts

- `bun dev` - Start all development servers
- `bun build` - Build all packages
- `bun lint` - Lint all packages
- `bun type-check` - Type check all packages

## Docker

Build and run with Docker:

```bash
bun docker:build
bun docker:up
```

## Project Structure

skyvix/
├── apps/
│   ├── frontend/          # NextJS application
│   └── backend/           # NestJS API
├── packages/
│   ├── shared/            # Shared types and utilities
│   └── ui/                # Shared UI components (shadcn/ui)
├── docker/                # Docker configuration
└── ...

## Features

- 🔥 **Modern Stack**: NextJS 14, NestJS, PostgreSQL
- 🎨 **Beautiful UI**: shadcn/ui components with TailwindCSS
- 🔒 **Authentication**: JWT-based auth with Passport
- 💳 **Payments**: Xendit integration
- 🐳 **Docker**: Containerized backend
- 📦 **Monorepo**: Turborepo for efficient development
- 🚀 **TypeScript**: Full type safety across the stack

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
