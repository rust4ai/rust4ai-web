# syntax=docker/dockerfile:1.7

############################
# Stage 1: build frontend
############################
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

############################
# Stage 2: cargo-chef plan
############################
FROM lukemathwalker/cargo-chef:latest-rust-1.83 AS chef
WORKDIR /app

FROM chef AS planner
COPY Cargo.toml Cargo.lock ./
COPY backend/ ./backend/
RUN cargo chef prepare --recipe-path recipe.json

############################
# Stage 3: build backend
############################
FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY Cargo.toml Cargo.lock ./
COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
RUN cargo build --release --bin rust4ai

############################
# Stage 4: minimal runtime
############################
FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/rust4ai /usr/local/bin/rust4ai
COPY backend/migrations ./migrations
ENV RUST_LOG=info
EXPOSE 8080
CMD ["rust4ai"]
