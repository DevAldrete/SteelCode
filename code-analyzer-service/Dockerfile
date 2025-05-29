# Stage 1: Builder
FROM golang:1.22-alpine AS builder

# Set necessary environment variables
ENV CGO_ENABLED=0
ENV GOOS=linux
ENV GOARCH=amd64

WORKDIR /app

# Copy go.mod and go.sum files to download dependencies
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# Copy the rest of the application source code
COPY . .

# Compile the application
# Using -ldflags="-s -w" to strip debug information and reduce binary size
RUN go build -ldflags="-s -w" -o /server cmd/server/main.go


# Stage 2: Runner
FROM alpine:latest

WORKDIR /app

# Install Python, pip, and then Ruff
RUN apk add --no-cache python3 py3-pip && \
    pip install --no-cache-dir ruff && \
    ruff --version

# Create a non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy the compiled binary from the builder stage
COPY --from=builder /server /app/server

# Copy the configs directory
COPY configs /app/configs

# Change ownership to the non-root user
# Ensure the /app directory and its contents are owned by appuser
RUN chown -R appuser:appgroup /app
# Also ensure the user has execute permissions on the binary
RUN chmod +x /app/server

# Switch to the non-root user
USER appuser

# Expose the port the server runs on (default 8080, as per config.yaml)
EXPOSE 8080

# Command to run the application
CMD ["/app/server"]
