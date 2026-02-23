#!/bin/bash
set -e

# Load local vars
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions=_SUPABASE_URL="${SUPABASE_URL}",_SUPABASE_KEY="${SUPABASE_KEY}"

PROJECT_ID=$(gcloud config get-value project)

gcloud run deploy awaybus-dashboard \
  --image gcr.io/${PROJECT_ID}/awaybus-dashboard \
  --region europe-west1 \
  --set-env-vars SUPABASE_URL="${SUPABASE_URL}",SUPABASE_KEY="${SUPABASE_KEY}" \
  --port 8080 \
  --allow-unauthenticated