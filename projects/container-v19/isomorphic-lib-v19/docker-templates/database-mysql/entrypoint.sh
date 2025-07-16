#!/bin/bash

set -a
source /app/.env
set +a

# Ensure socket directory exists and is owned by mysql
mkdir -p /run/mysqld
chown mysql:mysql /run/mysqld

# Start mysqld manually as mysql user
su -s /bin/bash mysql -c "/usr/sbin/mysqld &"

# Wait for MariaDB to be ready
until mysqladmin ping -h "127.0.0.1" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --silent; do
  echo "Waiting for MariaDB..."
  sleep 2
done

echo "✅ MariaDB is ready!"

# Create DB + user (idempotent)
mysql -uroot <<EOF
  CREATE DATABASE IF NOT EXISTS $MYSQL_DATABASE;
  CREATE USER IF NOT EXISTS '$MYSQL_USER'@'%' IDENTIFIED BY '$MYSQL_PASSWORD';
  GRANT ALL PRIVILEGES ON $MYSQL_DATABASE.* TO '$MYSQL_USER'@'%';
  FLUSH PRIVILEGES;
EOF

# Start health check server
node /app/health-check.js
