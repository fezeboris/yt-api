# Dockerfile

# Stage 1: Use an official Node.js image. Alpine is lightweight.
FROM node:18-alpine AS base

# Stage 2: Install system dependencies needed for yt-dlp
# We need Python, pip for installing, and ffmpeg (a common yt-dlp dependency)
RUN apk add --no-cache python3 py3-pip ffmpeg

# Stage 3: Install yt-dlp globally using pip
RUN pip install yt-dlp

# Stage 4: Setup our Next.js application environment
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