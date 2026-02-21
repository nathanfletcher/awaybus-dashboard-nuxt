#!/bin/bash
set -e

echo "🚀 Building container image via Google Cloud Build..."
gcloud builds submit --tag gcr.io/ketecode-java/awaybus-dashboard --quiet

echo "☁️ Deploying to Cloud Run (europe-west1)..."
# Read variables from .env to deploy (Note: The user should ensure .env contains prod variables before running)
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  gcloud run deploy awaybus-dashboard \
    --image gcr.io/ketecode-java/awaybus-dashboard \
    --region europe-west1 \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars SUPABASE_URL="$SUPABASE_URL",SUPABASE_KEY="$SUPABASE_KEY" \
    --port 8080
else
  echo "⚠️  No .env file found. Deploying with existing environment variables."
  gcloud run deploy awaybus-dashboard \
    --image gcr.io/ketecode-java/awaybus-dashboard \
    --region europe-west1 \
    --platform managed \
    --allow-unauthenticated \
    --port 8080
fi

echo "✅ Deployment complete!"
