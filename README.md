# Nuxt 3 Minimal Starter

Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install the dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm run dev

# yarn
yarn dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm run build

# yarn
yarn build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm run preview

# yarn
yarn preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Deployment to Google Cloud Run

This section outlines the steps to build and deploy the application to Google Cloud Run, ensuring all necessary Supabase environment variables are correctly configured.

### 1. Build the Docker Image

You need to provide your Supabase Project URL and public key as build arguments. Replace `YOUR_SUPABASE_URL_HERE` and `YOUR_SUPABASE_KEY_HERE` with your actual Supabase credentials. You can find these in your Supabase project settings -> API (the `SUPABASE_KEY` typically refers to the `anon public` key).

```bash
docker build \
  --build-arg SUPABASE_URL="YOUR_SUPABASE_URL_HERE" \
  --build-arg SUPABASE_KEY="YOUR_SUPABASE_KEY_HERE" \
  -t awaybusdashboardnuxt:latest .
```

### 2. Push to Google Container Registry (GCR) or Artifact Registry

After building, tag and push your Docker image to your Google Container Registry. Replace `YOUR_PROJECT_ID` with your Google Cloud Project ID.

```bash
docker tag awaybusdashboardnuxt:latest gcr.io/YOUR_PROJECT_ID/awaybusdashboardnuxt:latest
docker push gcr.io/YOUR_PROJECT_ID/awaybusdashboardnuxt:latest
```

### 3. Deploy to Google Cloud Run

When deploying or updating your Cloud Run service, you **must** configure the environment variables for the service. Go to your Cloud Run service settings in the Google Cloud Console, navigate to "Revisions & deployment details" -> "Variables & Secrets" tab, and add the following environment variables:

*   `SUPABASE_URL`: Your Supabase Project URL
*   `SUPABASE_KEY`: Your Supabase `anon public` key
*   `NODE_ENV`: `production` (ensure this is set for production behavior)

These runtime environment variables are crucial for your Nuxt application to connect to Supabase and will override any variables set during the Docker build process, providing a more secure and flexible configuration.

