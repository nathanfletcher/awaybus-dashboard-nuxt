# Base node image for building
FROM node:20-alpine as builder
WORKDIR /app

# Copy dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source and build Nuxt (produces .output directory)
COPY . .
RUN yarn build

# Final production image
FROM node:20-alpine
WORKDIR /app

# Copy the built output and dependencies
COPY --from=builder /app/.output ./.output

# Expose the port Cloud Run expects
EXPOSE 8080
ENV PORT=8080
ENV HOST=0.0.0.0
ENV NODE_ENV=production

# Start the built Nuxt server
CMD ["node", ".output/server/index.mjs"]