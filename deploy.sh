#!/usr/bin/env bash
#
# community-hub-admin — build + deploy the Vite/React SPA to Cloud Run.
# Idempotent: safe to re-run.
#
# The Stripe publishable key + API URLs are inlined by Vite at BUILD time, so
# they must be passed as Docker --build-arg (via cloudbuild.yaml). Cloud Run's
# --set-build-env-vars does NOT reach a Dockerfile build — that silently shipped
# an empty Stripe key before, causing "VITE_STRIPE_PUBLISHABLE_KEY is not set".
#
#   ./deploy.sh
#
# The Stripe key is taken from $VITE_STRIPE_PUBLISHABLE_KEY, else from .env.
# Override for a live deploy:
#   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx ./deploy.sh
#
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-daily-spark-b2cbe}"
REGION="${GCP_REGION:-us-central1}"
SERVICE="community-hub-admin"
DOMAIN="${DOMAIN:-community.diaspoplug.com}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AR_REPO="cloud-run-source-deploy"

# Public build-time config baked into the bundle (see Dockerfile / cloudbuild.yaml).
VITE_GRAPHQL_ENDPOINT="${VITE_GRAPHQL_ENDPOINT:-https://api.diaspoplug.net/graphql}"
VITE_MESSAGE_WS_URL="${VITE_MESSAGE_WS_URL:-https://api.diaspoplug.net}"
VITE_STRIPE_PUBLISHABLE_KEY="${VITE_STRIPE_PUBLISHABLE_KEY:-}"

gc() { gcloud "$@" --project "$PROJECT_ID"; }
say() { echo -e "\n▶ $*"; }

# Fall back to the local .env key if none was passed in the environment.
if [[ -z "$VITE_STRIPE_PUBLISHABLE_KEY" && -f "$SCRIPT_DIR/.env" ]]; then
  VITE_STRIPE_PUBLISHABLE_KEY="$(grep -E '^VITE_STRIPE_PUBLISHABLE_KEY=' "$SCRIPT_DIR/.env" | head -1 | cut -d= -f2- | tr -d '\r"'"'"'')"
  [[ -n "$VITE_STRIPE_PUBLISHABLE_KEY" ]] && echo "Using VITE_STRIPE_PUBLISHABLE_KEY from .env"
fi

# Guard: an empty key produces a build that throws at runtime. Fail loudly
# unless the caller explicitly opts out (payments intentionally disabled).
if [[ -z "$VITE_STRIPE_PUBLISHABLE_KEY" && "${ALLOW_EMPTY_STRIPE_KEY:-}" != "1" ]]; then
  echo "ERROR: VITE_STRIPE_PUBLISHABLE_KEY is empty. The build would throw" >&2
  echo "       'VITE_STRIPE_PUBLISHABLE_KEY is not set' at runtime." >&2
  echo "       Set it (pk_test_… or pk_live_…) or add it to .env, or run with" >&2
  echo "       ALLOW_EMPTY_STRIPE_KEY=1 to deploy without payments." >&2
  exit 1
fi
echo "Stripe key: ${VITE_STRIPE_PUBLISHABLE_KEY:0:8}… (len ${#VITE_STRIPE_PUBLISHABLE_KEY})"

TAG="$(git -C "$SCRIPT_DIR" rev-parse --short HEAD 2>/dev/null || echo manual)-$(date +%Y%m%d%H%M%S)"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/${SERVICE}:${TAG}"

say "Enabling required APIs"
gc services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

say "Build image with build-args ($IMAGE)"
gc builds submit "$SCRIPT_DIR" \
  --config "$SCRIPT_DIR/cloudbuild.yaml" \
  --substitutions="_IMAGE=${IMAGE},_VITE_GRAPHQL_ENDPOINT=${VITE_GRAPHQL_ENDPOINT},_VITE_MESSAGE_WS_URL=${VITE_MESSAGE_WS_URL},_VITE_STRIPE_PUBLISHABLE_KEY=${VITE_STRIPE_PUBLISHABLE_KEY}"

say "Deploy Cloud Run service ($SERVICE @ $REGION)"
gc run deploy "$SERVICE" --region "$REGION" \
  --image "$IMAGE" \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi --cpu 1 --min-instances 0 --max-instances 4

say "Service URL"
gc run services describe "$SERVICE" --region "$REGION" --format="value(status.url)"

say "Map custom domain $DOMAIN (add the printed DNS records at your registrar)"
gc beta run domain-mappings create --service "$SERVICE" --domain "$DOMAIN" --region "$REGION" \
  2>/dev/null || echo "  mapping already exists"
echo "  DNS records to create for $DOMAIN:"
gc beta run domain-mappings describe --domain "$DOMAIN" --region "$REGION" \
  --format="table(status.resourceRecords[].name, status.resourceRecords[].type, status.resourceRecords[].rrdata)" \
  2>/dev/null || echo "  (re-run describe once the mapping is created)"
