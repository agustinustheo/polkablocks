#!/bin/bash

echo "Starting Polkablocks Docker Environment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
fi

# Build and start services
echo "Building Docker images..."
docker-compose build

echo "Starting database service..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 5

echo "Starting Moonbeam development node..."
docker-compose --profile moonbeam up -d moonbeam-dev

# Wait for blockchain to be ready
echo "Waiting for blockchain to be ready..."
sleep 15

echo "Deploying smart contracts..."
docker-compose --profile deploy run --rm contract-deployer

echo "Starting backend and frontend services..."
docker-compose up -d backend frontend

echo "All services started successfully!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:3001"
echo "Moonbeam RPC: http://localhost:8545"
echo "PostgreSQL: localhost:5432"