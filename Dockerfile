# Dockerfile

# Stage 1: Use an official Node.js image. Alpine is lightweight.
FROM node:18-alpine AS base

# Stage 2: Install system dependencies. 
# We now install yt-dlp directly from the apk package manager, which is the correct way.
# This also installs Python and other necessary dependencies automatically.
RUN apk add --no-cache yt-dlp ffmpeg

# Stage 3: Setup our Next.js application environment
WORKDIR /app

# Copy package files and install Node dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your application code into the container
COPY . .

# Build the Next.js production app
RUN npm run build

# Tell Docker what command to run when the container starts
CMD ["npm", "start"]