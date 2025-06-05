# Stage 1: Install dependencies and build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json* ./

# Install dependencies using npm
# Using --omit=dev for a smaller production install if devDependencies are not needed for the build
# However, some build tools might be in devDependencies. `npm ci` is generally safer.
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Next.js application
# The NEXT_PUBLIC_ variables need to be available at build time if they influence static generation
# For client-side usage, they are embedded during the build.
# For server-side usage in standalone mode, they need to be passed at runtime.
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
# Genkit might use GOOGLE_API_KEY if it's set in your .env for development
ARG GOOGLE_API_KEY

ENV NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID}
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}
ENV NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID}
ENV GOOGLE_API_KEY=${GOOGLE_API_KEY}

RUN npm run build

# Stage 2: Create the production image from the standalone output
FROM node:20-alpine AS runner
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
# Optionally, set the port Next.js will run on, default is 3000
# ENV PORT=3000

# Copy the standalone output from the builder stage
# This includes the server.js, .next/server, and node_modules folders from the standalone output
COPY --from=builder /app/.next/standalone ./
# Copy the public and static assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# Expose the port the app runs on (Next.js default is 3000)
EXPOSE 3000

# Command to run the application
# The server.js file in .next/standalone is the entry point
CMD ["node", "server.js"]
