# Polkablocks Docker Setup

This Docker setup provides a complete development environment for the Polkablocks project, including:

- PostgreSQL database
- Moonbeam development node (Polkadot-EVM compatible)
- Automatic contract deployment
- Backend API service
- Frontend Next.js application

## Prerequisites

- Docker and Docker Compose installed
- Git
- (Optional) Make utility for running commands

## Quick Start

1. Clone the repository:
```bash
git clone <your-repo-url>
cd polkablocks
```

2. Copy the environment file:
```bash
cp .env.example .env
```

3. Run the deployment script:
```bash
./scripts/deploy.sh
```

Or manually with Docker Compose:

```bash
# Start all services
docker-compose --profile moonbeam up -d

# Deploy contracts
docker-compose --profile deploy run --rm contract-deployer

# View logs
docker-compose logs -f
```

## Services

### PostgreSQL Database
- Port: 5432
- Database: polkadot_wallets
- User: postgres
- Password: postgres

### Moonbeam Development Node
- EVM RPC: http://localhost:8545
- EVM WebSocket: ws://localhost:8546
- Prometheus metrics: http://localhost:9616

### Backend API
- Port: 3001
- Endpoint: http://localhost:3001/api

### Frontend
- Port: 3000
- URL: http://localhost:3000

## Common Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Rebuild services
docker-compose build

# Deploy contracts only
docker-compose --profile deploy run --rm contract-deployer

# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d polkadot_wallets

# Access Moonbeam console
docker-compose exec moonbeam-dev /bin/bash
```

## Development Accounts

The Moonbeam development node comes with pre-funded accounts:

- Account 1: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
- Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

- Account 2: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
- Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

## Troubleshooting

1. If containers fail to start, check logs:
```bash
docker-compose logs [service-name]
```

2. To reset the environment:
```bash
docker-compose down -v
rm -rf frontend/node_modules backend/node_modules
docker-compose build --no-cache
```

3. If ports are already in use:
```bash
# Check what's using the ports
lsof -i :3000
lsof -i :3001
lsof -i :5432
lsof -i :8545
```

## Production Considerations

- Change default passwords and private keys
- Use proper SSL/TLS certificates
- Configure proper network isolation
- Set up monitoring and logging
- Use managed database services
- Configure proper backup strategies