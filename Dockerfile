# Stage 1: Build the Node.js application (if you had build steps like Webpack)
# For this simple app, we mostly copy and install dependencies.
FROM node:20-alpine AS build

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
# We do this separately to leverage Docker's layer caching
COPY package*.json ./

# Install dependencies
# Using --omit=dev to not install devDependencies in the final image
RUN npm install --omit=dev

# Copy the rest of your application code to the working directory
COPY . .

# Build client-side assets (if any, though not strictly needed for this simple app's frontend)
# If you had a build process for your /public folder, you'd add it here, e.g.:
# RUN npm run build-client

# Stage 2: Production-ready image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the build stage
# Copy node_modules from the build stage
COPY --from=build /app/node_modules ./node_modules
# Copy application code (excluding node_modules as they're copied above)
# The .dockerignore file will prevent copying node_modules, .env, etc. again.
COPY . .

# Expose the port your Express app listens on
EXPOSE 3000

# Command to run your application when the container starts
# Use 'node server.js' directly instead of 'npm start' if you didn't define a 'start' script
# If you have a 'start' script in package.json (like "node server.js"), then 'npm start' is fine.
CMD ["node", "server.js"]
