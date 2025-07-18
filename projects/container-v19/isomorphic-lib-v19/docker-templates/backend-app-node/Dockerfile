# Use a minimal Node.js image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy source code
COPY . .

# Install Node.js deps
RUN npm install

# Expose port
EXPOSE 3000

# Run the app
CMD ["node", "run.js"]
