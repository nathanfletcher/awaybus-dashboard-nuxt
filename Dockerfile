FROM node:24-alpine as builder
WORKDIR /app

# Define ARGs
ARG SUPABASE_URL
ARG SUPABASE_KEY

# Convert ARGs to ENVs so Nuxt can see them during 'yarn build'
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_KEY=$SUPABASE_KEY

COPY package.json yarn.lock ./
RUN apk add --no-cache python3 make g++ && rm -f package-lock.json && yarn install --frozen-lockfile

COPY . .
RUN yarn build

FROM node:24-alpine
WORKDIR /app
COPY --from=builder /app/.output ./.output

ENV PORT=8080
ENV HOST=0.0.0.0
ENV NODE_ENV=production

EXPOSE 8080
CMD ["node", ".output/server/index.mjs"]