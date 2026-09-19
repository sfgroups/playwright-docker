#!/bin/bash
set -e

CERT_DIR="./nginx/certs"

# Step 1: Ensure Host SSL Certificates exist or prompt user to copy them
if [ ! -f "$CERT_DIR/server.crt" ] || [ ! -f "$CERT_DIR/server.key" ]; then
    echo "⚠️  Missing host SSL certificates in $CERT_DIR/"
    echo "⚙️  Generating fallback self-signed SSL certificates from your host..."
    mkdir -p "$CERT_DIR"
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$CERT_DIR/server.key" \
        -out "$CERT_DIR/server.crt" \
        -subj "/C=US/ST=State/L=City/O=Organization/OU=Testing/CN=localhost"
    echo "✅ Generated cert and key locally on host."
fi

# Step 2: Build and boot environment
echo "🚀 Booting up Docker environment..."
docker compose up -d --build

# Step 3: Automatically execute tests
echo "🧪 Running Playwright tests inside the container..."
set +e
docker compose exec playwright npm run test
TEST_EXIT_CODE=$?
set -e

# Step 4: Automate starting up the viewers asynchronously 
echo "📊 Launching secure Trace Viewer and HTML Report servers..."
docker compose exec -d playwright npm run show-trace
docker compose exec -d playwright npm run show-report

echo "========================================================="
echo "✅ Workflow Complete!"
echo "🔐 Secure Trace Viewer: https://localhost"
echo "🔐 Secure HTML Report:   https://localhost:444"
echo "========================================================="
echo "Press [CTRL+C] at any time to shut down the servers."

trap "echo '🛑 Shutting down containers...'; docker compose down; exit" INT
while true; do sleep 1; done
