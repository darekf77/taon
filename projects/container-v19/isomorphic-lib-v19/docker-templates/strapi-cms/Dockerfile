FROM node:20-slim

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .

COPY .env.strapi .env

EXPOSE 1337

CMD ["node", "dist/server.js"]
