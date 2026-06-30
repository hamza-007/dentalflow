# ---- build ----
FROM golang:1.25-alpine AS build
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
# Migrations are embedded (go:embed) → the binaries are fully self-contained.
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/server  ./cmd/server  \
 && CGO_ENABLED=0 GOOS=linux go build -o /out/seed     ./cmd/seed     \
 && CGO_ENABLED=0 GOOS=linux go build -o /out/seed-kb  ./cmd/seed-kb

# ---- run ----
FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app

COPY --from=build /out/ /app/
# KB seed file (seed-kb reads it from disk).
COPY --from=build /src/internal/kb/seed /app/kb-seed
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENV API_PORT=8080
EXPOSE 8080

# Entrypoint optionally self-seeds (SEED_ON_START / SEED_KB_ON_START), then runs
# the server. Migrations run automatically on boot (or from the seed tools).
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["/app/server"]
