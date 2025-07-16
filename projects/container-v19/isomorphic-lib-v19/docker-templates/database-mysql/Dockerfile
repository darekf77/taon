FROM debian:bullseye

# Install MariaDB server, client, and Node.js
RUN apt-get update && \
    apt-get install -y mariadb-server mariadb-client curl gnupg ca-certificates && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create app dir
WORKDIR /app

# Copy files
COPY . .

# Install Node.js deps
RUN npm install

# Ensure entrypoint is executable
RUN chmod +x /app/entrypoint.sh

EXPOSE 3306 3000

ENTRYPOINT ["bash", "/app/entrypoint.sh"]
