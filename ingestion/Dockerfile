# syntax=docker/dockerfile:1
# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM golang:1.21-alpine AS builder

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /ingestion ./cmd/server

# ── Stage 2: Minimal runtime ────────────────────────────────────────────────────
FROM scratch

COPY --from=builder /ingestion /ingestion

EXPOSE 10000/udp
EXPOSE 10001/tcp

ENTRYPOINT ["/ingestion"]
