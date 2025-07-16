# Use a minimal Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy source code
COPY dist/ .

# Expose port
EXPOSE 3000

# Run the app
CMD ["node", "index.js"]
